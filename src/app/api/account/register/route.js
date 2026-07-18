import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { setCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
}

function isValidEmail(email) {
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
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

  const randomPart = crypto.randomUUID()
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
    createdAt: customer.createdAt,
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
        [suppliedFirstName, suppliedLastName]
          .filter(Boolean)
          .join(" ")
      );

    const email = normalizeEmail(
      requestBody?.email
    );

    const password = requestBody?.password;

    const confirmPassword =
      requestBody?.confirmPassword;

    const phone = normalizeText(
      requestBody?.phone
    ).slice(0, 30);

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
      process.env.MONGODB_DB || "obsidian"
    );

    const customersCollection =
      db.collection("customers");

    try {
      await customersCollection.createIndex(
        {
          email: 1,
        },
        {
          unique: true,
          name: "unique_customer_email",
        }
      );
    } catch (indexError) {
      console.error(
        "Customer email index warning:",
        indexError
      );
    }

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

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

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

      passwordHash,

      status: "active",
      accountStatus: "active",

      emailVerified: false,
      emailVerifiedAt: null,

      phoneVerified: false,
      phoneVerifiedAt: null,

      marketingConsent,
      marketingConsentAt: marketingConsent
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

    const createdCustomer = {
      ...customerDocument,
      _id: insertResult.insertedId,
    };

    await setCustomerSession(
      createdCustomer
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Your OBSIDIAN account has been created.",
        customer:
          serializeCustomer(
            createdCustomer
          ),
      },
      {
        status: 201,
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