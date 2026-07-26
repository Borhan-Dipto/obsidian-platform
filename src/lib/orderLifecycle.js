import "server-only";

import {
  PRODUCTS_COLLECTION_NAME,
} from "./catalog";

import {
  COUPONS_COLLECTION_NAME,
} from "./orderPricing";

export const ORDER_STATUS_TRANSITIONS =
  Object.freeze({
    pending: Object.freeze([
      "confirmed",
      "cancelled",
    ]),

    confirmed: Object.freeze([
      "processing",
      "cancelled",
    ]),

    processing: Object.freeze([
      "packed",
      "cancelled",
    ]),

    packed: Object.freeze([
      "shipped",
      "cancelled",
    ]),

    shipped: Object.freeze([
      "delivered",
    ]),

    delivered: Object.freeze([]),
    cancelled: Object.freeze([]),
  });

export class OrderLifecycleError extends Error {
  constructor(
    message,
    {
      status = 409,
      code =
        "ORDER_LIFECYCLE_CONFLICT",
    } = {}
  ) {
    super(message);

    this.name =
      "OrderLifecycleError";

    this.status = status;
    this.code = code;
  }
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function normalizeQuantity(value) {
  const quantity =
    Number(value);

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1 ||
    quantity > 100
  ) {
    throw new OrderLifecycleError(
      "Inventory reservation contains an invalid quantity.",
      {
        status: 500,

        code:
          "INVALID_INVENTORY_RESERVATION",
      }
    );
  }

  return quantity;
}

function normalizeSizeKey(value) {
  return String(
    value || ""
  )
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en");
}

function normalizeCouponCode(
  value
) {
  return String(
    value || ""
  )
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .slice(0, 50);
}

function isSafeMongoField(
  value
) {
  const field =
    String(value || "");

  return Boolean(
    field &&
      !field.includes(".") &&
      !field.startsWith("$") &&
      !field.includes("\u0000")
  );
}

export function isAllowedOrderStatusTransition(
  previousStatus,
  nextStatus
) {
  if (
    previousStatus ===
    nextStatus
  ) {
    return true;
  }

  return Boolean(
    ORDER_STATUS_TRANSITIONS[
      previousStatus
    ]?.includes(nextStatus)
  );
}

export function createInventoryReservationRecord(
  item
) {
  if (
    !item ||
    !item.id ||
    !item.inventory
  ) {
    throw new OrderLifecycleError(
      "Inventory reservation data is invalid.",
      {
        status: 500,

        code:
          "INVALID_INVENTORY_RESERVATION",
      }
    );
  }

  const mode =
    item.inventory.mode ===
    "size"
      ? "size"
      : "total";

  const sizeStockField =
    mode === "size"
      ? String(
          item.inventory
            .sizeStockField ||
            ""
        )
      : "";

  if (
    mode === "size" &&
    !isSafeMongoField(
      sizeStockField
    )
  ) {
    throw new OrderLifecycleError(
      "Inventory reservation size data is invalid.",
      {
        status: 500,

        code:
          "INVALID_INVENTORY_RESERVATION",
      }
    );
  }

  return {
    productId:
      String(item.id),

    quantity:
      normalizeQuantity(
        item.quantity
      ),

    mode,
    sizeStockField,

    incrementTotalStock:
      mode === "total" ||
      Boolean(
        item.inventory
          .decrementTotalStock
      ),
  };
}

function normalizeStoredReservations(
  order
) {
  if (
    !Array.isArray(
      order?.inventoryReservations
    ) ||
    order.inventoryReservations
      .length === 0
  ) {
    return null;
  }

  return order
    .inventoryReservations
    .map((reservation) => {
      const productId =
        String(
          reservation?.productId ||
            reservation?.id ||
            ""
        ).trim();

      if (!productId) {
        throw new OrderLifecycleError(
          "Inventory reservation product data is invalid.",
          {
            status: 500,

            code:
              "INVALID_INVENTORY_RESERVATION",
          }
        );
      }

      const mode =
        reservation?.mode ===
        "size"
          ? "size"
          : "total";

      const sizeStockField =
        mode === "size"
          ? String(
              reservation
                ?.sizeStockField ||
                ""
            )
          : "";

      if (
        mode === "size" &&
        !isSafeMongoField(
          sizeStockField
        )
      ) {
        throw new OrderLifecycleError(
          "Stored size inventory reservation is invalid.",
          {
            status: 500,

            code:
              "INVALID_INVENTORY_RESERVATION",
          }
        );
      }

      return {
        productId,

        quantity:
          normalizeQuantity(
            reservation
              ?.quantity
          ),

        mode,
        sizeStockField,

        incrementTotalStock:
          mode === "total" ||
          Boolean(
            reservation
              ?.incrementTotalStock
          ),
      };
    });
}

