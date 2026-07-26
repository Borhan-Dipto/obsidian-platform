import clientPromise from "../../../lib/mongodb";

import {
  createLegalConsentRecord,
  LegalConsentError,
} from "../../../lib/legalConsent";

import {
  createPublicApiResponse,
  enforcePublicJsonRequest,
} from "../../../lib/publicApiSecurity";

export const dynamic =
  "force-dynamic";

const NEWSLETTER_COLLECTION =
  "newsletterSubscribers";

const PUBLIC_NEWSLETTER_SOURCES =
  new Set([
    "footer",
    "popup",
    "checkout",
  ]);

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizePublicSource(
  value
) {
  const source =
    String(
      value || "footer"
    )
      .trim()
      .toLowerCase();

  return PUBLIC_NEWSLETTER_SOURCES.has(
    source
  )
    ? source
    : "footer";
}

function createErrorResponse(
  message,
  status = 500
) {
  return createPublicApiResponse(
    {
      success: false,
      message,
    },
    status
  );
}

async function getNewsletterCollection() {
  const client =
    await clientPromise;

  const database =
    client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

  const collection =
    database.collection(
      NEWSLETTER_COLLECTION
    );

  await collection.createIndex(
    {
      email: 1,
    },
    {
      unique: true,

      name:
        "newsletter_unique_email",
    }
  );

  return collection;
}

function createConsentUpdate({
  source,
  legalConsent,
  now,
}) {
  return {
    $set: {
      status: "active",
      source,

      consentStatus:
        "granted",

      consentMethod:
        "explicit_form_submission",

      legalConsent,

      consentUpdatedAt:
        now,

      updatedAt:
        now,
    },

    $push: {
      consentHistory: {
        $each: [
          legalConsent,
        ],

        $slice: -20,
      },
    },
  };
}

export async function POST(
  request
) {
  try {
    const security =
      await enforcePublicJsonRequest(
        request,
        {
          action:
            "newsletter-subscribe",

          maxBodyBytes:
            16 * 1024,

          rateLimits: [
            {
              scope: "ip",
              limit: 30,

              windowMs:
                60 * 60 * 1000,
            },

            {
              scope: "email",
              limit: 5,

              windowMs:
                24 * 60 * 60 * 1000,

              identifier: (body) =>
                normalizeEmail(
                  body?.email
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

    const email =
      normalizeEmail(
        requestBody?.email
      );

    const source =
      normalizePublicSource(
        requestBody?.source
      );

    const marketingConsent =
      requestBody
        ?.marketingConsent ===
      true;

    if (!marketingConsent) {
      return createErrorResponse(
        "Marketing consent is required to join the newsletter.",
        400
      );
    }

    if (!email) {
      return createErrorResponse(
        "Email address is required.",
        400
      );
    }

    if (email.length > 254) {
      return createErrorResponse(
        "Email address is too long.",
        400
      );
    }

    if (!isValidEmail(email)) {
      return createErrorResponse(
        "Please enter a valid email address.",
        400
      );
    }

    const now =
      new Date();

    const legalConsent =
      await createLegalConsentRecord({
        group:
          "newsletter",

        purpose:
          "marketing_email_subscription",

        source:
          `newsletter_${source}`,

        acceptedAt: now,
      });

    const collection =
      await getNewsletterCollection();

    const existingSubscriber =
      await collection.findOne({
        email,
      });

    if (existingSubscriber) {
      const existingStatus =
        String(
          existingSubscriber.status ||
            "active"
        )
          .trim()
          .toLowerCase();

      const consentUpdate =
        createConsentUpdate({
          source,
          legalConsent,
          now,
        });

      if (
        existingStatus ===
        "unsubscribed"
      ) {
        consentUpdate.$set
          .resubscribedAt = now;

        consentUpdate.$unset = {
          unsubscribedAt: "",
        };

        await collection.updateOne(
          {
            _id:
              existingSubscriber._id,
          },
          consentUpdate
        );

        return createPublicApiResponse({
          success: true,

          message:
            "Welcome back. Your subscription is active again.",
        });
      }

      await collection.updateOne(
        {
          _id:
            existingSubscriber._id,
        },
        consentUpdate
      );

      return createPublicApiResponse({
        success: true,

        message:
          "You are already subscribed to OBSIDIAN updates.",
      });
    }

    await collection.insertOne({
      email,
      source,
      status: "active",

      consentStatus:
        "granted",

      consentMethod:
        "explicit_form_submission",

      legalConsent,

      consentHistory: [
        legalConsent,
      ],

      subscribedAt: now,
      consentUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return createPublicApiResponse(
      {
        success: true,

        message:
          "Thank you for joining OBSIDIAN.",
      },
      201
    );
  } catch (error) {
    if (
      error instanceof
      LegalConsentError
    ) {
      return createErrorResponse(
        "The current Privacy Policy could not be verified. Please try again later.",
        error.status || 503
      );
    }

    if (error?.code === 11000) {
      return createPublicApiResponse({
        success: true,

        message:
          "You are already subscribed to OBSIDIAN updates.",
      });
    }

    console.error(
      "Newsletter subscription error:",
      error
    );

    return createErrorResponse(
      "Newsletter subscription could not be completed."
    );
  }
}
