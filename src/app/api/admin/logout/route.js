import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/adminAuthCore";

const LEGACY_ADMIN_COOKIE =
  "obsidian-admin";

function clearLegacyCookie(
  response
) {
  response.cookies.set(
    LEGACY_ADMIN_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    }
  );

  return response;
}

export async function POST() {
  /*
   * Keep headers() outside try/catch so
   * Next.js can correctly process its
   * request-time dynamic signal.
   */
  const requestHeaders =
    await headers();

  try {
    const authResponse =
      await adminAuth.api.signOut({
        headers:
          requestHeaders,

        asResponse: true,
      });

    const response =
      new NextResponse(
        authResponse.body,
        {
          status:
            authResponse.status,

          statusText:
            authResponse.statusText,

          headers:
            authResponse.headers,
        }
      );

    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0"
    );

    response.headers.set(
      "Pragma",
      "no-cache"
    );

    return clearLegacyCookie(
      response
    );
  } catch (error) {
    console.error(
      "Secure Admin logout failed:",
      error instanceof Error
        ? error.message
        : "Unknown logout error."
    );

    const response =
      NextResponse.json(
        {
          success: false,

          message:
            "The secure session could not be revoked. Please try again.",

          code:
            "ADMIN_LOGOUT_FAILED",
        },
        {
          status: 503,

          headers: {
            "Cache-Control":
              "no-store, max-age=0",

            Pragma:
              "no-cache",
          },
        }
      );

    return clearLegacyCookie(
      response
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,

      message:
        "Use POST to end the secure Admin session.",

      code:
        "METHOD_NOT_ALLOWED",
    },
    {
      status: 405,

      headers: {
        Allow: "POST",

        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}