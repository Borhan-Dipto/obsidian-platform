import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { setCustomerSession } from "@/lib/customerAuth";
import { ORDERS_COLLECTION_NAME } from "@/lib/orderPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 14;

const COMPLETED_ORDER_STATUSES = new Set([
  "completed",
  "delivered",
]);

const CANCELLED_ORDER_STATUSES = new Set([
  "cancelled",
  "canceled",
  "refunded",
  "returned",
]);

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MAX_PHONE_LENGTH);
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
}

function normalizeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function escapeRegExp(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function isValidEmail(email) {
  if (!email || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (typeof password !== "string") {
    return {
      valid: false,
      message: "Password is required.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long.",
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message:
        "Password cannot exceed 128 characters.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one number.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

function splitFullName(fullName) {
  const nameParts = normalizeName(fullName)
    .split(" ")
    .filter(Boolean);

  if (nameParts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      lastName: "",
    };
  }

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
  };
}

function createCustomerId() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `OBS-CUS-${timestamp}-${randomPart}`;
}

function createErrorResponse(
  message,
  status,
  field = null
) {
  return NextResponse.json(
    {
      success: false,
      message,
      field,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function serializeCustomer(customer) {
  return {
    id: String(customer._id),
    customerId: customer.customerId,
    fullName: customer.fullName,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    emailVerified: customer.emailVerified,
    totalOrders: customer.totalOrders || 0,
    completedOrders:
      customer.completedOrders || 0,
    cancelledOrders:
      customer.cancelledOrders || 0,
    totalSpent: customer.totalSpent || 0,
    createdAt: customer.createdAt,
  };
}

async function ensureRegistrationIndexes(
  customersCollection,
  ordersCollection
) {
  try {
    await Promise.all([
      customersCollection.createIndex(
        {
          email: 1,
        },
        {
          unique: true,
          name: "unique_customer_email",
        }
      ),

      ordersCollection.createIndex(
        {
          customerId: 1,
          createdAt: -1,
        },
        {
          name: "orders_customer_id",
          partialFilterExpression: {
            customerId: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          customerAccountId: 1,
          createdAt: -1,
        },
        {
          name: "orders_customer_account",
          partialFilterExpression: {
            customerAccountId: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          "customer.email": 1,
          createdAt: -1,
        },
        {
          name: "orders_customer_email",
        }
      ),

      ordersCollection.createIndex(
        {
          "customer.phone": 1,
          createdAt: -1,
        },
        {
          name: "orders_customer_phone",
        }
      ),
    ]);
  } catch (indexError) {
    console.warn(
      "Customer registration index warning:",
      indexError?.message || indexError
    );
  }
}

function createUnlinkedOrderFilter() {
  return {
    $and: [
      {
        $or: [
          {
            customerId: {
              $exists: false,
            },
          },
          {
            customerId: null,
          },
          {
            customerId: "",
          },
        ],
      },
      {
        $or: [
          {
            customerAccountId: {
              $exists: false,
            },
          },
          {
            customerAccountId: null,
          },
          {
            customerAccountId: "",
          },
        ],
      },
    ],
  };
}

function createGuestOrderIdentityFilter({
  email,
  phone,
  fullName,
}) {
  const identityFilters = [];

  if (email) {
    identityFilters.push({
      "customer.email": {
        $regex: `^${escapeRegExp(email)}$`,
        $options: "i",
      },
    });
  }

  if (phone && fullName) {
    identityFilters.push({
      $and: [
        {
          "customer.phone": phone,
        },
        {
          "customer.fullName": {
            $regex: `^${escapeRegExp(fullName)}$`,
            $options: "i",
          },
        },
        {
          $or: [
            {
              "customer.email": {
                $exists: false,
              },
            },
            {
              "customer.email": null,
            },
            {
              "customer.email": "",
            },
            {
              "customer.email": {
                $regex: `^${escapeRegExp(email)}$`,
                $options: "i",
              },
            },
          ],
        },
      ],
    });
  }

  if (identityFilters.length === 0) {
    return null;
  }

  return {
    $or: identityFilters,
  };
}

async function linkGuestOrders({
  ordersCollection,
  customer,
  now,
}) {
  const identityFilter =
    createGuestOrderIdentityFilter({
      email: customer.email,
      phone: customer.phoneNormalized,
      fullName: customer.fullName,
    });

  if (!identityFilter) {
    return 0;
  }

  const unlinkedFilter =
    createUnlinkedOrderFilter();

  const result = await ordersCollection.updateMany(
    {
      $and: [
        ...unlinkedFilter.$and,
        identityFilter,
      ],
    },
    {
      $set: {
        customerId: customer.customerId,
        customerAccountId: String(customer._id),

        customerLinkedAt: now,
        customerLinkSource:
          "account_registration",

        "customer.customerId":
          customer.customerId,

        "customer.accountId":
          String(customer._id),

        "customer.accountEmail":
          customer.email,

        "customer.accountPhone":
          customer.phoneNormalized,

        updatedAt: now,
      },
    }
  );

  return result.modifiedCount;
}

async function calculateCustomerOrderStats({
  ordersCollection,
  customer,
}) {
  const orders = await ordersCollection
    .find(
      {
        $or: [
          {
            customerId: customer.customerId,
          },
          {
            customerAccountId: String(
              customer._id
            ),
          },
        ],
      },
      {
        projection: {
          status: 1,
          total: 1,
          pricing: 1,
        },
      }
    )
    .toArray();

  let completedOrders = 0;
  let cancelledOrders = 0;
  let totalSpent = 0;

  for (const order of orders) {
    const status = normalizeText(
      order.status
    ).toLowerCase();

    if (
      COMPLETED_ORDER_STATUSES.has(status)
    ) {
      completedOrders += 1;

      totalSpent += normalizeNumber(
        order?.pricing?.total ??
          order?.total
      );
    }

    if (
      CANCELLED_ORDER_STATUSES.has(status)
    ) {
      cancelledOrders += 1;
    }
  }

  return {
    totalOrders: orders.length,
    completedOrders,
    cancelledOrders,
    totalSpent:
      Math.round(totalSpent * 100) / 100,
  };
}

export async function POST(request) {
  try {
    let requestBody;

    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse(
        "Invalid request data.",
        400
      );
    }

    const suppliedFullName = normalizeName(
      requestBody?.fullName ||
        requestBody?.name
    );

    const suppliedFirstName = normalizeName(
      requestBody?.firstName
    );

    const suppliedLastName = normalizeName(
      requestBody?.lastName
    );

    const fullName =
      suppliedFullName ||
      normalizeName(
        [
          suppliedFirstName,
          suppliedLastName,
        ]
          .filter(Boolean)
          .join(" ")
      );

    const email = normalizeEmail(
      requestBody?.email
    );

    const password =
      requestBody?.password;

    const confirmPassword =
      requestBody?.confirmPassword;

    const phone = normalizeText(
      requestBody?.phone
    ).slice(0, 30);

    const phoneNormalized =
      normalizePhone(phone);

    const marketingConsent = Boolean(
      requestBody?.marketingConsent
    );

    const acceptedTerms = Boolean(
      requestBody?.acceptedTerms
    );

    if (!fullName) {
      return createErrorResponse(
        "Please enter your full name.",
        400,
        "fullName"
      );
    }

    if (fullName.length < 2) {
      return createErrorResponse(
        "Please enter a valid full name.",
        400,
        "fullName"
      );
    }

    if (!email) {
      return createErrorResponse(
        "Please enter your email address.",
        400,
        "email"
      );
    }

    if (!isValidEmail(email)) {
      return createErrorResponse(
        "Please enter a valid email address.",
        400,
        "email"
      );
    }

    if (
      phoneNormalized &&
      (
        phoneNormalized.length < 10 ||
        phoneNormalized.length > 14
      )
    ) {
      return createErrorResponse(
        "Please enter a valid phone number.",
        400,
        "phone"
      );
    }

    const passwordValidation =
      validatePassword(password);

    if (!passwordValidation.valid) {
      return createErrorResponse(
        passwordValidation.message,
        400,
        "password"
      );
    }

    if (
      typeof confirmPassword === "string" &&
      password !== confirmPassword
    ) {
      return createErrorResponse(
        "Passwords do not match.",
        400,
        "confirmPassword"
      );
    }

    if (!acceptedTerms) {
      return createErrorResponse(
        "You must accept the Terms and Privacy Policy.",
        400,
        "acceptedTerms"
      );
    }

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    const customersCollection =
      db.collection("customers");

    const ordersCollection =
      db.collection(
        ORDERS_COLLECTION_NAME
      );

    await ensureRegistrationIndexes(
      customersCollection,
      ordersCollection
    );

    const existingCustomer =
      await customersCollection.findOne(
        {
          email,
        },
        {
          projection: {
            _id: 1,
            status: 1,
          },
        }
      );

    if (existingCustomer) {
      return createErrorResponse(
        "An account with this email already exists. Please sign in instead.",
        409,
        "email"
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const {
      firstName,
      lastName,
    } = splitFullName(fullName);

    const now = new Date();

    const customerDocument = {
      customerId: createCustomerId(),

      fullName,
      name: fullName,
      firstName,
      lastName,

      email,
      emailNormalized: email,

      phone,
      phoneNormalized,

      passwordHash,

      status: "active",
      accountStatus: "active",

      emailVerified: false,
      emailVerifiedAt: null,

      phoneVerified: false,
      phoneVerifiedAt: null,

      marketingConsent,
      marketingConsentAt:
        marketingConsent
          ? now
          : null,

      termsAccepted: true,
      termsAcceptedAt: now,

      registrationSource: "website",
      authProvider: "credentials",

      avatar: null,

      dateOfBirth: null,
      gender: null,

      addresses: [],
      defaultShippingAddressId: null,
      defaultBillingAddressId: null,

      wishlist: [],
      recentlyViewed: [],

      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,

      loyaltyPoints: 0,
      loyaltyTier: "member",

      lastLoginAt: now,
      lastActiveAt: now,

      passwordChangedAt: now,

      createdAt: now,
      updatedAt: now,
    };

    let insertResult;

    try {
      insertResult =
        await customersCollection.insertOne(
          customerDocument
        );
    } catch (insertError) {
      if (insertError?.code === 11000) {
        return createErrorResponse(
          "An account with this email already exists. Please sign in instead.",
          409,
          "email"
        );
      }

      throw insertError;
    }

    let createdCustomer = {
      ...customerDocument,
      _id: insertResult.insertedId,
    };

    let linkedOrdersCount = 0;

    try {
      linkedOrdersCount =
        await linkGuestOrders({
          ordersCollection,
          customer: createdCustomer,
          now,
        });

      const orderStats =
        await calculateCustomerOrderStats({
          ordersCollection,
          customer: createdCustomer,
        });

      await customersCollection.updateOne(
        {
          _id: insertResult.insertedId,
        },
        {
          $set: {
            ...orderStats,
            guestOrdersLinkedAt:
              linkedOrdersCount > 0
                ? now
                : null,
            updatedAt: now,
          },
        }
      );

      createdCustomer = {
        ...createdCustomer,
        ...orderStats,
        guestOrdersLinkedAt:
          linkedOrdersCount > 0
            ? now
            : null,
      };
    } catch (linkError) {
      console.error(
        "Guest order linking warning:",
        linkError
      );
    }

    await setCustomerSession(
      createdCustomer
    );

    return NextResponse.json(
      {
        success: true,

        message:
          linkedOrdersCount > 0
            ? `Your OBSIDIAN account has been created and ${linkedOrdersCount} previous ${
                linkedOrdersCount === 1
                  ? "order has"
                  : "orders have"
              } been linked.`
            : "Your OBSIDIAN account has been created.",

        linkedOrdersCount,

        customer:
          serializeCustomer(
            createdCustomer
          ),
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Customer Registration Error:",
      error
    );

    return createErrorResponse(
      "We could not create your account right now. Please try again.",
      500
    );
  }
}