import { NextResponse } from "next/server";

import {
  requireAdminApiPermission,
} from "../../../../../lib/adminApiAuthorization";

import {
  findAdminAuditLogs,
  getAdminAuditEventOptions,
  getAdminAuditSummary,
} from "../../../../../lib/adminAuditQueries";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control":
    "no-store, max-age=0",

  Pragma:
    "no-cache",

  "X-Content-Type-Options":
    "nosniff",
};

function createAuthorizationFallbackResponse() {
  return NextResponse.json(
    {
      success: false,

      message:
        "Administrator authorization is required.",

      code:
        "ADMIN_AUTHORIZATION_REQUIRED",
    },
    {
      status: 403,

      headers:
        NO_STORE_HEADERS,
    }
  );
}

export async function GET(
  request: Request
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          security: [
            "read_audit",
          ],
        },
        {
          path:
            "/api/admin/security/audit-logs",

          forbiddenMessage:
            "You do not have permission to view security audit logs.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return (
        authorization.response ??
        createAuthorizationFallbackResponse()
      );
    }

    const url =
      new URL(request.url);

    const searchParams =
      url.searchParams;

    const [
      logs,
      summary,
      eventOptions,
    ] = await Promise.all([
      findAdminAuditLogs({
        page:
          searchParams.get(
            "page"
          ),

        limit:
          searchParams.get(
            "limit"
          ),

        event:
          searchParams.get(
            "event"
          ),

        status:
          searchParams.get(
            "status"
          ),

        severity:
          searchParams.get(
            "severity"
          ),

        actor:
          searchParams.get(
            "actor"
          ),

        search:
          searchParams.get(
            "search"
          ),

        from:
          searchParams.get(
            "from"
          ),

        to:
          searchParams.get(
            "to"
          ),
      }),

      getAdminAuditSummary(),

      getAdminAuditEventOptions(),
    ]);

    return NextResponse.json(
      {
        success: true,

        data: {
          logs:
            logs.items,

          pagination:
            logs.pagination,

          filters:
            logs.filters,

          summary,

          options: {
            events:
              eventOptions,

            statuses: [
              "success",
              "failure",
              "blocked",
              "info",
            ],

            severities: [
              "info",
              "warning",
              "critical",
            ],
          },
        },
      },
      {
        status: 200,

        headers:
          NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "Admin audit-log API error:",
      error instanceof Error
        ? error.message
        : "Unknown audit-log error."
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Security audit logs could not be loaded.",

        code:
          "ADMIN_AUDIT_LOGS_LOAD_FAILED",
      },
      {
        status: 500,

        headers:
          NO_STORE_HEADERS,
      }
    );
  }
}