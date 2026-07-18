import clientPromise from "../../../../lib/mongodb";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";

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

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeStatus(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function normalizeText(value, maxLength) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_TEXT_VALUE");
  }

  return value.trim().slice(0, maxLength);
}

function normalizeOptionalDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" &&
    !(value instanceof Date)
  ) {
    throw new Error("INVALID_DATE_VALUE");
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("INVALID_DATE_VALUE");
  }

  return parsedDate;
}

function normalizeUrl(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error("INVALID_TRACKING_URL");
  }

  const normalizedValue = value.trim().slice(0, 2000);

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error("INVALID_TRACKING_URL");
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error("INVALID_TRACKING_URL");
  }

  return normalizedValue;
}

function normalizeComparableValue(value) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

function valuesAreEqual(firstValue, secondValue) {
  return (
    normalizeComparableValue(firstValue) ===
    normalizeComparableValue(secondValue)
  );
}

function createUnauthorizedResponse() {
  return Response.json(
    {
      success: false,
      message: "Admin authentication is required.",
    },
    {
      status: 401,
    }
  );
}

function createValidationResponse(message) {
  return Response.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}

function getEffectiveValue({
  body,
  existingOrder,
  normalizedUpdates,
  field,
}) {
  if (hasOwn(normalizedUpdates, field)) {
    return normalizedUpdates[field];
  }

  if (hasOwn(body, field)) {
    return body[field];
  }

  return existingOrder[field];
}

function getAutomaticStatusTimestamp(status) {
  const timestampFields = {
    confirmed: "confirmedAt",
    processing: "processingAt",
    packed: "packedAt",
    shipped: "shippedAt",
    delivered: "deliveredAt",
    cancelled: "cancelledAt",
  };

  return timestampFields[status] || null;
}

async function getDatabase() {
  const client = await clientPromise;

  return client.db(
    process.env.MONGODB_DB || "obsidian"
  );
}

