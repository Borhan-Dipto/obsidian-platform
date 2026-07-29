import clientPromise from "../../../../lib/mongodb";

import {
  enforcePublicJsonRequest,
} from "../../../../lib/publicApiSecurity";

import {
  buildTrustedCartSnapshot,
  OrderPricingError,
} from "../../../../lib/orderPricing";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const MAX_REQUEST_SIZE =
  100_000;

function jsonResponse(
  body,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "private, no-store, no-cache, must-revalidate, max-age=0",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-Content-Type-Options":
          "nosniff",
      },
    }
  );
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
            "cart-validate",

          maxBodyBytes:
            MAX_REQUEST_SIZE,

          rateLimits: [
            {
              scope:
                "ip",

              limit:
                300,

              windowMs:
                15 *
                60 *
                1000,
            },
          ],
        }
      );

    if (!security.success) {
      return security.response;
    }

    const client =
      await clientPromise;

    const database =
      client.db(
        process.env.MONGODB_DB ||
          "obsidian"
      );

    const snapshot =
      await buildTrustedCartSnapshot({
        database,

        items:
          security.body.items,
      });

    return jsonResponse({
      success:
        true,

      snapshot,
    });
  } catch (error) {
    if (
      error instanceof
      OrderPricingError
    ) {
      return jsonResponse(
        {
          success:
            false,

          code:
            error.code,

          message:
            error.message,

          details:
            error.details ||
            undefined,
        },

        error.status
      );
    }

    console.error(
      "Cart Validation Error:",
      error
    );

    return jsonResponse(
      {
        success:
          false,

        code:
          "CART_VALIDATION_FAILED",

        message:
          "Your cart could not be refreshed safely. Please try again.",
      },

      500
    );
  }
}
