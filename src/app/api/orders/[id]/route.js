import clientPromise from "../../../../lib/mongodb";

const allowedStatuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function GET(request, context) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const order = await db.collection("orders").findOne({
      orderId: id,
    });

    if (!order) {
      return Response.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order Details Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch order.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const { status } = await request.json();

    if (!allowedStatuses.includes(status)) {
      return Response.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const result = await db.collection("orders").updateOne(
      { orderId: id },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Order status updated successfully.",
    });
  } catch (error) {
    console.error("Order Status Update Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update order status.",
      },
      { status: 500 }
    );
  }
}