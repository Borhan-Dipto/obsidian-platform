import { NextResponse } from "next/server";

const RESPONSE_HEADERS = {
  "Cache-Control":
    "no-store, max-age=0",
  Pragma: "no-cache",
};

function legacyLoginDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        "This authentication endpoint is no longer available.",
      code:
        "LEGACY_ADMIN_LOGIN_DISABLED",
    },
    {
      status: 410,
      headers:
        RESPONSE_HEADERS,
    }
  );
}

export async function POST() {
  return legacyLoginDisabledResponse();
}

export async function GET() {
  return legacyLoginDisabledResponse();
}

export async function PUT() {
  return legacyLoginDisabledResponse();
}

export async function PATCH() {
  return legacyLoginDisabledResponse();
}

export async function DELETE() {
  return legacyLoginDisabledResponse();
}