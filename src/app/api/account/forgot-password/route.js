import crypto from "crypto";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 254;
const RESET_TOKEN_EXPIRY_MINUTES = 30;
const REQUEST_COOLDOWN_SECONDS = 60;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  if (!email || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function createGenericSuccessResponse(
  resetUrl = null
) {
  const response = {
    success: true,
    message:
      "If an OBSIDIAN account exists for this email, password reset instructions have been prepared.",
  };

  if (
    process.env.NODE_ENV !== "production" &&
    resetUrl
  ) {
    response.resetUrl = resetUrl;
  }

  return NextResponse.json(response, {
    status: 200,
  });
}

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createResetUrl(request, rawToken) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  let baseUrl;

  if (configuredBaseUrl) {
    baseUrl = configuredBaseUrl.replace(/\/+$/, "");
  } else {
    const requestUrl = new URL(request.url);
    baseUrl = requestUrl.origin;
  }

  return `${baseUrl}/account/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;
}

async function prepareResetIndexes(
  passwordResetCollection
) {
  try {
    await passwordResetCollection.createIndex(
      {
        tokenHash: 1,
      },
      {
        unique: true,
        name: "unique_password_reset_token_hash",
      }
    );

    await passwordResetCollection.createIndex(
      {
        expiresAt: 1,
      },
      {
        expireAfterSeconds: 0,
        name: "expire_password_reset_tokens",
      }
    );

    await passwordResetCollection.createIndex(
      {
        customerId: 1,
        createdAt: -1,
      },
      {
        name: "customer_password_reset_history",
      }
    );

    await passwordResetCollection.createIndex(
      {
        email: 1,
        createdAt: -1,
      },
      {
        name: "email_password_reset_history",
      }
    );
  } catch (indexError) {
    console.error(
      "Password reset index warning:",
      indexError
    );
  }
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

    const email = normalizeEmail(
      requestBody?.email
    );

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

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const customersCollection =
      db.collection("customers");

    const passwordResetCollection =
      db.collection("customerPasswordResets");

    await prepareResetIndexes(
      passwordResetCollection
    );

    const customer =
      await customersCollection.findOne(
        {
          $or: [
            {
              email,
            },
            {
              emailNormalized: email,
            },
          ],
        },
        {
          projection: {
            _id: 1,
            customerId: 1,
            email: 1,
            fullName: 1,
            firstName: 1,
            status: 1,
            accountStatus: 1,
          },
        }
      );

    if (!customer) {
      return createGenericSuccessResponse();
    }

    const accountStatus =
      customer.accountStatus ||
      customer.status ||
      "active";

    if (accountStatus !== "active") {
      return createGenericSuccessResponse();
    }

    const now = new Date();

    const cooldownStart = new Date(
      now.getTime() -
        REQUEST_COOLDOWN_SECONDS * 1000
    );

    const recentResetRequest =
      await passwordResetCollection.findOne(
        {
          customerId: customer._id,
          createdAt: {
            $gte: cooldownStart,
          },
          usedAt: null,
          revokedAt: null,
        },
        {
          projection: {
            _id: 1,
          },
          sort: {
            createdAt: -1,
          },
        }
      );

    if (recentResetRequest) {
      return createGenericSuccessResponse();
    }

    await passwordResetCollection.updateMany(
      {
        customerId: customer._id,
        usedAt: null,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: now,
          updatedAt: now,
          revokedReason:
            "Superseded by a newer password reset request.",
        },
      }
    );

    const rawToken = createRawToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      now.getTime() +
        RESET_TOKEN_EXPIRY_MINUTES *
          60 *
          1000
    );

    const resetUrl = createResetUrl(
      request,
      rawToken
    );

    const resetDocument = {
      customerId: customer._id,
      publicCustomerId:
        customer.customerId || null,

      email:
        customer.email ||
        email,

      tokenHash,

      expiresAt,
      usedAt: null,
      revokedAt: null,
      revokedReason: null,

      requestIp:
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim() ||
        request.headers.get("x-real-ip") ||
        null,

      requestUserAgent:
        request.headers.get("user-agent") ||
        null,

      createdAt: now,
      updatedAt: now,
    };

    await passwordResetCollection.insertOne(
      resetDocument
    );

    /*
      Production email delivery will be connected
      after the reset-password API and page are complete.

      During development, resetUrl is safely returned
      in the JSON response so the complete password
      reset flow can be tested locally.
    */

    console.info(
      "Customer password reset prepared:",
      {
        customerId:
          customer.customerId ||
          String(customer._id),
        email:
          customer.email ||
          email,
        expiresAt,
        developmentResetUrl:
          process.env.NODE_ENV !==
          "production"
            ? resetUrl
            : undefined,
      }
    );

    return createGenericSuccessResponse(
      resetUrl
    );
  } catch (error) {
    console.error(
      "Customer Forgot Password Error:",
      error
    );

    return createErrorResponse(
      "We could not process your password reset request right now. Please try again.",
      500
    );
  }
}