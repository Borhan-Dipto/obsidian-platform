import {
  processRetryableNotificationDeliveries,
} from "../../src/lib/orderNotifications.js";

const RETRY_BATCH_LIMIT = 25;

export default async function retryNotifications() {
  const startedAt =
    new Date();

  try {
    const summary =
      await processRetryableNotificationDeliveries({
        limit:
          RETRY_BATCH_LIMIT,

        baseUrl:
          process.env.URL ||
          process.env.DEPLOY_PRIME_URL ||
          "",
      });

    const completedAt =
      new Date();

    console.info(
      "Netlify notification retry completed:",
      {
        startedAt:
          startedAt.toISOString(),

        completedAt:
          completedAt.toISOString(),

        scanned:
          summary.scanned,

        attempted:
          summary.attempted,

        sent:
          summary.sent,

        failed:
          summary.failed,

        skipped:
          summary.skipped,
      }
    );

    return Response.json(
      {
        success:
          true,

        startedAt:
          startedAt.toISOString(),

        completedAt:
          completedAt.toISOString(),

        scanned:
          summary.scanned,

        attempted:
          summary.attempted,

        sent:
          summary.sent,

        failed:
          summary.failed,

        skipped:
          summary.skipped,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Netlify notification retry failed:",
      error
    );

    return Response.json(
      {
        success:
          false,

        message:
          "Notification retry processing failed.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}

export const config = {
  schedule:
    "10 0 * * *",
};
