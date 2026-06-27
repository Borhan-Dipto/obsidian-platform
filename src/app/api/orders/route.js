import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET Orders Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch orders.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const orderData = await request.json();

    if (
      !orderData.customer ||
      !orderData.items ||
      orderData.items.length === 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid order data.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const order = {
      orderId: `OBS-${Date.now()}`,
      status: "pending",
      createdAt: new Date(),
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total,
    };

    const result = await db.collection("orders").insertOne(order);

    return Response.json(
      {
        success: true,
        message: "Order saved successfully.",
        order: {
          ...order,
          _id: result.insertedId,
          id: order.orderId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Order Error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while creating order.",
      },
      { status: 500 }
    );
  }
}