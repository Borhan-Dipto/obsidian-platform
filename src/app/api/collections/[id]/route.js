import { cookies } from "next/headers";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";

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

function getCollectionQuery(id) {
  const decodedId = decodeURIComponent(String(id || "").trim());
  const queryParts = [{ slug: decodedId }, { series: decodedId }];

  if (ObjectId.isValid(decodedId)) {
    queryParts.push({ _id: new ObjectId(decodedId) });
  }

  return {
    decodedId,
    query: { $or: queryParts },
  };
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { query } = getCollectionQuery(params.id);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const collection = await db.collection("collections").findOne(query);

    if (!collection) {
      return Response.json(
        {
          success: false,
          message: "Collection not found.",
        },
        { status: 404 }
      );
    }

    const authorized = await isAdminRequest();

    if (!collection.isActive && !authorized) {
      return Response.json(
        {
          success: false,
          message: "Collection not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("GET Collection Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch collection.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
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

    const params = await context.params;
    const { query } = getCollectionQuery(params.id);
    const updates = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const existingCollection = await db.collection("collections").findOne(query);

    if (!existingCollection) {
      return Response.json(
        {
          success: false,
          message: "Collection not found.",
        },
        { status: 404 }
      );
    }

    const updatedCollection = {
      updatedAt: new Date(),
    };

    if ("title" in updates) {
      const title = String(updates.title || "").trim();

      if (!title) {
        return Response.json(
          {
            success: false,
            message: "Collection title is required.",
          },
          { status: 400 }
        );
      }

      updatedCollection.title = title;
    }

    if ("slug" in updates) {
      const slug = createSlug(updates.slug);

      if (!slug) {
        return Response.json(
          {
            success: false,
            message: "Invalid collection slug.",
          },
          { status: 400 }
        );
      }

      updatedCollection.slug = slug;
    }

    if ("series" in updates) {
      const series = String(updates.series || "").trim();

      if (!series) {
        return Response.json(
          {
            success: false,
            message: "Collection series is required.",
          },
          { status: 400 }
        );
      }

      updatedCollection.series = series;
    }

    if ("description" in updates) {
      const description = String(updates.description || "").trim();

      if (!description) {
        return Response.json(
          {
            success: false,
            message: "Collection description is required.",
          },
          { status: 400 }
        );
      }

      updatedCollection.description = description;
    }

    if ("coverImage" in updates) {
      const coverImage = String(updates.coverImage || "").trim();

      if (!coverImage) {
        return Response.json(
          {
            success: false,
            message: "Collection cover image is required.",
          },
          { status: 400 }
        );
      }

      updatedCollection.coverImage = coverImage;
    }

    if ("displayOrder" in updates) {
      updatedCollection.displayOrder = toNumber(updates.displayOrder, 0);
    }

    if ("isActive" in updates) {
      updatedCollection.isActive = toBoolean(updates.isActive, true);
    }

    if ("isFeatured" in updates) {
      updatedCollection.isFeatured = toBoolean(updates.isFeatured, false);
    }

    const duplicateChecks = [];

    if (
      updatedCollection.slug &&
      updatedCollection.slug !== existingCollection.slug
    ) {
      duplicateChecks.push({ slug: updatedCollection.slug });
    }

    if (
      updatedCollection.series &&
      updatedCollection.series !== existingCollection.series
    ) {
      duplicateChecks.push({ series: updatedCollection.series });
    }

    if (duplicateChecks.length > 0) {
      const duplicateCollection = await db.collection("collections").findOne({
        _id: { $ne: existingCollection._id },
        $or: duplicateChecks,
      });

      if (duplicateCollection) {
        return Response.json(
          {
            success: false,
            message: "Another collection already uses this slug or series.",
          },
          { status: 409 }
        );
      }
    }

    await db
      .collection("collections")
      .updateOne({ _id: existingCollection._id }, { $set: updatedCollection });

    const savedCollection = await db
      .collection("collections")
      .findOne({ _id: existingCollection._id });

    return Response.json({
      success: true,
      message: "Collection updated successfully.",
      collection: savedCollection,
    });
  } catch (error) {
    console.error("PATCH Collection Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update collection.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    const params = await context.params;
    const { query } = getCollectionQuery(params.id);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const existingCollection = await db.collection("collections").findOne(query);

    if (!existingCollection) {
      return Response.json(
        {
          success: false,
          message: "Collection not found.",
        },
        { status: 404 }
      );
    }

    await db.collection("collections").deleteOne({
      _id: existingCollection._id,
    });

    return Response.json({
      success: true,
      message: "Collection deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE Collection Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to delete collection.",
      },
      { status: 500 }
    );
  }
}