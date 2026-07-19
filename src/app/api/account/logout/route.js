import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

function createResponse() {
  return NextResponse.json(
    {
      success: true,
      message: "You have been signed out successfully.",
      redirectTo: "/account/login",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST() {
  try {
    await clearCustomerSession();

    return createResponse();
  } catch (error) {
    console.error("Customer Logout Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "We could not complete your sign-out request. Please try again.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}

export async function DELETE() {
  try {
    await clearCustomerSession();

    return createResponse();
  } catch (error) {
    console.error("Customer Logout Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "We could not complete your sign-out request. Please try again.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}