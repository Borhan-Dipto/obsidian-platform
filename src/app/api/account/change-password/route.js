import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { enforcePublicJsonRequest } from "@/lib/publicApiSecurity";
import {
  getCustomerSession,
  setCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function createResponse(data, status = 200) {
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

  if (
    ObjectId.isValid(normalizedCustomerId)
  ) {
    queryOptions.unshift({
      _id: new ObjectId(
        normalizedCustomerId
      ),
    });
  }

  return {
    $or: queryOptions,
  };
}

function validateNewPassword(password) {
  if (typeof password !== "string") {
    return {
      valid: false,
      message:
        "Please enter your new password.",
    };
  }

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    return {
      valid: false,
      message:
        "New password must be at least 8 characters long.",
    };
  }

  if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    return {
      valid: false,
      message:
        "New password cannot exceed 128 characters.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message:
        "New password must contain at least one lowercase letter.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message:
        "New password must contain at least one uppercase letter.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message:
        "New password must contain at least one number.",
    };
  }

  return {
    valid: true,
    message: "",
  };
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
    normalizeText(
      process.env.MONGODB_DB
    ) || "obsidian";

  return client
    .db(databaseName)
    .collection("customers");
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

export async function POST(request) {
  try {
    const security =
      await enforcePublicJsonRequest(
        request,
        {
          action:
            "account-change-password",

          maxBodyBytes:
            32 * 1024,

          rateLimits: [
            {
              scope: "ip",
              limit: 20,
              windowMs:
                15 * 60 * 1000,
            },

            {
              scope: "session",
              limit: 10,
              windowMs:
                15 * 60 * 1000,

              identifier:
                (
                  _body,
                  currentRequest
                ) =>
                  currentRequest.headers.get(
                    "cookie"
                  ) || "",
            },
          ],
        }
      );

    if (!security.success) {
      return security.response;
    }

    const requestBody =
      security.body;

    const currentPassword =
      requestBody?.currentPassword;

    const newPassword =
      requestBody?.newPassword;

    const confirmPassword =
      requestBody?.confirmPassword;

    if (
      typeof currentPassword !==
        "string" ||
      currentPassword.length === 0
    ) {
      return createErrorResponse(
        "Please enter your current password.",
        400,
        "currentPassword"
      );
    }

    if (
      currentPassword.length >
      MAX_PASSWORD_LENGTH
    ) {
      return createErrorResponse(
        "Your current password is incorrect.",
        401,
        "currentPassword"
      );
    }

    const passwordValidation =
      validateNewPassword(newPassword);

    if (!passwordValidation.valid) {
      return createErrorResponse(
        passwordValidation.message,
        400,
        "newPassword"
      );
    }

    if (
      typeof confirmPassword !==
        "string" ||
      confirmPassword.length === 0
    ) {
      return createErrorResponse(
        "Please confirm your new password.",
        400,
        "confirmPassword"
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return createErrorResponse(
        "New passwords do not match.",
        400,
        "confirmPassword"
      );
    }

    if (
      currentPassword === newPassword
    ) {
      return createErrorResponse(
        "Your new password must be different from your current password.",
        400,
        "newPassword"
      );
    }

    const session =
      await getCustomerSession();

    if (!session?.customerId) {
      return createErrorResponse(
        "Please sign in to change your password.",
        401
      );
    }

    const customersCollection =
      await getCustomersCollection();

    const customer =
      await customersCollection.findOne(
        createCustomerQuery(
          session.customerId
        )
      );

    if (!customer) {
      return createErrorResponse(
        "Your account could not be found.",
        404
      );
    }

    if (isBlockedCustomer(customer)) {
      return createErrorResponse(
        "This account is currently unavailable.",
        403
      );
    }

    const storedPasswordHash =
      customer.passwordHash ||
      customer.password;

    if (
      !storedPasswordHash ||
      typeof storedPasswordHash !==
        "string"
    ) {
      return createErrorResponse(
        "This account cannot update its password. Please contact customer support.",
        403
      );
    }

    let passwordMatches = false;

    try {
      passwordMatches =
        await bcrypt.compare(
          currentPassword,
          storedPasswordHash
        );
    } catch (passwordError) {
      console.error(
        "Change Password Compare Error:",
        passwordError
      );

      return createErrorResponse(
        "Your current password is incorrect.",
        401,
        "currentPassword"
      );
    }

    if (!passwordMatches) {
      return createErrorResponse(
        "Your current password is incorrect.",
        401,
        "currentPassword"
      );
    }

    let newPasswordMatchesOld = false;

    try {
      newPasswordMatchesOld =
        await bcrypt.compare(
          newPassword,
          storedPasswordHash
        );
    } catch (passwordError) {
      console.error(
        "New Password Compare Error:",
        passwordError
      );
    }

    if (newPasswordMatchesOld) {
      return createErrorResponse(
        "Your new password must be different from your current password.",
        400,
        "newPassword"
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    const now = new Date();

    const updateResult =
      await customersCollection.findOneAndUpdate(
        {
          _id: customer._id,
        },
        {
          $set: {
            passwordHash,
            passwordChangedAt: now,
            updatedAt: now,
            lastActiveAt: now,
          },
          $unset: {
            password: "",
          },
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
        "We could not update your password right now.",
        500
      );
    }

    await setCustomerSession(
      updatedCustomer
    );

    return createResponse({
      success: true,
      message:
        "Your password has been changed successfully.",
      passwordChangedAt:
        updatedCustomer.passwordChangedAt,
    });
  } catch (error) {
    console.error(
      "Change Customer Password Error:",
      error
    );

    return createErrorResponse(
      "We could not change your password right now. Please try again.",
      500
    );
  }
}