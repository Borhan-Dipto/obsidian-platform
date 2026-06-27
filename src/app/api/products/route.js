import clientPromise from "../../../lib/mongodb";

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
    console.error(error);

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

    if (!product.name || !product.price) {
      return Response.json(
        {
          success: false,
          message: "Missing required fields.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const newProduct = {
      ...product,
      createdAt: new Date(),
    };

    const result = await db
      .collection("products")
      .insertOne(newProduct);

    return Response.json(
      {
        success: true,
        product: {
          ...newProduct,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Failed to create product.",
      },
      { status: 500 }
    );
  }
}