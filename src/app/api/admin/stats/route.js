import clientPromise from "../../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalProducts,
      lowStockProducts,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      ordersCollection.countDocuments(),
      ordersCollection.countDocuments({ status: "pending" }),
      ordersCollection.countDocuments({ status: "confirmed" }),
      ordersCollection.countDocuments({ status: "packed" }),
      ordersCollection.countDocuments({ status: "shipped" }),
      ordersCollection.countDocuments({ status: "delivered" }),
      ordersCollection.countDocuments({ status: "cancelled" }),
      productsCollection.countDocuments(),
      productsCollection.countDocuments({ stock: { $lt: 10 } }),

      ordersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $toDouble: "$total",
                },
              },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

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
      { status: 500 }
    );
  }
}