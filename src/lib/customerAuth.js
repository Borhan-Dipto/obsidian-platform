import crypto from "crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import clientPromise from "./mongodb";

const CUSTOMER_COOKIE_NAME = "obsidian-customer";
const CUSTOMER_SESSION_DURATION_SECONDS =
  60 * 60 * 24 * 30;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function getCustomerAuthSecret() {
  const secret =
    process.env.CUSTOMER_AUTH_SECRET ||
    process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error(
      "CUSTOMER_AUTH_SECRET is missing."
    );
  }

  return secret;
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString(
    "base64url"
  );
}

function decodeBase64Url(value) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function createSignature(encodedPayload) {
  return crypto
    .createHmac(
      "sha256",
      getCustomerAuthSecret()
    )
    .update(encodedPayload)
    .digest("base64url");
}

function safeCompareValues(
  receivedValue,
  expectedValue
) {
  if (
    typeof receivedValue !== "string" ||
    typeof expectedValue !== "string"
  ) {
    return false;
  }

  const receivedBuffer = Buffer.from(
    receivedValue,
    "utf8"
  );

  const expectedBuffer = Buffer.from(
    expectedValue,
    "utf8"
  );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

function createSessionPayload(customer) {
  const now = Math.floor(Date.now() / 1000);

  return {
    version: 1,
    customerId: normalizeText(
      customer?._id || customer?.customerId
    ),
    email: normalizeEmail(customer?.email),
    issuedAt: now,
    expiresAt:
      now +
      CUSTOMER_SESSION_DURATION_SECONDS,
    sessionId: crypto.randomUUID(),
  };
}

function createCustomerSessionToken(customer) {
  const payload =
    createSessionPayload(customer);

  if (!payload.customerId) {
    throw new Error(
      "Customer ID is required to create a session."
    );
  }

  const encodedPayload = encodeBase64Url(
    JSON.stringify(payload)
  );

  const signature =
    createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyCustomerSessionToken(token) {
  try {
    const normalizedToken =
      normalizeText(token);

    if (!normalizedToken) {
      return null;
    }

    const tokenParts =
      normalizedToken.split(".");

    if (tokenParts.length !== 2) {
      return null;
    }

    const [
      encodedPayload,
      receivedSignature,
    ] = tokenParts;

    const expectedSignature =
      createSignature(encodedPayload);

    if (
      !safeCompareValues(
        receivedSignature,
        expectedSignature
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      decodeBase64Url(encodedPayload)
    );

    if (
      payload?.version !== 1 ||
      !normalizeText(payload?.customerId) ||
      !Number.isFinite(payload?.issuedAt) ||
      !Number.isFinite(payload?.expiresAt)
    ) {
      return null;
    }

    const now = Math.floor(
      Date.now() / 1000
    );

    if (
      payload.expiresAt <= now ||
      payload.issuedAt > now + 60
    ) {
      return null;
    }

    return {
      version: payload.version,
      customerId: normalizeText(
        payload.customerId
      ),
      email: normalizeEmail(payload.email),
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      sessionId: normalizeText(
        payload.sessionId
      ),
    };
  } catch {
    return null;
  }
}

function createCustomerQuery(customerId) {
  const normalizedCustomerId =
    normalizeText(customerId);

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

function sanitizeCustomer(customer) {
  if (!customer) {
    return null;
  }

  const {
    password,
    passwordHash,
    resetPasswordToken,
    resetPasswordExpiresAt,
    verificationToken,
    verificationTokenExpiresAt,
    ...safeCustomer
  } = customer;

  return JSON.parse(
    JSON.stringify({
      ...safeCustomer,
      _id: String(customer._id || ""),
      customerId: String(
        customer.customerId ||
          customer._id ||
          ""
      ),
    })
  );
}

export function getCustomerCookieName() {
  return CUSTOMER_COOKIE_NAME;
}

export function generateCustomerSessionToken(
  customer
) {
  return createCustomerSessionToken(
    customer
  );
}

export function validateCustomerSessionToken(
  token
) {
  return verifyCustomerSessionToken(token);
}

export async function setCustomerSession(
  customer
) {
  const token =
    createCustomerSessionToken(customer);

  const cookieStore = await cookies();

  cookieStore.set(
    CUSTOMER_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        CUSTOMER_SESSION_DURATION_SECONDS,
      priority: "high",
    }
  );

  return true;
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();

  cookieStore.set(
    CUSTOMER_COOKIE_NAME,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      priority: "high",
    }
  );

  return true;
}

export async function getCustomerSession() {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(
    CUSTOMER_COOKIE_NAME
  );

  if (!sessionCookie?.value) {
    return null;
  }

  return verifyCustomerSessionToken(
    sessionCookie.value
  );
}

export async function isCustomerAuthenticated() {
  const session =
    await getCustomerSession();

  return Boolean(session);
}

export async function getCurrentCustomer() {
  const session =
    await getCustomerSession();

  if (!session?.customerId) {
    return null;
  }

  try {
    const client = await clientPromise;

    const db = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    const customer = await db
      .collection("customers")
      .findOne(
        createCustomerQuery(
          session.customerId
        )
      );

    if (!customer) {
      return null;
    }

    const accountStatus = normalizeText(
      customer.status ||
        customer.accountStatus ||
        "active"
    ).toLowerCase();

    if (
      [
        "disabled",
        "suspended",
        "blocked",
        "deleted",
      ].includes(accountStatus)
    ) {
      return null;
    }

    if (
      session.email &&
      customer.email &&
      normalizeEmail(customer.email) !==
        session.email
    ) {
      return null;
    }

    return sanitizeCustomer(customer);
  } catch (error) {
    console.error(
      "Get Current Customer Error:",
      error
    );

    return null;
  }
}

export async function requireCustomerAuth(
  redirectPath = "/account/login"
) {
  const customer =
    await getCurrentCustomer();

  if (!customer) {
    redirect(redirectPath);
  }

  return customer;
}

export async function redirectAuthenticatedCustomer(
  redirectPath = "/account"
) {
  const customer =
    await getCurrentCustomer();

  if (customer) {
    redirect(redirectPath);
  }

  return null;
}