import { cookies } from "next/headers";
import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";

function createSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

async function isAdminRequest() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("obsidian-admin");

  return Boolean(adminCookie && adminCookie.value === createAdminToken());
}

function toBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return defaultValue;
}

function toNumber(value, defaultValue = 0) {
  const number = Number(value);
  return Number.isNaN(number) ? defaultValue : number;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const query = includeInactive ? {} : { isActive: true };

    const collections = await db
      .collection("collections")
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error("GET Collections Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch collections.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authorized = await isAdminRequest();

    if (!authorized) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const collection = await request.json();

    const requiredFields = ["title", "series", "description", "coverImage"];
    const missingField = requiredFields.find(
      (field) => !String(collection[field] || "").trim()
    );

    if (missingField) {
      return Response.json(
        {
          success: false,
          message: `Missing required field: ${missingField}`,
        },
        { status: 400 }
      );
    }

    const title = collection.title.trim();
    const series = collection.series.trim();
    const slug = collection.slug?.trim()
      ? createSlug(collection.slug)
      : createSlug(title);

    if (!slug) {
      return Response.json(
        {
          success: false,
          message: "Invalid collection slug.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const existingCollection = await db.collection("collections").findOne({
      $or: [{ slug }, { series }],
    });

    if (existingCollection) {
      return Response.json(
        {
          success: false,
          message: "A collection with this slug or series already exists.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const newCollection = {
      title,
      slug,
      series,
      description: collection.description.trim(),
      coverImage: collection.coverImage.trim(),
      displayOrder: toNumber(collection.displayOrder, 0),
      isActive: toBoolean(collection.isActive, true),
      isFeatured: toBoolean(collection.isFeatured, false),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("collections").insertOne(newCollection);

    return Response.json(
      {
        success: true,
        message: "Collection created successfully.",
        collection: {
          ...newCollection,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Collection Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create collection.",
      },
      { status: 500 }
    );
  }
}