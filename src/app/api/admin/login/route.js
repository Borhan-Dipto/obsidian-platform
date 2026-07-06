import { cookies } from "next/headers";
import crypto from "crypto";

function createAdminToken() {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SECRET is missing.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update("obsidian-admin-session")
    .digest("hex");
}

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json(
        { success: false, message: "Invalid password." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("obsidian-admin", createAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return Response.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return Response.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}