async function reconstructLegacyReservations({
  database,
  order,
  session,
}) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  if (items.length === 0) {
    throw new OrderLifecycleError(
      "This legacy order does not contain restockable line items.",
      {
        code:
          "LEGACY_INVENTORY_DATA_MISSING",
      }
    );
  }

  const productIds =
    Array.from(
      new Set(
        items
          .map((item) =>
            String(
              item?.id ||
                item?.productId ||
                ""
            ).trim()
          )
          .filter(Boolean)
      )
    );

  const products =
    await database
      .collection(
        PRODUCTS_COLLECTION_NAME
      )
      .find(
        {
          id: {
            $in:
              productIds,
          },
        },
        {
          session,
        }
      )
      .toArray();

  const productMap =
    new Map(
      products.map(
        (product) => [
          String(
            product.id
          ),

          product,
        ]
      )
    );

  return items.map(
    (item) => {
      const productId =
        String(
          item?.id ||
            item?.productId ||
            ""
        ).trim();

      const product =
        productMap.get(
          productId
        );

      if (!product) {
        throw new OrderLifecycleError(
          `Product ${
            productId ||
            "unknown"
          } is missing, so inventory cannot be restored safely.`,
          {
            code:
              "LEGACY_PRODUCT_MISSING",
          }
        );
      }

      const quantity =
        normalizeQuantity(
          item?.quantity
        );

      const sizeStock =
        isPlainObject(
          product.sizeStock
        )
          ? product.sizeStock
          : null;

      const requestedSizeKey =
        normalizeSizeKey(
          item?.size
        );

      if (
        sizeStock &&
        requestedSizeKey
      ) {
        const matchingEntry =
          Object.entries(
            sizeStock
          ).find(
            ([fieldName]) =>
              normalizeSizeKey(
                fieldName
              ) ===
              requestedSizeKey
          );

        if (
          matchingEntry
        ) {
          const [
            sizeStockField,
          ] = matchingEntry;

          if (
            !isSafeMongoField(
              sizeStockField
            )
          ) {
            throw new OrderLifecycleError(
              "Legacy size inventory data is invalid.",
              {
                code:
                  "INVALID_LEGACY_SIZE_STOCK",
              }
            );
          }

          return {
            productId,
            quantity,

            mode:
              "size",

            sizeStockField,

            incrementTotalStock:
              Number.isFinite(
                Number(
                  product.stock
                )
              ),
          };
        }

        if (
          Object.keys(
            sizeStock
          ).length > 0
        ) {
          throw new OrderLifecycleError(
            `Size ${
              item?.size ||
              "unknown"
            } cannot be matched for product ${productId}.`,
            {
              code:
                "LEGACY_SIZE_STOCK_MISMATCH",
            }
          );
        }
      }

      return {
        productId,
        quantity,

        mode:
          "total",

        sizeStockField:
          "",

        incrementTotalStock:
          true,
      };
    }
  );
}

async function resolveInventoryReservations(
  options
) {
  return (
    normalizeStoredReservations(
      options.order
    ) ||
    await reconstructLegacyReservations(
      options
    )
  );
}

function createStockReleaseOperation(
  reservation,
  now
) {
  const increment = {};

  if (
    reservation.mode ===
    "size"
  ) {
    increment[
      `sizeStock.${
        reservation
          .sizeStockField
      }`
    ] = reservation.quantity;

    if (
      reservation
        .incrementTotalStock
    ) {
      increment.stock =
        reservation.quantity;
    }
  } else {
    increment.stock =
      reservation.quantity;
  }

  return {
    updateOne: {
      filter: {
        id:
          reservation.productId,
      },

      update: {
        $inc: increment,

        $set: {
          updatedAt: now,
        },
      },
    },
  };
}

