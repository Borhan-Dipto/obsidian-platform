import {
  timingSafeEqual,
} from "node:crypto";

import {
  processRetryableNotificationDeliveries,
} from "@/lib/orderNotifications";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration =
  60;

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
          "no-store",
      },
    }
  );
}

function normalizeSecret(value) {
  return String(
    value || ""
  ).trim();
}

function secretsMatch(
  first,
  second
) {
  const firstBuffer =
    Buffer.from(first);

  const secondBuffer =
    Buffer.from(second);

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}

function isAuthorizedCronRequest(
  request
) {
  const cronSecret =
    normalizeSecret(
      process.env.CRON_SECRET
    );

  if (
    cronSecret.length < 16
  ) {
    return {
      authorized: false,
      configured: false,
    };
  }

  const authorization =
    normalizeSecret(
      request.headers.get(
        "authorization"
      )
    );

  const expectedAuthorization =
    `Bearer ${cronSecret}`;

  return {
    configured: true,

    authorized:
      secretsMatch(
        authorization,
        expectedAuthorization
      ),
  };
}

function getRequestOrigin(
  request
) {
  try {
    return new URL(
      request.url
    ).origin;
  } catch {
    return "";
  }
}

export async function GET(
  request
) {
  const authorization =
    isAuthorizedCronRequest(
      request
    );

  if (
    !authorization.configured
  ) {
    return jsonResponse(
      {
        success: false,

        code:
          "CRON_SECRET_NOT_CONFIGURED",

        message:
          "Notification retry worker is not configured.",
      },
      503
    );
  }

  if (
    !authorization.authorized
  ) {
    return jsonResponse(
      {
        success: false,
        message:
          "Unauthorized.",
      },
      401
    );
  }

  try {
    const summary =
      await processRetryableNotificationDeliveries(
        {
          limit: 50,

          baseUrl:
            getRequestOrigin(
              request
            ),
        }
      );

    return jsonResponse({
      success: true,
      summary,
    });
  } catch (error) {
    console.error(
      "Notification retry worker error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Notification retry processing failed.",
      },
      500
    );
  }
}
