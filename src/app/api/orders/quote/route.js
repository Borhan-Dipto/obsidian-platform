import clientPromise from "../../../../lib/mongodb";
import { enforcePublicJsonRequest } from "../../../../lib/publicApiSecurity";
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

export async function POST(request) {
  try {
    const security =
      await enforcePublicJsonRequest(
        request,
        {
          action:
            "order-quote",

          maxBodyBytes:
            MAX_REQUEST_SIZE,

          rateLimits: [
            {
              scope: "ip",
              limit: 300,
              windowMs:
                15 * 60 * 1000,
            },

            {
              scope: "coupon",
              limit: 120,
              windowMs:
                15 * 60 * 1000,

              identifier: (body) =>
                String(
                  body?.couponCode ||
                    ""
                )
                  .normalize("NFKC")
                  .trim()
                  .toUpperCase()
                  .slice(0, 80),
            },
          ],
        }
      );

    if (!security.success) {
      return security.response;
    }

    const body = security.body;

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