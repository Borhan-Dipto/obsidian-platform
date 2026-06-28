import clientPromise from "../../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const orders = await db.collection("orders").find({}).toArray();
    const products = await db.collection("products").find({}).toArray();

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order.total) || 0),
      0
    );

    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const confirmedOrders = orders.filter(
      (order) => order.status === "confirmed"
    ).length;

    const packedOrders = orders.filter(
      (order) => order.status === "packed"
    ).length;

    const shippedOrders = orders.filter(
      (order) => order.status === "shipped"
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const totalProducts = products.length;

    const lowStockProducts = products.filter(
      (product) => Number(product.stock) < 10
    ).length;

    const recentOrders = orders
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 5);

    return Response.json({
      success: true,

      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        confirmedOrders,
        packedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        lowStockProducts,
      },

      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to load dashboard stats.",
      },
      {
        status: 500,
      }
    );
  }
}