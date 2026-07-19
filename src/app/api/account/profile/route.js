import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  getCustomerSession,
  setCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 30;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
}

function normalizePhone(value) {
  return normalizeText(value)
    .replace(/\s+/g, " ")
    .slice(0, MAX_PHONE_LENGTH);
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

function createCustomerQuery(customerId) {
  const normalizedCustomerId =
    normalizeText(customerId);

  if (!normalizedCustomerId) {
    return {
      _id: null,
    };
  }

  const queryOptions = [
    {
      customerId: normalizedCustomerId,
    },
  ];

  if (ObjectId.isValid(normalizedCustomerId)) {
    queryOptions.unshift({
      _id: new ObjectId(normalizedCustomerId),
    });
  }

  return {
    $or: queryOptions,
  };
}

function serializeCustomer(customer) {
  if (!customer) {
    return null;
  }

  return {
    id: String(customer._id || ""),
    customerId: normalizeText(
      customer.customerId || customer._id
    ),
    fullName: normalizeName(
      customer.fullName ||
        customer.name ||
        [
          customer.firstName,
          customer.lastName,
        ]
          .filter(Boolean)
          .join(" ")
    ),
    firstName: normalizeName(
      customer.firstName
    ),
    lastName: normalizeName(
      customer.lastName
    ),
    email: normalizeText(customer.email),
    phone: normalizePhone(
      customer.phone ||
        customer.phoneNumber ||
        customer.mobile
    ),
    emailVerified: Boolean(
      customer.emailVerified
    ),
    phoneVerified: Boolean(
      customer.phoneVerified
    ),
    status:
      normalizeText(
        customer.status ||
          customer.accountStatus
      ) || "active",
    createdAt: customer.createdAt || null,
    updatedAt: customer.updatedAt || null,
  };
}

function createResponse(
  data,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function createErrorResponse(
  message,
  status,
  field = null
) {
  return createResponse(
    {
      success: false,
      message,
      field,
    },
    status
  );
}

async function getCustomersCollection() {
  const client = await clientPromise;

  if (
    !client ||
    typeof client.db !== "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  const databaseName =
    normalizeText(process.env.MONGODB_DB) ||
    "obsidian";

  return client
    .db(databaseName)
    .collection("customers");
}

async function getAuthenticatedCustomer() {
  const session =
    await getCustomerSession();

  if (!session?.customerId) {
    return {
      session: null,
      customer: null,
      collection: null,
    };
  }

  const collection =
    await getCustomersCollection();

  const customer =
    await collection.findOne(
      createCustomerQuery(
        session.customerId
      )
    );

  return {
    session,
    customer,
    collection,
  };
}

function isBlockedCustomer(customer) {
  const status = normalizeText(
    customer?.status ||
      customer?.accountStatus ||
      "active"
  ).toLowerCase();

  return [
    "disabled",
    "suspended",
    "blocked",
    "deleted",
    "inactive",
  ].includes(status);
}

export async function GET() {
  try {
    const {
      customer,
    } = await getAuthenticatedCustomer();

    if (!customer) {
      return createErrorResponse(
        "Please sign in to view your profile.",
        401
      );
    }

    if (isBlockedCustomer(customer)) {
      return createErrorResponse(
        "This account is currently unavailable.",
        403
      );
    }

    return createResponse({
      success: true,
      customer:
        serializeCustomer(customer),
    });
  } catch (error) {
    console.error(
      "Get Customer Profile Error:",
      error
    );

    return createErrorResponse(
      "We could not load your profile right now. Please try again.",
      500
    );
  }
}

export async function PATCH(request) {
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

    const {
      session,
      customer,
      collection,
    } = await getAuthenticatedCustomer();

    if (
      !session ||
      !customer ||
      !collection
    ) {
      return createErrorResponse(
        "Please sign in to update your profile.",
        401
      );
    }

    if (isBlockedCustomer(customer)) {
      return createErrorResponse(
        "This account is currently unavailable.",
        403
      );
    }

    const fullName = normalizeName(
      requestBody?.fullName ||
        requestBody?.name
    );

    const phone = normalizePhone(
      requestBody?.phone
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

    if (phone && phone.length < 6) {
      return createErrorResponse(
        "Please enter a valid phone number.",
        400,
        "phone"
      );
    }

    const {
      firstName,
      lastName,
    } = splitFullName(fullName);

    const now = new Date();

    const updateData = {
      fullName,
      name: fullName,
      firstName,
      lastName,
      phone,
      phoneNumber: phone,
      mobile: phone,
      updatedAt: now,
      lastActiveAt: now,
    };

    const phoneHasChanged =
      normalizePhone(
        customer.phone ||
          customer.phoneNumber ||
          customer.mobile
      ) !== phone;

    if (phoneHasChanged) {
      updateData.phoneVerified = false;
      updateData.phoneVerifiedAt = null;
    }

    const updateResult =
      await collection.findOneAndUpdate(
        {
          _id: customer._id,
        },
        {
          $set: updateData,
        },
        {
          returnDocument: "after",
        }
      );

    const updatedCustomer =
      updateResult?.value ||
      updateResult;

    if (!updatedCustomer?._id) {
      return createErrorResponse(
        "We could not update your profile right now.",
        500
      );
    }

    await setCustomerSession(
      updatedCustomer
    );

    return createResponse({
      success: true,
      message:
        "Your profile has been updated.",
      customer:
        serializeCustomer(
          updatedCustomer
        ),
    });
  } catch (error) {
    console.error(
      "Update Customer Profile Error:",
      error
    );

    return createErrorResponse(
      "We could not update your profile right now. Please try again.",
      500
    );
  }
}