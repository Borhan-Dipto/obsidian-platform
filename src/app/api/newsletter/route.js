import clientPromise from "../../../lib/mongodb";

const NEWSLETTER_COLLECTION = "newsletterSubscribers";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSource(value) {
  const source = String(value || "footer")
    .trim()
    .toLowerCase();

  const allowedSources = [
    "footer",
    "popup",
    "checkout",
    "admin",
  ];

  return allowedSources.includes(source)
    ? source
    : "footer";
}

function createErrorResponse(message, status = 500) {
  return Response.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

async function getNewsletterCollection() {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const collection = db.collection(
    NEWSLETTER_COLLECTION
  );

  await collection.createIndex(
    {
      email: 1,
    },
    {
      unique: true,
    }
  );

  return collection;
}

export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return createErrorResponse(
        "Invalid request body.",
        400
      );
    }

    const email = normalizeEmail(body?.email);
    const source = normalizeSource(body?.source);

    if (!email) {
      return createErrorResponse(
        "Email address is required.",
        400
      );
    }

    if (!isValidEmail(email)) {
      return createErrorResponse(
        "Please enter a valid email address.",
        400
      );
    }

    const collection =
      await getNewsletterCollection();

    const existingSubscriber =
      await collection.findOne({
        email,
      });

    if (existingSubscriber) {
      if (
        existingSubscriber.status ===
        "unsubscribed"
      ) {
        const now = new Date();

        await collection.updateOne(
          {
            email,
          },
          {
            $set: {
              status: "active",
              source,
              resubscribedAt: now,
              updatedAt: now,
            },
          }
        );

        return Response.json({
          success: true,
          message:
            "Welcome back. Your subscription is active again.",
        });
      }

      return Response.json({
        success: true,
        message:
          "You are already subscribed to OBSIDIAN updates.",
      });
    }

    const now = new Date();

    const forwardedFor =
      request.headers.get("x-forwarded-for");

    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "";

    const userAgent =
      request.headers.get("user-agent") || "";

    await collection.insertOne({
      email,
      source,
      status: "active",
      ipAddress,
      userAgent,
      subscribedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return Response.json(
      {
        success: true,
        message:
          "Thank you for joining OBSIDIAN.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json({
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