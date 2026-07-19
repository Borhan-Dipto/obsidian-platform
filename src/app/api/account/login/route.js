import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { setCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

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
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function serializeCustomer(customer) {
  return {
    id: String(customer._id),
    customerId: customer.customerId,
    fullName:
      customer.fullName ||
      customer.name ||
      [
        customer.firstName,
        customer.lastName,
      ]
        .filter(Boolean)
        .join(" "),
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    email: customer.email,
    phone: customer.phone || "",
    status:
      customer.status ||
      customer.accountStatus ||
      "active",
    emailVerified: Boolean(
      customer.emailVerified
    ),
    loyaltyTier:
      customer.loyaltyTier || "member",
    createdAt: customer.createdAt || null,
    lastLoginAt:
      customer.lastLoginAt || null,
  };
}

function getAccountStatus(customer) {
  return normalizeText(
    customer?.status ||
      customer?.accountStatus ||
      "active"
  ).toLowerCase();
}

function isAccountBlocked(status) {
  return [
    "disabled",
    "suspended",
    "blocked",
    "deleted",
    "inactive",
  ].includes(status);
}

function getBlockedAccountMessage(status) {
  if (status === "suspended") {
    return "This account is temporarily suspended. Please contact customer support.";
  }

  if (status === "blocked") {
    return "This account has been blocked. Please contact customer support.";
  }

  if (status === "deleted") {
    return "This account is no longer available.";
  }

  return "This account is currently unavailable. Please contact customer support.";
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

    const password = requestBody?.password;

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
      typeof password !== "string" ||
      password.length === 0
    ) {
      return createErrorResponse(
        "Please enter your password.",
        400,
        "password"
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return createErrorResponse(
        "The email address or password is incorrect.",
        401
      );
    }

    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const customersCollection =
      db.collection("customers");

    const customer =
      await customersCollection.findOne({
        $or: [
          {
            email,
          },
          {
            emailNormalized: email,
          },
        ],
      });

    if (!customer) {
      return createErrorResponse(
        "The email address or password is incorrect.",
        401
      );
    }

    const accountStatus =
      getAccountStatus(customer);

    if (isAccountBlocked(accountStatus)) {
      return createErrorResponse(
        getBlockedAccountMessage(
          accountStatus
        ),
        403
      );
    }

    const storedPasswordHash =
      customer.passwordHash ||
      customer.password;

    if (
      !storedPasswordHash ||
      typeof storedPasswordHash !== "string"
    ) {
      return createErrorResponse(
        "This account cannot be accessed with a password. Please contact customer support.",
        403
      );
    }

    let passwordMatches = false;

    try {
      passwordMatches = await bcrypt.compare(
        password,
        storedPasswordHash
      );
    } catch (passwordError) {
      console.error(
        "Customer Password Compare Error:",
        passwordError
      );

      return createErrorResponse(
        "The email address or password is incorrect.",
        401
      );
    }

    if (!passwordMatches) {
      return createErrorResponse(
        "The email address or password is incorrect.",
        401
      );
    }

    const now = new Date();

    await customersCollection.updateOne(
      {
        _id: customer._id,
      },
      {
        $set: {
          lastLoginAt: now,
          lastActiveAt: now,
          updatedAt: now,
        },
        $inc: {
          loginCount: 1,
        },
      }
    );

    const authenticatedCustomer = {
      ...customer,
      lastLoginAt: now,
      lastActiveAt: now,
      loginCount:
        Number(customer.loginCount || 0) + 1,
    };

    await setCustomerSession(
      authenticatedCustomer
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Welcome back to OBSIDIAN.",
        customer: serializeCustomer(
          authenticatedCustomer
        ),
        redirectTo: "/account",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Customer Login Error:",
      error
    );

    return createErrorResponse(
      "We could not sign you in right now. Please try again.",
      500
    );
  }
}