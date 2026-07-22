import clientPromise from "../../../../lib/mongodb";
import {
  OrderPricingError,
  buildTrustedOrderQuote,
  createPublicOrderQuote,
} from "../../../../lib/orderPricing";

export const dynamic = "force-dynamic";

const MAX_REQUEST_SIZE = 250_000;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

export async function POST(request) {
  try {
    const contentLength = Number(
      request.headers.get("content-length") || 0
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_REQUEST_SIZE
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Request body is too large.",
        },
        413
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400
      );
    }

    if (!isPlainObject(body)) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400
      );
    }

    const client = await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const quote = await buildTrustedOrderQuote({
      database,
      items: body.items,
      deliveryArea: body.deliveryArea,
      couponCode: body.couponCode || "",
      paymentMethod:
        body.paymentMethod || "cash_on_delivery",
      validatePayment: true,
    });

    const publicQuote =
      createPublicOrderQuote(quote);

    return jsonResponse({
      success: true,
      quote: {
        ...publicQuote,

        pricing: {
          ...publicQuote.pricing,

          discountAmount:
            publicQuote.pricing.totalDiscount,

          deliveryCharge:
            publicQuote.pricing
              .payableDeliveryCharge,
        },
      },
    });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          details: error.details || undefined,
        },
        error.status
      );
    }

    console.error("Order Quote Error:", error);

    return jsonResponse(
      {
        success: false,
        message:
          "Order total could not be calculated.",
      },
      500
    );
  }
}