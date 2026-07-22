import clientPromise from "../../../../../lib/mongodb";
import { isAdminAuthenticated } from "../../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const NEWSLETTER_COLLECTION = "newsletterSubscribers";

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

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function normalizeStatus(value) {
  const status = normalizeText(value, "all").toLowerCase();

  if (
    status === "active" ||
    status === "unsubscribed"
  ) {
    return status;
  }

  return "all";
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function escapeCsvValue(value) {
  const normalizedValue =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function formatCsvDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function createCsv(subscribers) {
  const rows = [
    [
      "Email",
      "Status",
      "Source",
      "Subscribed At",
      "Unsubscribed At",
      "Resubscribed At",
      "Created At",
      "Updated At",
    ],
  ];

  for (const subscriber of subscribers) {
    rows.push([
      normalizeText(subscriber.email),
      normalizeText(
        subscriber.status,
        "active"
      ),
      normalizeText(
        subscriber.source,
        "footer"
      ),
      formatCsvDate(
        subscriber.subscribedAt
      ),
      formatCsvDate(
        subscriber.unsubscribedAt
      ),
      formatCsvDate(
        subscriber.resubscribedAt
      ),
      formatCsvDate(subscriber.createdAt),
      formatCsvDate(subscriber.updatedAt),
    ]);
  }

  return rows
    .map((row) =>
      row.map(escapeCsvValue).join(",")
    )
    .join("\r\n");
}

function createExportFilename(status) {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  const statusSuffix =
    status === "all" ? "all" : status;

  return `obsidian-newsletter-${statusSuffix}-${date}.csv`;
}

export async function GET(request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createErrorResponse(
        "Unauthorized.",
        401
      );
    }

    const requestUrl = new URL(request.url);

    const search = normalizeText(
      requestUrl.searchParams.get("search")
    );

    const status = normalizeStatus(
      requestUrl.searchParams.get("status")
    );

    const query = {};

    if (search) {
      query.email = {
        $regex: escapeRegExp(search),
        $options: "i",
      };
    }

    if (status !== "all") {
      query.status = status;
    }

    const client = await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const subscribers = await database
      .collection(NEWSLETTER_COLLECTION)
      .find(query)
      .sort({
        subscribedAt: -1,
        createdAt: -1,
      })
      .toArray();

    const csvContent = createCsv(
      subscribers
    );

    const filename =
      createExportFilename(status);

    return new Response(
      `\uFEFF${csvContent}`,
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "Newsletter CSV export error:",
      error
    );

    return createErrorResponse(
      "Newsletter subscribers could not be exported."
    );
  }
}