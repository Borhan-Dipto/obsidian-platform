import crypto from "crypto";

import {
  requireAdminApiPermission,
} from "../../../../lib/adminApiAuthorization";

import clientPromise from "../../../../lib/mongodb";

import {
  dispatchOrderStatusNotifications,
} from "../../../../lib/orderNotifications";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const ALLOWED_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const ALLOWED_PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "partially-refunded",
  "refunded",
];

const EDITABLE_TEXT_FIELDS = {
  transactionId: 250,
  paymentNote: 3000,
  courierName: 250,
  trackingNumber: 250,
  deliveryNote: 3000,
  internalNote: 5000,
  cancellationReason: 2000,
};

const EDITABLE_DATE_FIELDS = [
  "paymentReceivedAt",
  "courierBookingDate",
  "estimatedDelivery",
];

const TRACKING_WINDOW_MS =
  15 * 60 * 1000;

const TRACKING_MAX_ATTEMPTS =
  20;

const trackingAttempts =
  globalThis
    .__obsidianTrackingAttempts ||
  new Map();

globalThis
  .__obsidianTrackingAttempts =
  trackingAttempts;

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
          "no-store",
      },
    }
  );
}

function hasOwn(
  object,
  key
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function normalizeStatus(
  value
) {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toLowerCase()
    : "";
}

function normalizeOrderId(
  value
) {
  return String(
    value ?? ""
  )
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .slice(0, 120);
}

function normalizePhone(
  value
) {
  return String(
    value ?? ""
  ).replace(
    /\D/g,
    ""
  );
}

function normalizeText(
  value,
  maxLength
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "INVALID_TEXT_VALUE"
    );
  }

  return value
    .normalize("NFKC")
    .trim()
    .slice(
      0,
      maxLength
    );
}

function normalizeOptionalDate(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !==
      "string" &&
    !(
      value instanceof Date
    )
  ) {
    throw new Error(
      "INVALID_DATE_VALUE"
    );
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new Error(
      "INVALID_DATE_VALUE"
    );
  }

  return parsedDate;
}

function normalizeUrl(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "INVALID_TRACKING_URL"
    );
  }

  const normalizedValue =
    value
      .trim()
      .slice(0, 2000);

  let parsedUrl;

  try {
    parsedUrl =
      new URL(
        normalizedValue
      );
  } catch {
    throw new Error(
      "INVALID_TRACKING_URL"
    );
  }

  if (
    parsedUrl.protocol !==
      "http:" &&
    parsedUrl.protocol !==
      "https:"
  ) {
    throw new Error(
      "INVALID_TRACKING_URL"
    );
  }

  return normalizedValue;
}

function safeCompare(
  firstValue,
  secondValue
) {
  const firstBuffer =
    Buffer.from(
      String(
        firstValue || ""
      ),
      "utf8"
    );

  const secondBuffer =
    Buffer.from(
      String(
        secondValue || ""
      ),
      "utf8"
    );

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}

function maskPhone(
  phone
) {
  const normalizedPhone =
    normalizePhone(phone);

  if (
    normalizedPhone.length <=
    4
  ) {
    return normalizedPhone;
  }

  return `${"*".repeat(
    Math.max(
      4,
      normalizedPhone.length -
        4
    )
  )}${normalizedPhone.slice(
    -4
  )}`;
}

function getClientKey(
  request
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const ipAddress =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "unknown";

  return `track:${ipAddress}`;
}

function consumeTrackingAttempt(
  request
) {
  const now =
    Date.now();

  const key =
    getClientKey(
      request
    );

  if (
    trackingAttempts.size >
    5000
  ) {
    for (
      const [
        attemptKey,
        attempt,
      ]
      of trackingAttempts.entries()
    ) {
      if (
        now -
          attempt.startedAt >
        TRACKING_WINDOW_MS
      ) {
        trackingAttempts.delete(
          attemptKey
        );
      }
    }
  }

  const existingAttempt =
    trackingAttempts.get(
      key
    );

  if (
    !existingAttempt ||
    now -
      existingAttempt.startedAt >
      TRACKING_WINDOW_MS
  ) {
    trackingAttempts.set(
      key,
      {
        count: 1,
        startedAt: now,
      }
    );

    return true;
  }

  if (
    existingAttempt.count >=
    TRACKING_MAX_ATTEMPTS
  ) {
    return false;
  }

  existingAttempt.count +=
    1;

  trackingAttempts.set(
    key,
    existingAttempt
  );

  return true;
}

