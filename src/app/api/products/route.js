import clientPromise from "../../../lib/mongodb";

function createSlug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const products = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("GET Products Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const product = await request.json();

    const requiredFields = [
      "name",
      "series",
      "color",
      "price",
      "stock",
      "image",
      "description",
    ];

    const missingField = requiredFields.find((field) => !product[field]);

    if (missingField) {
      return Response.json(
        {
          success: false,
          message: `Missing required field: ${missingField}`,
        },
        { status: 400 }
      );
    }

    const price = Number(product.price);
    const stock = Number(product.stock);

    if (Number.isNaN(price) || price < 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid product price.",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(stock) || stock < 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid product stock.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const id = product.id?.trim() || createSlug(product.name);

    const existingProduct = await db.collection("products").findOne({ id });

    if (existingProduct) {
      return Response.json(
        {
          success: false,
          message: "A product with this ID already exists.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const newProduct = {
      id,
      name: product.name.trim(),
      series: product.series.trim(),
      color: product.color.trim(),
      price,
      stock,
      image: product.image,
      description: product.description.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("products").insertOne(newProduct);

    return Response.json(
      {
        success: true,
        message: "Product created successfully.",
        product: {
          ...newProduct,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Product Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create product.",
      },
      { status: 500 }
    );
  }
}