import clientPromise from "../../../lib/mongodb";

function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `OBS-${timestamp}${random}`;
}

function normalizeOrderItems(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    series: item.series || "",
    color: item.color || "",
    size: item.size || "",
    quantity: Number(item.quantity) || 1,
    price: Number(item.price) || 0,
    image: item.image || "",
  }));
}

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

    const customer = orderData.customer;
    const items = normalizeOrderItems(orderData.items || []);

    if (
      !customer?.fullName ||
      !customer?.phone ||
      !customer?.address ||
      items.length === 0
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

    for (const item of items) {
      const product = await db.collection("products").findOne({ id: item.id });

      if (!product) {
        return Response.json(
          {
            success: false,
            message: `${item.name} was not found.`,
          },
          { status: 404 }
        );
      }

      if (Number(product.stock) < Number(item.quantity)) {
        return Response.json(
          {
            success: false,
            message: `${item.name} does not have enough stock.`,
          },
          { status: 400 }
        );
      }
    }

    const subtotal = Number(orderData.subtotal) || 0;
    const deliveryCharge = Number(orderData.deliveryCharge) || 0;
    const total = Number(orderData.total) || subtotal + deliveryCharge;

    const now = new Date();

    const order = {
      orderId: generateOrderId(),
      status: "pending",
      paymentMethod: "cash_on_delivery",

      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address,
        note: customer.note || "",
      },

      items,
      subtotal,
      deliveryCharge,
      total,

      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("orders").insertOne(order);

    for (const item of items) {
      await db.collection("products").updateOne(
        { id: item.id },
        {
          $inc: {
            stock: -Number(item.quantity),
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );
    }

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