function serializePublicOrder(
  order
) {
  const pricing =
    order?.pricing || {};

  const statusHistory =
    Array.isArray(
      order?.statusHistory
    )
      ? order.statusHistory.map(
          (entry) => ({
            status:
              normalizeStatus(
                entry?.status ||
                  entry?.to
              ) ||
              "pending",

            changedAt:
              entry?.changedAt ||
              null,
          })
        )
      : [];

  return {
    orderId:
      order.orderId,

    id:
      order.orderId,

    status:
      normalizeStatus(
        order.status
      ) || "pending",

    paymentStatus:
      normalizeStatus(
        order.paymentStatus
      ) || "unpaid",

    paymentMethod:
      order.paymentMethod ||
      "",

    paymentMethodLabel:
      order.paymentMethodLabel ||
      "",

    customer: {
      fullName:
        order.customer
          ?.fullName ||
        "",

      phone:
        maskPhone(
          order.customer?.phone
        ),

      address:
        order.customer
          ?.address ||
        "",

      deliveryArea:
        order.customer
          ?.deliveryArea ||
        order.deliveryArea ||
        "",
    },

    items:
      Array.isArray(
        order.items
      )
        ? order.items
        : [],

    pricing: {
      currency:
        pricing.currency ||
        "BDT",

      subtotal:
        Number(
          pricing.subtotal ??
            order.subtotal ??
            0
        ) || 0,

      originalDeliveryCharge:
        Number(
          pricing.originalDeliveryCharge ??
            order.originalDeliveryCharge ??
            order.deliveryCharge ??
            0
        ) || 0,

      productDiscount:
        Number(
          pricing.productDiscount ??
            0
        ) || 0,

      deliveryDiscount:
        Number(
          pricing.deliveryDiscount ??
            0
        ) || 0,

      totalDiscount:
        Number(
          pricing.totalDiscount ??
            order.discount ??
            0
        ) || 0,

      payableDeliveryCharge:
        Number(
          pricing.payableDeliveryCharge ??
            order.deliveryCharge ??
            0
        ) || 0,

      total:
        Number(
          pricing.total ??
            order.total ??
            0
        ) || 0,
    },

    coupon:
      order.coupon
        ? {
            code:
              order.coupon
                .code ||
              "",
          }
        : null,

    courier: {
      name:
        order.courierName ||
        "",

      trackingNumber:
        order.trackingNumber ||
        "",

      trackingUrl:
        order.trackingUrl ||
        "",
    },

    estimatedDelivery:
      order.estimatedDelivery ||
      null,

    statusHistory,

    createdAt:
      order.createdAt ||
      null,

    updatedAt:
      order.updatedAt ||
      null,

    confirmedAt:
      order.confirmedAt ||
      null,

    processingAt:
      order.processingAt ||
      null,

    packedAt:
      order.packedAt ||
      null,

    shippedAt:
      order.shippedAt ||
      null,

    deliveredAt:
      order.deliveredAt ||
      null,

    cancelledAt:
      order.cancelledAt ||
      null,
  };
}

function normalizeComparableValue(
  value
) {
  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  if (
    value === undefined
  ) {
    return null;
  }

  return value;
}

function valuesAreEqual(
  firstValue,
  secondValue
) {
  return (
    normalizeComparableValue(
      firstValue
    ) ===
    normalizeComparableValue(
      secondValue
    )
  );
}

function createValidationResponse(
  message
) {
  return jsonResponse(
    {
      success: false,
      message,
    },
    400
  );
}

function getEffectiveValue({
  body,
  existingOrder,
  normalizedUpdates,
  field,
}) {
  if (
    hasOwn(
      normalizedUpdates,
      field
    )
  ) {
    return normalizedUpdates[
      field
    ];
  }

  if (
    hasOwn(
      body,
      field
    )
  ) {
    return body[field];
  }

  return existingOrder[
    field
  ];
}

