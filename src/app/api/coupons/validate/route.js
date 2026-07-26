import clientPromise from "../../../../lib/mongodb";
import { enforcePublicJsonRequest } from "../../../../lib/publicApiSecurity";
import {
  OrderPricingError,
  buildTrustedOrderQuote,
  createPublicOrderQuote,
  normalizeCouponCode,
} from "../../../../lib/orderPricing";

export const dynamic = "force-dynamic";

const MAX_REQUEST_SIZE = 100_000;

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
            "coupon-validate",

          maxBodyBytes:
            MAX_REQUEST_SIZE,

          rateLimits: [
            {
              scope: "ip",
              limit: 120,
              windowMs:
                15 * 60 * 1000,
            },

            {
              scope: "coupon",
              limit: 60,
              windowMs:
                15 * 60 * 1000,

              identifier: (body) =>
                normalizeCouponCode(
                  body?.couponCode ||
                    body?.code
                ),
            },
          ],
        }
      );

    if (!security.success) {
      return security.response;
    }

    const body = security.body;

    const couponCode = normalizeCouponCode(
      body.couponCode || body.code
    );

    if (!couponCode) {
      return jsonResponse(
        {
          success: false,
          valid: false,
          message: "Please enter a coupon code.",
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
      couponCode,
      validatePayment: false,
    });

    const publicQuote =
      createPublicOrderQuote(quote);

    return jsonResponse({
      success: true,
      valid: true,
      message: "Coupon applied successfully.",

      coupon: publicQuote.coupon,

      pricing: {
        ...publicQuote.pricing,

        discountAmount:
          publicQuote.pricing.totalDiscount,

        deliveryCharge:
          publicQuote.pricing
            .payableDeliveryCharge,
      },

      items: publicQuote.items,
    });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return jsonResponse(
        {
          success: false,
          valid: false,
          code: error.code,
          message: error.message,
          details: error.details || undefined,
        },
        error.status
      );
    }

    console.error(
      "Coupon Validation Error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        valid: false,
        message: "Coupon could not be validated.",
      },
      500
    );
  }
}