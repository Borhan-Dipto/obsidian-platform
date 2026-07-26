import crypto from "crypto";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import {
  createPublicApiResponse,
  enforcePublicJsonRequest,
} from "@/lib/publicApiSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
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

function createErrorResponse(
  message,
  status,
  field = null,
  code = null
) {
  return createPublicApiResponse(
    {
      success: false,
      message,
      field,
      code,
    },
    status
  );
}

export async function POST(request) {
  try {
    const security =
      await enforcePublicJsonRequest(
        request,
        {
          action:
            "account-reset-password",

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
              scope: "reset-token",
              limit: 10,
              windowMs:
                15 * 60 * 1000,

              identifier: (body) =>
                normalizeText(
                  body?.token
                ),
            },
          ],
        }
      );

    if (!security.success) {
      return security.response;
    }

    const requestBody =
      security.body;

    const token = normalizeText(
      requestBody?.token
    );

    const password =
      requestBody?.password;

    const confirmPassword =
      requestBody?.confirmPassword;

    if (!token) {
      return createErrorResponse(
        "This password reset link is invalid.",
        400,
        "token",
        "INVALID_TOKEN"
      );
    }

    if (
      token.length < 32 ||
      token.length > 256
    ) {
      return createErrorResponse(
        "This password reset link is invalid.",
        400,
        "token",
        "INVALID_TOKEN"
      );
    }

    const passwordValidation =
      validatePassword(password);

    if (!passwordValidation.valid) {
      return createErrorResponse(
        passwordValidation.message,
        400,
        "password",
        "INVALID_PASSWORD"
      );
    }

    if (
      typeof confirmPassword !== "string" ||
      password !== confirmPassword
    ) {
      return createErrorResponse(
        "Passwords do not match.",
        400,
        "confirmPassword",
        "PASSWORD_MISMATCH"
      );
    }

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const customersCollection =
      db.collection("customers");

    const passwordResetCollection =
      db.collection("customerPasswordResets");

    const tokenHash = hashToken(token);
    const now = new Date();

    const resetRequest =
      await passwordResetCollection.findOne(
        {
          tokenHash,
          usedAt: null,
          revokedAt: null,
          expiresAt: {
            $gt: now,
          },
        }
      );

    if (!resetRequest) {
      return createErrorResponse(
        "This password reset link is invalid or has expired.",
        400,
        "token",
        "INVALID_OR_EXPIRED_TOKEN"
      );
    }

    const customer =
      await customersCollection.findOne(
        {
          _id: resetRequest.customerId,
        },
        {
          projection: {
            _id: 1,
            customerId: 1,
            email: 1,
            status: 1,
            accountStatus: 1,
          },
        }
      );

    if (!customer) {
      await passwordResetCollection.updateOne(
        {
          _id: resetRequest._id,
        },
        {
          $set: {
            revokedAt: now,
            revokedReason:
              "Customer account no longer exists.",
            updatedAt: now,
          },
        }
      );

      return createErrorResponse(
        "This password reset link is invalid or has expired.",
        400,
        "token",
        "INVALID_OR_EXPIRED_TOKEN"
      );
    }

    const accountStatus =
      customer.accountStatus ||
      customer.status ||
      "active";

    if (accountStatus !== "active") {
      await passwordResetCollection.updateOne(
        {
          _id: resetRequest._id,
        },
        {
          $set: {
            revokedAt: now,
            revokedReason:
              "Customer account is not active.",
            updatedAt: now,
          },
        }
      );

      return createErrorResponse(
        "This account is currently unavailable.",
        403,
        "token",
        "ACCOUNT_UNAVAILABLE"
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const session = client.startSession();

    try {
      await session.withTransaction(
        async () => {
          const customerUpdateResult =
            await customersCollection.updateOne(
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
                  passwordResetRequired: "",
                },
              },
              {
                session,
              }
            );

          if (
            customerUpdateResult.matchedCount !== 1
          ) {
            throw new Error(
              "Customer password update failed."
            );
          }

          const resetUpdateResult =
            await passwordResetCollection.updateOne(
              {
                _id: resetRequest._id,
                usedAt: null,
                revokedAt: null,
              },
              {
                $set: {
                  usedAt: now,
                  updatedAt: now,
                },
              },
              {
                session,
              }
            );

          if (
            resetUpdateResult.modifiedCount !== 1
          ) {
            throw new Error(
              "Password reset token update failed."
            );
          }

          await passwordResetCollection.updateMany(
            {
              customerId: customer._id,
              _id: {
                $ne: resetRequest._id,
              },
              usedAt: null,
              revokedAt: null,
            },
            {
              $set: {
                revokedAt: now,
                revokedReason:
                  "Password was successfully changed.",
                updatedAt: now,
              },
            },
            {
              session,
            }
          );
        }
      );
    } finally {
      await session.endSession();
    }

    return createPublicApiResponse(
      {
        success: true,
        message:
          "Your password has been updated successfully. You can now sign in with your new password.",
      }
    );
  } catch (error) {
    console.error(
      "Customer Reset Password Error:",
      error
    );

    return createErrorResponse(
      "We could not update your password right now. Please try again.",
      500
    );
  }
}