function getAutomaticStatusTimestamp(
  status
) {
  const timestampFields = {
    confirmed:
      "confirmedAt",

    processing:
      "processingAt",

    packed:
      "packedAt",

    shipped:
      "shippedAt",

    delivered:
      "deliveredAt",

    cancelled:
      "cancelledAt",
  };

  return (
    timestampFields[
      status
    ] || null
  );
}

function getRequestOrigin(
  request
) {
  try {
    return new URL(
      request.url
    ).origin;
  } catch {
    return "";
  }
}

async function sendStatusNotifications({
  request,
  order,
  previousStatus,
  nextStatus,
}) {
  try {
    const summary =
      await dispatchOrderStatusNotifications(
        {
          order,
          previousStatus,
          nextStatus,

          baseUrl:
            getRequestOrigin(
              request
            ),
        }
      );

    if (
      summary.failed > 0
    ) {
      console.warn(
        "Order status notification delivery completed with failures:",
        {
          orderId:
            order?.orderId ||
            "",

          previousStatus,
          nextStatus,

          attempted:
            summary.attempted,

          sent:
            summary.sent,

          failed:
            summary.failed,

          skipped:
            summary.skipped,
        }
      );
    }

    return summary;
  } catch (error) {
    console.error(
      "Order status notification dispatch error:",
      {
        orderId:
          order?.orderId ||
          "",

        previousStatus,
        nextStatus,

        message:
          error?.message ||
          error,
      }
    );

    return null;
  }
}

async function getDatabase() {
  const client =
    await clientPromise;

  return client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );
}

export async function GET(
  request,
  context
) {
  try {
    const { id } =
      await context.params;

    const orderId =
      normalizeOrderId(
        id
      );

    if (!orderId) {
      return createValidationResponse(
        "Tracking ID is required."
      );
    }

    const database =
      await getDatabase();

    const order =
      await database
        .collection(
          "orders"
        )
        .findOne({
          orderId,
        });

    if (!order) {
      return jsonResponse(
        {
          success: false,

          message:
            "Order not found. Check your tracking ID and phone number.",
        },
        404
      );
    }

    const authorization =
      await requireAdminApiPermission(
        request,
        {
          orders: [
            "read",
          ],
        },
        {
          path:
            "/api/orders/[id]",

          forbiddenMessage:
            "You do not have permission to view order details.",
        }
      );

    if (
      authorization.authorized
    ) {
      return jsonResponse({
        success: true,
        order,
      });
    }

    /*
     * An unauthenticated visitor may
     * continue through public tracking.
     *
     * An authenticated Admin Workspace
     * account without orders.read must
     * receive the permission response.
     */
    if (
      authorization.response
        ?.status !== 401
    ) {
      return authorization.response;
    }

    if (
      !consumeTrackingAttempt(
        request
      )
    ) {
      return jsonResponse(
        {
          success: false,

          message:
            "Too many tracking attempts. Please try again later.",
        },
        429
      );
    }

    const requestUrl =
      new URL(
        request.url
      );

    const phone =
      normalizePhone(
        requestUrl.searchParams.get(
          "phone"
        )
      );

    if (
      phone.length < 10 ||
      phone.length > 14
    ) {
      return createValidationResponse(
        "Enter the phone number used when placing the order."
      );
    }

    const orderPhone =
      normalizePhone(
        order.customer?.phone
      );

    if (
      !safeCompare(
        phone,
        orderPhone
      )
    ) {
      return jsonResponse(
        {
          success: false,

          message:
            "Order not found. Check your tracking ID and phone number.",
        },
        404
      );
    }

    return jsonResponse({
      success: true,

      order:
        serializePublicOrder(
          order
        ),
    });
  } catch (error) {
    console.error(
      "Order Details Error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Failed to fetch order details.",
      },
      500
    );
  }
}

