import assert from "node:assert/strict";

import {
  randomUUID,
} from "node:crypto";

import test from "node:test";

import {
  MongoClient,
} from "mongodb";

const integrationUri =
  String(
    process.env
      .MONGODB_INTEGRATION_URI ||
      ""
  ).trim();

function datesAreEqual(
  firstValue,
  secondValue
) {
  return (
    new Date(
      firstValue
    ).getTime() ===
    new Date(
      secondValue
    ).getTime()
  );
}

test(
  "concurrent cancellation restores inventory and coupon usage exactly once",
  {
    skip:
      integrationUri
        ? false
        : "MONGODB_INTEGRATION_URI is not configured.",

    timeout:
      45_000,
  },

  async () => {
    const {
      OrderLifecycleError,
      isAllowedOrderStatusTransition,
      releaseCancelledOrderReservations,
    } = await import(
      "../../src/lib/orderLifecycle.js"
    );

    const client =
      new MongoClient(
        integrationUri,
        {
          serverSelectionTimeoutMS:
            10_000,
        }
      );

    const databaseName =
      `obsidian_h07_${randomUUID()
        .replaceAll("-", "")
        .slice(0, 16)}`;

    await client.connect();

    const database =
      client.db(
        databaseName
      );

    try {
      const replicaSetStatus =
        await client
          .db("admin")
          .command({
            replSetGetStatus: 1,
          });

      assert.equal(
        replicaSetStatus.ok,
        1,

        "Integration MongoDB must run as a replica set."
      );

      const products =
        database.collection(
          "products"
        );

      const coupons =
        database.collection(
          "coupons"
        );

      const orders =
        database.collection(
          "orders"
        );

      const productId =
        "h07-concurrency-product";

      const couponCode =
        "H07-CONCURRENCY";

      const orderId =
        "OBS-H07-CONCURRENCY";

      const initialUpdatedAt =
        new Date(
          "2026-07-26T00:00:00.000Z"
        );

      await products.insertOne({
        id:
          productId,

        stock:
          8,

        sizeStock: {
          M: 3,
        },

        updatedAt:
          initialUpdatedAt,
      });

      await coupons.insertOne({
        code:
          couponCode,

        normalizedCode:
          couponCode,

        usageCount:
          1,

        updatedAt:
          initialUpdatedAt,
      });

      const insertResult =
        await orders.insertOne({
          orderId,

          status:
            "pending",

          updatedAt:
            initialUpdatedAt,

          inventoryReservations: [
            {
              productId,

              quantity:
                2,

              mode:
                "size",

              sizeStockField:
                "M",

              incrementTotalStock:
                true,
            },
          ],

          inventoryReservationStatus:
            "reserved",

          coupon: {
            code:
              couponCode,
          },

          couponUsageReservation: {
            code:
              couponCode,
          },

          couponUsageStatus:
            "reserved",

          activityHistory:
            [],

          statusHistory:
            [],
        });

      const originalOrder =
        await orders.findOne({
          _id:
            insertResult.insertedId,
        });

      assert.ok(
        originalOrder,

        "Seed order must exist."
      );

      async function cancelFromSnapshot(
        changedAt
      ) {
        const session =
          client.startSession();

        try {
          await session.withTransaction(
            async () => {
              const transactionOrder =
                await orders.findOne(
                  {
                    _id:
                      originalOrder._id,

                    orderId,
                  },
                  {
                    session,
                  }
                );

              if (!transactionOrder) {
                throw new OrderLifecycleError(
                  "Order not found during cancellation.",
                  {
                    status:
                      404,

                    code:
                      "ORDER_NOT_FOUND",
                  }
                );
              }

              if (
                !datesAreEqual(
                  transactionOrder.updatedAt,
                  originalOrder.updatedAt
                )
              ) {
                throw new OrderLifecycleError(
                  "Concurrent order update detected.",
                  {
                    code:
                      "ORDER_UPDATE_CONFLICT",
                  }
                );
              }

              if (
                !isAllowedOrderStatusTransition(
                  transactionOrder.status,
                  "cancelled"
                )
              ) {
                throw new OrderLifecycleError(
                  "Invalid cancellation transition.",
                  {
                    code:
                      "INVALID_STATUS_TRANSITION",
                  }
                );
              }

              const releaseResult =
                await releaseCancelledOrderReservations(
                  {
                    database,

                    order:
                      transactionOrder,

                    session,
                    changedAt,

                    reason:
                      "H-07 concurrency test",
                  }
                );

              const updateResult =
                await orders.updateOne(
                  {
                    _id:
                      transactionOrder._id,

                    orderId,

                    status:
                      transactionOrder.status,

                    updatedAt:
                      transactionOrder.updatedAt,
                  },
                  {
                    $set: {
                      status:
                        "cancelled",

                      cancelledAt:
                        changedAt,

                      updatedAt:
                        changedAt,

                      ...releaseResult
                        .fieldsToSet,
                    },

                    $push: {
                      activityHistory: {
                        type:
                          "order-management-update",

                        actor:
                          "integration-test",

                        changedAt,

                        commerceRelease: {
                          inventoryReleased:
                            releaseResult
                              .inventoryReleased,

                          couponUsageReleased:
                            releaseResult
                              .couponUsageReleased,
                        },
                      },

                      statusHistory: {
                        from:
                          transactionOrder.status,

                        to:
                          "cancelled",

                        status:
                          "cancelled",

                        actor:
                          "integration-test",

                        changedAt,
                      },
                    },
                  },
                  {
                    session,
                  }
                );

              if (
                updateResult.matchedCount !==
                1
              ) {
                throw new OrderLifecycleError(
                  "Concurrent order update detected.",
                  {
                    code:
                      "ORDER_UPDATE_CONFLICT",
                  }
                );
              }
            },
            {
              readConcern: {
                level:
                  "snapshot",
              },

              writeConcern: {
                w:
                  "majority",
              },

              readPreference:
                "primary",
            }
          );

          return {
            success:
              true,
          };
        } finally {
          await session.endSession();
        }
      }

      const cancellationResults =
        await Promise.allSettled([
          cancelFromSnapshot(
            new Date(
              "2026-07-26T00:01:00.001Z"
            )
          ),

          cancelFromSnapshot(
            new Date(
              "2026-07-26T00:01:00.002Z"
            )
          ),
        ]);

      const successfulResults =
        cancellationResults.filter(
          (result) =>
            result.status ===
            "fulfilled"
        );

      const rejectedResults =
        cancellationResults.filter(
          (result) =>
            result.status ===
            "rejected"
        );

      assert.equal(
        successfulResults.length,
        1,

        "Exactly one concurrent cancellation must commit."
      );

      assert.equal(
        rejectedResults.length,
        1,

        "The competing cancellation must be rejected."
      );

      const finalProduct =
        await products.findOne({
          id:
            productId,
        });

      assert.equal(
        finalProduct.stock,
        10,

        "Total product stock must be restored once."
      );

      assert.equal(
        finalProduct
          .sizeStock.M,
        5,

        "Size stock must be restored once."
      );

      const finalCoupon =
        await coupons.findOne({
          normalizedCode:
            couponCode,
        });

      assert.equal(
        finalCoupon.usageCount,
        0,

        "Coupon usage must be released once."
      );

      const finalOrder =
        await orders.findOne({
          orderId,
        });

      assert.equal(
        finalOrder.status,
        "cancelled"
      );

      assert.equal(
        finalOrder
          .inventoryReservationStatus,
        "released"
      );

      assert.equal(
        finalOrder
          .couponUsageStatus,
        "released"
      );

      assert.equal(
        finalOrder
          .activityHistory.length,
        1,

        "Cancellation activity must be recorded once."
      );

      assert.equal(
        finalOrder
          .statusHistory.length,
        1,

        "Cancellation status history must be recorded once."
      );

      const noOpRelease =
        await releaseCancelledOrderReservations(
          {
            database,

            order:
              finalOrder,

            session:
              null,

            changedAt:
              new Date(
                "2026-07-26T00:02:00.000Z"
              ),

            reason:
              "Repeated cancellation attempt",
          }
        );

      assert.equal(
        noOpRelease
          .inventoryReleased,
        false,

        "Already-released inventory must not be released again."
      );

      assert.equal(
        noOpRelease
          .couponUsageReleased,
        false,

        "Already-released coupon usage must not be released again."
      );

      const productAfterNoOp =
        await products.findOne({
          id:
            productId,
        });

      const couponAfterNoOp =
        await coupons.findOne({
          normalizedCode:
            couponCode,
        });

      assert.equal(
        productAfterNoOp.stock,
        10
      );

      assert.equal(
        productAfterNoOp
          .sizeStock.M,
        5
      );

      assert.equal(
        couponAfterNoOp
          .usageCount,
        0
      );
    } finally {
      await database.dropDatabase();
      await client.close();
    }
  }
);
