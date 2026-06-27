import clientPromise from "../../../../lib/mongodb";

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const product = await db.collection("products").findOne({ id });

    if (!product) {
      return Response.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET Product Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch product.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const updateData = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const result = await db.collection("products").updateOne(
      { id },
      {
        $set: {
          ...updateData,
          price: Number(updateData.price),
          stock: Number(updateData.stock),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("PATCH Product Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const result = await db.collection("products").deleteOne({ id });

    if (result.deletedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE Product Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to delete product.",
      },
      { status: 500 }
    );
  }
}