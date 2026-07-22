import clientPromise from "../../../lib/mongodb";

export const dynamic = "force-dynamic";

const NEWSLETTER_COLLECTION =
  "newsletterSubscribers";

const PUBLIC_NEWSLETTER_SOURCES = new Set([
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

function normalizePublicSource(value) {
  const source = String(value || "footer")
    .trim()
    .toLowerCase();

  return PUBLIC_NEWSLETTER_SOURCES.has(source)
    ? source
    : "footer";
}

function createErrorResponse(
  message,
  status = 500
) {
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

function getRequestIpAddress(request) {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor
      .split(",")[0]
      .trim()
      .slice(0, 100);
  }

  return String(
    request.headers.get("x-real-ip") || ""
  ).slice(0, 100);
}

async function getNewsletterCollection() {
  const client = await clientPromise;

  const database = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const collection = database.collection(
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
    let requestBody;

    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse(
        "Invalid request body.",
        400
      );
    }

    const email = normalizeEmail(
      requestBody?.email
    );

    const source = normalizePublicSource(
      requestBody?.source
    );

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

    const collection =
      await getNewsletterCollection();

    const existingSubscriber =
      await collection.findOne({
        email,
      });

    const now = new Date();

    if (existingSubscriber) {
      const existingStatus = String(
        existingSubscriber.status || "active"
      )
        .trim()
        .toLowerCase();

      if (existingStatus === "unsubscribed") {
        await collection.updateOne(
          {
            _id: existingSubscriber._id,
          },
          {
            $set: {
              status: "active",
              source,
              resubscribedAt: now,
              updatedAt: now,
            },

            $unset: {
              unsubscribedAt: "",
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

    const ipAddress =
      getRequestIpAddress(request);

    const userAgent = String(
      request.headers.get("user-agent") || ""
    ).slice(0, 1000);

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