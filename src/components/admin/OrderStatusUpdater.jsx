"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    description: "Order received and awaiting review.",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    description: "Customer and order details have been confirmed.",
  },
  {
    value: "processing",
    label: "Processing",
    description: "Order is being prepared for fulfilment.",
  },
  {
    value: "packed",
    label: "Packed",
    description: "Products have been packed and are ready to dispatch.",
  },
  {
    value: "shipped",
    label: "Shipped",
    description: "Order has been handed over to the courier.",
  },
  {
    value: "delivered",
    label: "Delivered",
    description: "Order has been delivered to the customer.",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Order has been cancelled and will not be fulfilled.",
  },
];

const ORDER_STATUS_TRANSITIONS = {
  pending: [
    "confirmed",
    "cancelled",
  ],

  confirmed: [
    "processing",
    "cancelled",
  ],

  processing: [
    "packed",
    "cancelled",
  ],

  packed: [
    "shipped",
    "cancelled",
  ],

  shipped: [
    "delivered",
  ],

  delivered: [],
  cancelled: [],
};

const PAYMENT_STATUSES = [
  {
    value: "unpaid",
    label: "Unpaid",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "partially-refunded",
    label: "Partially Refunded",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

const CANCELLATION_REASONS = [
  "Customer requested cancellation",
  "Product unavailable",
  "Payment failed",
  "Invalid or incomplete address",
  "Customer unreachable",
  "Duplicate order",
  "Suspected fraudulent order",
  "Courier or delivery limitation",
  "Other",
];

function normalizeDateInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function SectionHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="border-b border-white/10 pb-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
        {eyebrow}
      </p>

      <h3 className="mt-2 font-heading text-2xl font-light text-[#f1ece4]">
        {title}
      </h3>

      {description ? (
        <p className="mt-3 text-xs leading-6 text-neutral-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FieldLabel({
  children,
  optional = false,
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      <label className="block text-[10px] uppercase tracking-[0.22em] text-neutral-500">
        {children}
      </label>

      {optional ? (
        <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-700">
          Optional
        </span>
      ) : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full resize-y border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-7 text-[#f1ece4] outline-none transition placeholder:text-neutral-700 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function Select({
  value,
  onChange,
  children,
  disabled = false,
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
}

function getInitialForm({
  currentStatus,
  paymentStatus,
  transactionId,
  paymentReceivedAt,
  paymentNote,
  courierName,
  trackingNumber,
  trackingUrl,
  courierBookingDate,
  estimatedDelivery,
  deliveryNote,
  internalNote,
  cancellationReason,
}) {
  return {
    status: currentStatus || "pending",
    statusNote: "",

    paymentStatus: paymentStatus || "unpaid",
    transactionId: normalizeText(transactionId),
    paymentReceivedAt: normalizeDateInput(paymentReceivedAt),
    paymentNote: normalizeText(paymentNote),

    courierName: normalizeText(courierName),
    trackingNumber: normalizeText(trackingNumber),
    trackingUrl: normalizeText(trackingUrl),
    courierBookingDate: normalizeDateInput(courierBookingDate),
    estimatedDelivery: normalizeDateInput(estimatedDelivery),
    deliveryNote: normalizeText(deliveryNote),

    internalNote: normalizeText(internalNote),
    cancellationReason: normalizeText(cancellationReason),
  };
}

export default function OrderStatusUpdater({
  orderId,
  currentStatus = "pending",

  paymentStatus = "unpaid",
  transactionId = "",
  paymentReceivedAt = "",
  paymentNote = "",

  courierName = "",
  trackingNumber = "",
  trackingUrl = "",
  courierBookingDate = "",
  estimatedDelivery = "",
  deliveryNote = "",

  internalNote = "",
  cancellationReason = "",
}) {
  const router = useRouter();

  const initialForm = useMemo(
    () =>
      getInitialForm({
        currentStatus,
        paymentStatus,
        transactionId,
        paymentReceivedAt,
        paymentNote,
        courierName,
        trackingNumber,
        trackingUrl,
        courierBookingDate,
        estimatedDelivery,
        deliveryNote,
        internalNote,
        cancellationReason,
      }),
    [
      currentStatus,
      paymentStatus,
      transactionId,
      paymentReceivedAt,
      paymentNote,
      courierName,
      trackingNumber,
      trackingUrl,
      courierBookingDate,
      estimatedDelivery,
      deliveryNote,
      internalNote,
      cancellationReason,
    ]
  );

  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        setForm(initialForm);
        setSavedForm(initialForm);
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [initialForm]);

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(savedForm);

  const selectedStatus = ORDER_STATUSES.find(
    (item) => item.value === form.status
  );

  const selectableStatuses = useMemo(
    () => {
      const currentStatus =
        savedForm.status ||
        "pending";

      const allowedStatuses =
        new Set([
          currentStatus,

          ...(
            ORDER_STATUS_TRANSITIONS[
              currentStatus
            ] || []
          ),
        ]);

      return ORDER_STATUSES.filter(
        (item) =>
          allowedStatuses.has(
            item.value
          )
      );
    },
    [savedForm.status]
  );

  const requiresCancellationReason =
    form.status === "cancelled" ||
    form.paymentStatus === "refunded" ||
    form.paymentStatus === "partially-refunded";

  const shouldShowShipmentWarning =
    ["shipped", "delivered"].includes(form.status) &&
    (!form.courierName.trim() ||
      !form.trackingNumber.trim());

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setMessage(null);
  }

  function validateForm() {
    if (!orderId) {
      return "Order ID is missing.";
    }

    if (!form.status) {
      return "Please select an order status.";
    }

    if (
      !selectableStatuses.some(
        (item) =>
          item.value ===
          form.status
      )
    ) {
      return `Order status cannot move from ${savedForm.status} to ${form.status}.`;
    }

    if (
      requiresCancellationReason &&
      !form.cancellationReason.trim()
    ) {
      return "A cancellation or refund reason is required.";
    }

    if (
      form.paymentStatus === "paid" &&
      !form.paymentReceivedAt
    ) {
      return "Please enter the payment received date.";
    }

    if (
      form.trackingUrl.trim() &&
      !/^https?:\/\//i.test(form.trackingUrl.trim())
    ) {
      return "Tracking URL must start with http:// or https://.";
    }

    if (
      form.courierBookingDate &&
      form.estimatedDelivery
    ) {
      const bookingDate = new Date(
        form.courierBookingDate
      ).getTime();

      const estimatedDate = new Date(
        form.estimatedDelivery
      ).getTime();

      if (
        Number.isFinite(bookingDate) &&
        Number.isFinite(estimatedDate) &&
        estimatedDate < bookingDate
      ) {
        return "Estimated delivery cannot be before the courier booking date.";
      }
    }

    return null;
  }

  async function saveOrderManagement(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    if (!hasChanges) {
      setMessage({
        type: "info",
        text: "No changes to save.",
      });

      return;
    }

    if (
      form.status === "cancelled" &&
      savedForm.status !== "cancelled"
    ) {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this order? Reserved stock and coupon usage will be restored exactly once, and the cancellation will be recorded in the order history."
      );

      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: form.status,
            statusNote: form.statusNote.trim(),

            paymentStatus: form.paymentStatus,
            transactionId: form.transactionId.trim(),
            paymentReceivedAt:
              form.paymentReceivedAt || null,
            paymentNote: form.paymentNote.trim(),

            courierName: form.courierName.trim(),
            trackingNumber:
              form.trackingNumber.trim(),
            trackingUrl: form.trackingUrl.trim(),
            courierBookingDate:
              form.courierBookingDate || null,
            estimatedDelivery:
              form.estimatedDelivery || null,
            deliveryNote: form.deliveryNote.trim(),

            internalNote: form.internalNote.trim(),
            cancellationReason:
              form.cancellationReason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to update the order."
        );
      }

      const nextSavedForm = {
        ...form,
        statusNote: "",
      };

      setForm(nextSavedForm);
      setSavedForm(nextSavedForm);

      setMessage({
        type: "success",
        text: "Order management details saved successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Order update error:", error);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Something went wrong while saving the order.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function resetChanges() {
    setForm(savedForm);
    setMessage(null);
  }

  return (
    <form
      onSubmit={saveOrderManagement}
      className="space-y-8"
    >
      <section className="space-y-5">
        <SectionHeader
          eyebrow="Order Workflow"
          title="Status Management"
          description="Move the order through the complete fulfilment workflow and record an optional note for the timeline."
        />

        <div>
          <FieldLabel>Order Status</FieldLabel>

          <Select
            value={form.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value
              )
            }
            disabled={isSaving}
          >
            {selectableStatuses.map((item) => (
              <option
                key={item.value}
                value={item.value}
                className="bg-[#0b0b0b]"
              >
                {item.label}
              </option>
            ))}
          </Select>

          <p className="mt-3 text-xs leading-6 text-neutral-600">
            {selectedStatus?.description}
          </p>
        </div>

        <div>
          <FieldLabel optional>
            Status Change Note
          </FieldLabel>

          <Textarea
            value={form.statusNote}
            onChange={(event) =>
              updateField(
                "statusNote",
                event.target.value
              )
            }
            placeholder="Example: Customer confirmed by phone, order packed after quality inspection..."
            rows={3}
            disabled={isSaving}
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-white/10 pt-8">
        <SectionHeader
          eyebrow="Transaction"
          title="Payment Management"
          description="Maintain the official payment record used by the admin dashboard, invoice and financial reporting."
        />

        <div>
          <FieldLabel>Payment Status</FieldLabel>

          <Select
            value={form.paymentStatus}
            onChange={(event) =>
              updateField(
                "paymentStatus",
                event.target.value
              )
            }
            disabled={isSaving}
          >
            {PAYMENT_STATUSES.map((item) => (
              <option
                key={item.value}
                value={item.value}
                className="bg-[#0b0b0b]"
              >
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel optional>
            Transaction ID
          </FieldLabel>

          <Input
            value={form.transactionId}
            onChange={(event) =>
              updateField(
                "transactionId",
                event.target.value
              )
            }
            placeholder="Enter payment transaction or reference ID"
            disabled={isSaving}
          />
        </div>

        <div>
          <FieldLabel
            optional={form.paymentStatus !== "paid"}
          >
            Payment Received Date
          </FieldLabel>

          <Input
            type="datetime-local"
            value={form.paymentReceivedAt}
            onChange={(event) =>
              updateField(
                "paymentReceivedAt",
                event.target.value
              )
            }
            disabled={isSaving}
          />
        </div>

        <div>
          <FieldLabel optional>
            Payment Note
          </FieldLabel>

          <Textarea
            value={form.paymentNote}
            onChange={(event) =>
              updateField(
                "paymentNote",
                event.target.value
              )
            }
            placeholder="Record payment confirmation, refund details or other transaction information..."
            rows={3}
            disabled={isSaving}
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-white/10 pt-8">
        <SectionHeader
          eyebrow="Fulfilment"
          title="Courier & Shipment"
          description="Store the courier information shown in the admin copy and customer tracking experience."
        />

        {shouldShowShipmentWarning ? (
          <div className="border border-yellow-400/20 bg-yellow-400/[0.06] px-4 py-3 text-xs leading-6 text-yellow-200/80">
            This order is marked as{" "}
            <strong className="font-medium">
              {form.status}
            </strong>
            , but courier name or tracking number is
            still missing.
          </div>
        ) : null}

        <div>
          <FieldLabel optional>
            Courier Name
          </FieldLabel>

          <Input
            value={form.courierName}
            onChange={(event) =>
              updateField(
                "courierName",
                event.target.value
              )
            }
            placeholder="Example: Pathao Courier, RedX, Steadfast"
            disabled={isSaving}
          />
        </div>

        <div>
          <FieldLabel optional>
            Tracking / Consignment Number
          </FieldLabel>

          <Input
            value={form.trackingNumber}
            onChange={(event) =>
              updateField(
                "trackingNumber",
                event.target.value
              )
            }
            placeholder="Enter the courier tracking number"
            disabled={isSaving}
          />
        </div>

        <div>
          <FieldLabel optional>
            Tracking URL
          </FieldLabel>

          <Input
            type="url"
            value={form.trackingUrl}
            onChange={(event) =>
              updateField(
                "trackingUrl",
                event.target.value
              )
            }
            placeholder="https://courier.example/track/..."
            disabled={isSaving}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel optional>
              Courier Booking Date
            </FieldLabel>

            <Input
              type="datetime-local"
              value={form.courierBookingDate}
              onChange={(event) =>
                updateField(
                  "courierBookingDate",
                  event.target.value
                )
              }
              disabled={isSaving}
            />
          </div>

          <div>
            <FieldLabel optional>
              Estimated Delivery
            </FieldLabel>

            <Input
              type="datetime-local"
              value={form.estimatedDelivery}
              onChange={(event) =>
                updateField(
                  "estimatedDelivery",
                  event.target.value
                )
              }
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <FieldLabel optional>
            Delivery Note
          </FieldLabel>

          <Textarea
            value={form.deliveryNote}
            onChange={(event) =>
              updateField(
                "deliveryNote",
                event.target.value
              )
            }
            placeholder="Courier instructions, delivery exceptions or fulfilment notes..."
            rows={3}
            disabled={isSaving}
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-white/10 pt-8">
        <SectionHeader
          eyebrow="Internal Record"
          title="Private Admin Notes"
          description="These notes are private and must never appear in customer-facing invoices or tracking pages."
        />

        <div>
          <FieldLabel optional>
            Internal Note
          </FieldLabel>

          <Textarea
            value={form.internalNote}
            onChange={(event) =>
              updateField(
                "internalNote",
                event.target.value
              )
            }
            placeholder="Example: Customer confirmed by phone, special packaging requested, address verified..."
            rows={4}
            disabled={isSaving}
          />
        </div>

        <div>
          <FieldLabel
            optional={!requiresCancellationReason}
          >
            Cancellation / Refund Reason
          </FieldLabel>

          <Select
            value={
              CANCELLATION_REASONS.includes(
                form.cancellationReason
              )
                ? form.cancellationReason
                : form.cancellationReason
                  ? "Other"
                  : ""
            }
            onChange={(event) => {
              const nextValue = event.target.value;

              updateField(
                "cancellationReason",
                nextValue === "Other"
                  ? ""
                  : nextValue
              );
            }}
            disabled={isSaving}
          >
            <option value="">
              Select a reason
            </option>

            {CANCELLATION_REASONS.map(
              (reason) => (
                <option
                  key={reason}
                  value={reason}
                  className="bg-[#0b0b0b]"
                >
                  {reason}
                </option>
              )
            )}
          </Select>

          {requiresCancellationReason ||
          (form.cancellationReason &&
            !CANCELLATION_REASONS.includes(
              form.cancellationReason
            )) ? (
            <div className="mt-3">
              <Textarea
                value={form.cancellationReason}
                onChange={(event) =>
                  updateField(
                    "cancellationReason",
                    event.target.value
                  )
                }
                placeholder="Provide the complete cancellation or refund reason..."
                rows={3}
                disabled={isSaving}
              />
            </div>
          ) : null}
        </div>
      </section>

      {message ? (
        <div
          role="status"
          className={`border px-4 py-3 text-xs leading-6 ${
            message.type === "success"
              ? "border-green-400/20 bg-green-400/[0.06] text-green-200"
              : message.type === "error"
                ? "border-red-400/20 bg-red-400/[0.06] text-red-200"
                : "border-blue-400/20 bg-blue-400/[0.06] text-blue-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 border border-white/10 bg-[#111111]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-neutral-400">
              {hasChanges
                ? "You have unsaved order changes."
                : "All order management details are saved."}
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-700">
              Order {orderId}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetChanges}
              disabled={!hasChanges || isSaving}
              className="border border-white/15 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="border border-[#f1ece4] bg-[#f1ece4] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-[#0b0b0b] transition hover:bg-transparent hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving
                ? "Saving..."
                : "Save Order"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}