export async function GET(request, context) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createUnauthorizedResponse();
    }

    const { id } = await context.params;
    const orderId =
      typeof id === "string" ? id.trim() : "";

    if (!orderId) {
      return createValidationResponse(
        "Order ID is required."
      );
    }

    const db = await getDatabase();

    const order = await db
      .collection("orders")
      .findOne({
        orderId,
      });

    if (!order) {
      return Response.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
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
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createUnauthorizedResponse();
    }

    const { id } = await context.params;
    const orderId =
      typeof id === "string" ? id.trim() : "";

    if (!orderId) {
      return createValidationResponse(
        "Order ID is required."
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createValidationResponse(
        "A valid JSON request body is required."
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return createValidationResponse(
        "Invalid request body."
      );
    }

    const db = await getDatabase();
    const ordersCollection =
      db.collection("orders");

    const existingOrder =
      await ordersCollection.findOne({
        orderId,
      });

    if (!existingOrder) {
      return Response.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const normalizedUpdates = {};
    const changedFields = [];
    const changedAt = new Date();

    const previousStatus =
      normalizeStatus(existingOrder.status) ||
      "pending";

    let nextStatus = previousStatus;
    let statusChanged = false;
    let statusNote = "";

    if (hasOwn(body, "status")) {
      nextStatus = normalizeStatus(body.status);

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
        previousStatus !== nextStatus;

      normalizedUpdates.status = nextStatus;
    }

    if (hasOwn(body, "statusNote")) {
      try {
        statusNote = normalizeText(
          body.statusNote,
          2000
        );
      } catch {
        return createValidationResponse(
          "Status note must be valid text."
        );
      }
    }

    if (hasOwn(body, "paymentStatus")) {
      const nextPaymentStatus =
        normalizeStatus(body.paymentStatus);

      if (
        !ALLOWED_PAYMENT_STATUSES.includes(
          nextPaymentStatus
        )
      ) {
        return createValidationResponse(
          "Invalid payment status."
        );
      }

      normalizedUpdates.paymentStatus =
        nextPaymentStatus;
    }

    for (const [field, maxLength] of Object.entries(
      EDITABLE_TEXT_FIELDS
    )) {
      if (!hasOwn(body, field)) {
        continue;
      }

      try {
        normalizedUpdates[field] = normalizeText(
          body[field],
          maxLength
        );
      } catch {
        return createValidationResponse(
          `${field} must be valid text.`
        );
      }
    }

    if (hasOwn(body, "trackingUrl")) {
      try {
        normalizedUpdates.trackingUrl =
          normalizeUrl(body.trackingUrl);
      } catch {
        return createValidationResponse(
          "Tracking URL must be a valid http:// or https:// URL."
        );
      }
    }

    for (const field of EDITABLE_DATE_FIELDS) {
      if (!hasOwn(body, field)) {
        continue;
      }

      try {
        normalizedUpdates[field] =
          normalizeOptionalDate(body[field]);
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
        field: "paymentStatus",
      }) || "unpaid";

    const effectivePaymentReceivedAt =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,
        field: "paymentReceivedAt",
      });

    const effectiveCancellationReason =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,
        field: "cancellationReason",
      });

    const effectiveCourierBookingDate =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,
        field: "courierBookingDate",
      });

    const effectiveEstimatedDelivery =
      getEffectiveValue({
        body,
        existingOrder,
        normalizedUpdates,
        field: "estimatedDelivery",
      });

    if (
      effectivePaymentStatus === "paid" &&
      !effectivePaymentReceivedAt
    ) {
      return createValidationResponse(
        "Payment received date is required when payment status is Paid."
      );
    }

    const requiresCancellationReason =
      nextStatus === "cancelled" ||
      effectivePaymentStatus === "refunded" ||
      effectivePaymentStatus ===
        "partially-refunded";

    if (
      requiresCancellationReason &&
      !String(
        effectiveCancellationReason || ""
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
      const bookingTimestamp = new Date(
        effectiveCourierBookingDate
      ).getTime();

      const deliveryTimestamp = new Date(
        effectiveEstimatedDelivery
      ).getTime();

      if (
        Number.isFinite(bookingTimestamp) &&
        Number.isFinite(deliveryTimestamp) &&
        deliveryTimestamp < bookingTimestamp
      ) {
        return createValidationResponse(
          "Estimated delivery cannot be before the courier booking date."
        );
      }
    }

    const fieldsToSet = {};

    for (const [field, value] of Object.entries(
      normalizedUpdates
    )) {
      if (
        !valuesAreEqual(
          existingOrder[field],
          value
        )
      ) {
        fieldsToSet[field] = value;
        changedFields.push(field);
      }
    }

    if (statusChanged) {
      const automaticTimestampField =
        getAutomaticStatusTimestamp(nextStatus);

      if (automaticTimestampField) {
        fieldsToSet[automaticTimestampField] =
          changedAt;

        if (
          !changedFields.includes(
            automaticTimestampField
          )
        ) {
          changedFields.push(
            automaticTimestampField
          );
        }
      }
    }

    if (
      hasOwn(normalizedUpdates, "paymentStatus") &&
      normalizedUpdates.paymentStatus === "paid" &&
      !existingOrder.paidAt
    ) {
      fieldsToSet.paidAt =
        normalizedUpdates.paymentReceivedAt ||
        existingOrder.paymentReceivedAt ||
        changedAt;

      changedFields.push("paidAt");
    }

    if (
      hasOwn(normalizedUpdates, "paymentStatus") &&
      ["refunded", "partially-refunded"].includes(
        normalizedUpdates.paymentStatus
      )
    ) {
      fieldsToSet.refundUpdatedAt = changedAt;
      changedFields.push("refundUpdatedAt");
    }

    if (changedFields.length === 0) {
      return Response.json({
        success: true,
        message: "No order changes were required.",
        changed: false,
        status: previousStatus,
        order: existingOrder,
      });
    }

    fieldsToSet.updatedAt = changedAt;
    fieldsToSet.lastUpdatedBy = "admin";

    const updateOperation = {
      $set: fieldsToSet,
    };

    const activityHistoryEntry = {
      type: "order-management-update",
      changedFields,
      changedAt,
      actor: "admin",
    };

    updateOperation.$push = {
      activityHistory: activityHistoryEntry,
    };

    if (statusChanged) {
      updateOperation.$push.statusHistory = {
        from: previousStatus,
        to: nextStatus,
        status: nextStatus,
        note: statusNote,
        changedAt,
        actor: "admin",
      };
    }

    const updateFilter = {
      _id: existingOrder._id,
      orderId,
    };

    if (existingOrder.updatedAt) {
      updateFilter.updatedAt =
        existingOrder.updatedAt;
    }

    const result =
      await ordersCollection.updateOne(
        updateFilter,
        updateOperation
      );

    if (result.matchedCount === 0) {
      return Response.json(
        {
          success: false,
          message:
            "This order was updated by another request. Refresh the page and try again.",
        },
        {
          status: 409,
        }
      );
    }

    const updatedOrder =
      await ordersCollection.findOne({
        _id: existingOrder._id,
      });

    return Response.json({
      success: true,
      message:
        "Order management details updated successfully.",
      changed: true,
      changedFields,
      previousStatus,
      status:
        updatedOrder?.status || nextStatus,
      changedAt,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Order Management Update Error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to update order management details.",
      },
      {
        status: 500,
      }
    );
  }
}