export async function PATCH(
  request,
  context
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          orders: [
            "update",
          ],
        },
        {
          path:
            "/api/orders/[id]",

          forbiddenMessage:
            "You do not have permission to update orders.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const { id } =
      await context.params;

    const orderId =
      normalizeOrderId(
        id
      );

    if (!orderId) {
      return createValidationResponse(
        "Order ID is required."
      );
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return createValidationResponse(
        "A valid JSON request body is required."
      );
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return createValidationResponse(
        "Invalid request body."
      );
    }

    const database =
      await getDatabase();

    const ordersCollection =
      database.collection(
        "orders"
      );

    const existingOrder =
      await ordersCollection.findOne(
        {
          orderId,
        }
      );

    if (!existingOrder) {
      return jsonResponse(
        {
          success: false,

          message:
            "Order not found.",
        },
        404
      );
    }

    const normalizedUpdates =
      {};

    const changedFields =
      [];

    const changedAt =
      new Date();

    const previousStatus =
      normalizeStatus(
        existingOrder.status
      ) || "pending";

    let nextStatus =
      previousStatus;

    let statusChanged =
      false;

    let statusNote =
      "";

    if (
      hasOwn(
        body,
        "status"
      )
    ) {
      nextStatus =
        normalizeStatus(
          body.status
        );

      if (
        !ALLOWED_ORDER_STATUSES.includes(
          nextStatus
        )
      ) {
        return createValidationResponse(
          "Invalid order status."
        );
      }

      statusChanged =
        previousStatus !==
        nextStatus;

      normalizedUpdates.status =
        nextStatus;
    }

    if (
      hasOwn(
        body,
        "statusNote"
      )
    ) {
      try {
        statusNote =
          normalizeText(
            body.statusNote,
            2000
          );
      } catch {
        return createValidationResponse(
          "Status note must be valid text."
        );
      }
    }

    if (
      hasOwn(
        body,
        "paymentStatus"
      )
    ) {
      const nextPaymentStatus =
        normalizeStatus(
          body.paymentStatus
        );

      if (
        !ALLOWED_PAYMENT_STATUSES.includes(
          nextPaymentStatus
        )
      ) {
        return createValidationResponse(
          "Invalid payment status."
        );
      }

      normalizedUpdates
        .paymentStatus =
        nextPaymentStatus;
    }

    for (
      const [
        field,
        maxLength,
      ]
      of Object.entries(
        EDITABLE_TEXT_FIELDS
      )
    ) {
      if (
        !hasOwn(
          body,
          field
        )
      ) {
        continue;
      }

      try {
        normalizedUpdates[
          field
        ] = normalizeText(
          body[field],
          maxLength
        );
      } catch {
        return createValidationResponse(
          `${field} must be valid text.`
        );
      }
    }

    if (
      hasOwn(
        body,
        "trackingUrl"
      )
    ) {
      try {
        normalizedUpdates
          .trackingUrl =
          normalizeUrl(
            body.trackingUrl
          );
      } catch {
        return createValidationResponse(
          "Tracking URL must be a valid http:// or https:// URL."
        );
      }
    }

    for (
      const field
      of EDITABLE_DATE_FIELDS
    ) {
      if (
        !hasOwn(
          body,
          field
        )
      ) {
        continue;
      }

      try {
        normalizedUpdates[
          field
        ] =
          normalizeOptionalDate(
            body[field]
          );
      } catch {
        return createValidationResponse(
          `${field} must contain a valid date.`
        );
      }
    }

    const effectivePaymentStatus =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,

        field:
          "paymentStatus",
      }) || "unpaid";

    const effectivePaymentReceivedAt =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,

        field:
          "paymentReceivedAt",
      });

    const effectiveCancellationReason =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,

        field:
          "cancellationReason",
      });

    const effectiveCourierBookingDate =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,

        field:
          "courierBookingDate",
      });

    const effectiveEstimatedDelivery =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,

        field:
          "estimatedDelivery",
      });

    if (
      effectivePaymentStatus ===
        "paid" &&
      !effectivePaymentReceivedAt
    ) {
      return createValidationResponse(
        "Payment received date is required when payment status is Paid."
      );
    }

    const requiresCancellationReason =
      nextStatus ===
        "cancelled" ||
      effectivePaymentStatus ===
        "refunded" ||
      effectivePaymentStatus ===
        "partially-refunded";

    if (
      requiresCancellationReason &&
      !String(
        effectiveCancellationReason ||
          ""
      ).trim()
    ) {
      return createValidationResponse(
        "A cancellation or refund reason is required."
      );
    }

    if (
      effectiveCourierBookingDate &&
      effectiveEstimatedDelivery
    ) {
      const bookingTimestamp =
        new Date(
          effectiveCourierBookingDate
        ).getTime();

      const deliveryTimestamp =
        new Date(
          effectiveEstimatedDelivery
        ).getTime();

      if (
        Number.isFinite(
          bookingTimestamp
        ) &&
        Number.isFinite(
          deliveryTimestamp
        ) &&
        deliveryTimestamp <
          bookingTimestamp
      ) {
        return createValidationResponse(
          "Estimated delivery cannot be before the courier booking date."
        );
      }
    }

    const fieldsToSet =
      {};

    for (
      const [
        field,
        value,
      ]
      of Object.entries(
        normalizedUpdates
      )
    ) {
      if (
        !valuesAreEqual(
          existingOrder[field],
          value
        )
      ) {
        fieldsToSet[
          field
        ] = value;

        changedFields.push(
          field
        );
      }
    }

    if (statusChanged) {
      const timestampField =
        getAutomaticStatusTimestamp(
          nextStatus
        );

      if (timestampField) {
        fieldsToSet[
          timestampField
        ] = changedAt;

        if (
          !changedFields.includes(
            timestampField
          )
        ) {
          changedFields.push(
            timestampField
          );
        }
      }
    }

    if (
      hasOwn(
        normalizedUpdates,
        "paymentStatus"
      ) &&
      normalizedUpdates
        .paymentStatus ===
        "paid" &&
      !existingOrder.paidAt
    ) {
      fieldsToSet.paidAt =
        normalizedUpdates
          .paymentReceivedAt ||
        existingOrder
          .paymentReceivedAt ||
        changedAt;

      changedFields.push(
        "paidAt"
      );
    }

    if (
      hasOwn(
        normalizedUpdates,
        "paymentStatus"
      ) &&
      [
        "refunded",
        "partially-refunded",
      ].includes(
        normalizedUpdates
          .paymentStatus
      )
    ) {
      fieldsToSet
        .refundUpdatedAt =
        changedAt;

      changedFields.push(
        "refundUpdatedAt"
      );
    }

    if (
      changedFields.length ===
      0
    ) {
      return jsonResponse({
        success: true,

        message:
          "No order changes were required.",

        changed:
          false,

        status:
          previousStatus,

        order:
          existingOrder,
      });
    }

    fieldsToSet.updatedAt =
      changedAt;

    fieldsToSet.lastUpdatedBy =
      "admin";

    const updateOperation = {
      $set:
        fieldsToSet,

      $push: {
        activityHistory: {
          type:
            "order-management-update",

          changedFields,
          changedAt,

          actor:
            "admin",
        },
      },
    };

    if (statusChanged) {
      updateOperation
        .$push
        .statusHistory = {
        from:
          previousStatus,

        to:
          nextStatus,

        status:
          nextStatus,

        note:
          statusNote,

        changedAt,

        actor:
          "admin",
      };
    }

    const updateFilter = {
      _id:
        existingOrder._id,

      orderId,
    };

    if (
      existingOrder.updatedAt
    ) {
      updateFilter.updatedAt =
        existingOrder.updatedAt;
    }

    const result =
      await ordersCollection.updateOne(
        updateFilter,
        updateOperation
      );

    if (
      result.matchedCount ===
      0
    ) {
      return jsonResponse(
        {
          success: false,

          message:
            "This order was updated by another request. Refresh the page and try again.",
        },
        409
      );
    }

    const updatedOrder =
      await ordersCollection.findOne(
        {
          _id:
            existingOrder._id,
        }
      );

    if (
      statusChanged &&
      updatedOrder
    ) {
      await sendStatusNotifications(
        {
          request,

          order:
            updatedOrder,

          previousStatus,
          nextStatus,
        }
      );
    }

    return jsonResponse({
      success: true,

      message:
        "Order details updated successfully.",

      changed:
        true,

      changedFields,
      previousStatus,

      status:
        updatedOrder?.status ||
        nextStatus,

      changedAt,

      order:
        updatedOrder,
    });
  } catch (error) {
    console.error(
      "Order Management Update Error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Failed to update order details.",
      },
      500
    );
  }
}

export const PUT =
  PATCH;