function createCouponUsageReleaseOperation(
  couponReference,
  now
) {
  const couponId =
    couponReference?.couponId ||
    couponReference?._id ||
    null;

  const couponCode =
    normalizeCouponCode(
      couponReference?.code ||
        couponReference
          ?.normalizedCode ||
        ""
    );

  const identityFilters = [];

  if (couponId) {
    identityFilters.push({
      _id: couponId,
    });
  }

  if (couponCode) {
    identityFilters.push(
      {
        normalizedCode:
          couponCode,
      },
      {
        code:
          couponCode,
      }
    );
  }

  if (
    identityFilters.length ===
    0
  ) {
    return null;
  }

  const currentUsageExpression = {
    $ifNull: [
      "$usageCount",
      {
        $ifNull: [
          "$usedCount",
          0,
        ],
      },
    ],
  };

  return {
    filter: {
      $and: [
        {
          $or:
            identityFilters,
        },
        {
          $expr: {
            $gt: [
              currentUsageExpression,
              0,
            ],
          },
        },
      ],
    },

    update: [
      {
        $set: {
          usageCount: {
            $max: [
              0,
              {
                $subtract: [
                  currentUsageExpression,
                  1,
                ],
              },
            ],
          },

          updatedAt: now,
        },
      },
    ],
  };
}

export async function releaseCancelledOrderReservations({
  database,
  order,
  session,
  changedAt = new Date(),
  reason = "Order cancelled",
}) {
  const fieldsToSet = {};
  const changedFields = [];

  let inventoryReleased =
    false;

  let couponUsageReleased =
    false;

  if (
    order
      ?.inventoryReservationStatus !==
    "released"
  ) {
    const reservations =
      await resolveInventoryReservations({
        database,
        order,
        session,
      });

    const releaseOperations =
      reservations.map(
        (reservation) =>
          createStockReleaseOperation(
            reservation,
            changedAt
          )
      );

    const inventoryResult =
      await database
        .collection(
          PRODUCTS_COLLECTION_NAME
        )
        .bulkWrite(
          releaseOperations,
          {
            ordered: true,
            session,
          }
        );

    if (
      inventoryResult
        .matchedCount !==
      releaseOperations.length
    ) {
      throw new OrderLifecycleError(
        "One or more products could not be restored to inventory.",
        {
          code:
            "INVENTORY_RELEASE_FAILED",
        }
      );
    }

    Object.assign(
      fieldsToSet,
      {
        inventoryReservations:
          reservations,

        inventoryReservationStatus:
          "released",

        inventoryReleasedAt:
          changedAt,

        inventoryReleaseReason:
          String(
            reason ||
              "Order cancelled"
          ).slice(
            0,
            2000
          ),
      }
    );

    changedFields.push(
      "inventoryReservations",
      "inventoryReservationStatus",
      "inventoryReleasedAt",
      "inventoryReleaseReason"
    );

    inventoryReleased =
      true;
  }

  const hasCouponUsage =
    Boolean(
      order?.coupon?.code ||
      order
        ?.couponUsageReservation
    );

  if (
    hasCouponUsage &&
    order
      ?.couponUsageStatus !==
      "released"
  ) {
    const couponReference =
      order
        .couponUsageReservation ||
      {
        code:
          order
            ?.coupon
            ?.code ||
          "",
      };

    const couponOperation =
      createCouponUsageReleaseOperation(
        couponReference,
        changedAt
      );

    if (!couponOperation) {
      throw new OrderLifecycleError(
        "Coupon usage cannot be restored because its reference is missing.",
        {
          code:
            "COUPON_RELEASE_REFERENCE_MISSING",
        }
      );
    }

    const couponResult =
      await database
        .collection(
          COUPONS_COLLECTION_NAME
        )
        .updateOne(
          couponOperation.filter,
          couponOperation.update,
          {
            session,
          }
        );

    if (
      couponResult
        .modifiedCount !==
      1
    ) {
      throw new OrderLifecycleError(
        "Coupon usage could not be restored safely.",
        {
          code:
            "COUPON_RELEASE_FAILED",
        }
      );
    }

    Object.assign(
      fieldsToSet,
      {
        couponUsageReservation:
          couponReference,

        couponUsageStatus:
          "released",

        couponUsageReleasedAt:
          changedAt,
      }
    );

    changedFields.push(
      "couponUsageReservation",
      "couponUsageStatus",
      "couponUsageReleasedAt"
    );

    couponUsageReleased =
      true;
  }

  return {
    fieldsToSet,
    changedFields,
    inventoryReleased,
    couponUsageReleased,
  };
}
