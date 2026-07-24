import {
  requireAdminApiPermission,
} from "../../../../lib/adminApiAuthorization";

import clientPromise from "../../../../lib/mongodb";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

function jsonResponse(
  body,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",

        Pragma:
          "no-cache",

        "X-Content-Type-Options":
          "nosniff",
      },
    }
  );
}

export async function GET(
  request
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          dashboard: [
            "read",
          ],
        },
        {
          path:
            "/api/admin/stats",

          forbiddenMessage:
            "You do not have permission to view dashboard statistics.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const client =
      await clientPromise;

    const database =
      client.db(
        process.env.MONGODB_DB ||
          "obsidian"
      );

    const ordersCollection =
      database.collection(
        "orders"
      );

    const productsCollection =
      database.collection(
        "products"
      );

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

      ordersCollection.countDocuments({
        status:
          "pending",
      }),

      ordersCollection.countDocuments({
        status:
          "confirmed",
      }),

      ordersCollection.countDocuments({
        status:
          "packed",
      }),

      ordersCollection.countDocuments({
        status:
          "shipped",
      }),

      ordersCollection.countDocuments({
        status:
          "delivered",
      }),

      ordersCollection.countDocuments({
        status:
          "cancelled",
      }),

      productsCollection.countDocuments(),

      productsCollection.countDocuments({
        stock: {
          $lt: 10,
        },
      }),

      ordersCollection
        .aggregate([
          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum: {
                  $convert: {
                    input:
                      "$total",

                    to:
                      "double",

                    onError:
                      0,

                    onNull:
                      0,
                  },
                },
              },
            },
          },
        ])
        .toArray(),

      ordersCollection
        .find({})
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .toArray(),
    ]);

    const totalRevenue =
      Number(
        revenueResult[0]
          ?.totalRevenue
      ) || 0;

    return jsonResponse({
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
    console.error(
      "Dashboard Stats Error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Failed to load dashboard stats.",
      },
      500
    );
  }
}