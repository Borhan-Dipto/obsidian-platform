"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order Received",
    description:
      "Your order has been received and is waiting for confirmation.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description:
      "Your order has been confirmed by the OBSIDIAN team.",
  },
  {
    key: "processing",
    label: "Processing",
    description:
      "Your selected pieces are being prepared with care.",
  },
  {
    key: "packed",
    label: "Packed",
    description:
      "Your order has been packed and is ready for dispatch.",
  },
  {
    key: "shipped",
    label: "Shipped",
    description:
      "Your order has left our facility and is on its way.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description:
      "Your order has been successfully delivered.",
  },
];

const STATUS_DETAILS = {
  pending: {
    label: "Order Received",
    description:
      "Your order has been received and is waiting for confirmation.",
    className:
      "border-amber-300/40 bg-amber-200/10 text-amber-100",
  },
  confirmed: {
    label: "Order Confirmed",
    description:
      "Your order has been confirmed by the OBSIDIAN team.",
    className:
      "border-blue-300/40 bg-blue-200/10 text-blue-100",
  },
  processing: {
    label: "In Preparation",
    description:
      "Your selected pieces are being prepared with care.",
    className:
      "border-violet-300/40 bg-violet-200/10 text-violet-100",
  },
  packed: {
    label: "Order Packed",
    description:
      "Your order has been packed and is ready for dispatch.",
    className:
      "border-indigo-300/40 bg-indigo-200/10 text-indigo-100",
  },
  shipped: {
    label: "Order Shipped",
    description:
      "Your order has left our facility and is on its way.",
    className:
      "border-sky-300/40 bg-sky-200/10 text-sky-100",
  },
  delivered: {
    label: "Order Delivered",
    description:
      "Your order has been successfully delivered.",
    className:
      "border-emerald-300/40 bg-emerald-200/10 text-emerald-100",
  },
  cancelled: {
    label: "Order Cancelled",
    description:
      "This order has been cancelled.",
    className:
      "border-rose-300/40 bg-rose-200/10 text-rose-100",
  },
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase();
}

function formatCurrency(value) {
  const amount = Number(value);

  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatDate(value) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLongDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "Time unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPaymentMethod(value) {
  const method = normalizeStatus(value);

  const methods = {
    cash_on_delivery: "Cash on Delivery",
    cod: "Cash on Delivery",
    bkash: "bKash",
    nagad: "Nagad",
    card: "Card Payment",
    bank_transfer: "Bank Transfer",
  };

  if (methods[method]) {
    return methods[method];
  }

  return (
    method
      .split(/[_-]/)
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ") || "Payment Method"
  );
}

function formatPaymentStatus(value) {
  const status = normalizeStatus(value);

  const statuses = {
    unpaid: "Unpaid",
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    "partially-refunded": "Partially Refunded",
  };

  return statuses[status] || "Unpaid";
}

function formatDeliveryArea(value) {
  const area = normalizeStatus(value);

  if (area === "inside_dhaka") {
    return "Inside Dhaka";
  }

  if (area === "outside_dhaka") {
    return "Outside Dhaka";
  }

  return (
    area
      .split(/[_-]/)
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ") || "Delivery Area"
  );
}

function getStatusDetails(value) {
  const status = normalizeStatus(value);

  return (
    STATUS_DETAILS[status] || {
      label:
        status
          .split(/[_-]/)
          .filter(Boolean)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(" ") || "Order Received",
      description:
        "Your order status has been updated.",
      className:
        "border-white/20 bg-white/10 text-white",
    }
  );
}

function getCurrentStatusIndex(value) {
  const status = normalizeStatus(value);

  if (status === "completed") {
    return STATUS_STEPS.findIndex(
      (step) => step.key === "delivered"
    );
  }

  return STATUS_STEPS.findIndex(
    (step) => step.key === status
  );
}

function getStatusTimestamp(order, status) {
  const directDates = {
    pending: order?.createdAt,
    confirmed: order?.confirmedAt,
    processing: order?.processingAt,
    packed: order?.packedAt,
    shipped: order?.shippedAt,
    delivered: order?.deliveredAt,
  };

  if (directDates[status]) {
    return directDates[status];
  }

  const history = Array.isArray(order?.statusHistory)
    ? order.statusHistory
    : [];

  const matchingEntry = history.find(
    (entry) =>
      normalizeStatus(
        entry?.status || entry?.to
      ) === status
  );

  return (
    matchingEntry?.createdAt ||
    matchingEntry?.changedAt ||
    null
  );
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function RefreshIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19 8V4m0 0h-4m4 0-3.1 3.1A7.5 7.5 0 1 0 19.5 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BoxIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m4.5 7.5 7.5 4.2 7.5-4.2M12 11.7v8.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m12 3.5 7.5 4v8.8L12 20.5l-7.5-4.2V7.5l7.5-4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LocationIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function WalletIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.5 6.5h11a2 2 0 0 1 2 2v9h-13a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M16 10.5h4.5v4H16a2 2 0 1 1 0-4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function TruckIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M3.5 6.5h10v10h-10v-10Zm10 3h3.2l3 3.5v3.5h-6.2v-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle
        cx="7"
        cy="17.5"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="17"
        cy="17.5"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#eee7dc]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="animate-pulse">
          <div className="h-10 w-36 rounded-full bg-black/10" />

          <div className="mt-10 rounded-[34px] bg-[#171717] p-8 sm:p-12">
            <div className="h-3 w-32 rounded-full bg-white/10" />
            <div className="mt-6 h-16 max-w-2xl rounded-full bg-white/10" />
            <div className="mt-6 h-4 max-w-xl rounded-full bg-white/10" />
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_390px]">
            <div className="space-y-6">
              <div className="h-96 rounded-[30px] bg-black/10" />
              <div className="h-80 rounded-[30px] bg-black/10" />
            </div>

            <div className="h-[520px] rounded-[30px] bg-black/10" />
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eee7dc] px-5">
      <section className="w-full max-w-xl rounded-[34px] border border-black/10 bg-[#f7f3eb] px-7 py-14 text-center shadow-[0_30px_90px_rgba(35,25,15,0.1)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/40">
          Order unavailable
        </p>

        <h1 className="mt-5 font-serif text-4xl text-[#171717]">
          We could not open this order.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-black/55">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#171717] px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black"
            onClick={onRetry}
            type="button"
          >
            Try Again
            <RefreshIcon className="h-4 w-4" />
          </button>

          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-black hover:bg-black hover:text-white"
            href="/account/orders"
          >
            Back to Orders
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusTimeline({ order }) {
  const currentStatus = normalizeStatus(order?.status);
  const currentIndex = getCurrentStatusIndex(
    currentStatus
  );

  if (currentStatus === "cancelled") {
    return (
      <section className="rounded-[30px] border border-rose-200 bg-rose-50 p-7 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-700/60">
          Order Status
        </p>

        <h2 className="mt-4 font-serif text-3xl text-rose-950">
          Order Cancelled
        </h2>

        <p className="mt-4 text-sm leading-7 text-rose-900/60">
          {order?.cancellationReason ||
            "This order has been cancelled."}
        </p>

        {order?.cancelledAt ? (
          <p className="mt-5 text-xs text-rose-900/45">
            Updated {formatDateTime(order.cancelledAt)}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-black/10 bg-[#f7f3eb] p-6 shadow-[0_20px_60px_rgba(34,26,18,0.05)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
            Delivery Progress
          </p>

          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
            Order Journey
          </h2>
        </div>

        <p className="max-w-sm text-sm leading-6 text-black/45 sm:text-right">
          Follow every important stage of your
          OBSIDIAN order.
        </p>
      </div>

      <div className="mt-9">
        {STATUS_STEPS.map((step, index) => {
          const completed =
            currentIndex >= 0 && index <= currentIndex;

          const current = index === currentIndex;

          const timestamp = getStatusTimestamp(
            order,
            step.key
          );

          const last =
            index === STATUS_STEPS.length - 1;

          return (
            <div
              className="relative grid grid-cols-[34px_1fr] gap-4"
              key={step.key}
            >
              <div className="relative flex justify-center">
                {!last ? (
                  <div
                    className={`absolute left-1/2 top-8 h-[calc(100%-8px)] w-px -translate-x-1/2 ${
                      index < currentIndex
                        ? "bg-[#171717]"
                        : "bg-black/10"
                    }`}
                  />
                ) : null}

                <div
                  className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border ${
                    current
                      ? "border-[#171717] bg-[#171717] text-white shadow-[0_0_0_6px_rgba(23,23,23,0.08)]"
                      : completed
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-black/15 bg-[#f7f3eb] text-black/25"
                  }`}
                >
                  {completed ? (
                    <span className="text-xs">✓</span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>
              </div>

              <div className={last ? "" : "pb-8"}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3
                      className={`font-serif text-xl ${
                        completed
                          ? "text-[#171717]"
                          : "text-black/30"
                      }`}
                    >
                      {step.label}
                    </h3>

                    {current ? (
                      <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">
                        {step.description}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-xs text-black/35">
                    {timestamp
                      ? formatDateTime(timestamp)
                      : completed
                        ? "Completed"
                        : "Upcoming"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AccountOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = useMemo(() => {
    const value = params?.id;

    if (Array.isArray(value)) {
      return normalizeText(value[0]);
    }

    return normalizeText(value);
  }, [params]);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(
    async ({ refresh = false } = {}) => {
      if (!orderId) {
        setError("A valid order ID is required.");
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          `/api/account/orders/${encodeURIComponent(
            orderId
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          router.replace(
            `/account/login?next=${encodeURIComponent(
              `/account/orders/${orderId}`
            )}`
          );
          return;
        }

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "We could not load this order."
          );
        }

        setOrder(data.order || null);
      } catch (requestError) {
        console.error(
          "Customer Order Details Error:",
          requestError
        );

        setError(
          requestError?.message ||
            "We could not load this order."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, router]
  );

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        void loadOrder();
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [loadOrder]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !order) {
    return (
      <ErrorState
        message={
          error ||
          "This order could not be found."
        }
        onRetry={() => loadOrder()}
      />
    );
  }

  const statusDetails = getStatusDetails(
    order.status
  );

  const pricing = order?.pricing || {};

  const subtotal = Number(
    pricing.subtotal ?? order.subtotal ?? 0
  );

  const deliveryCharge = Number(
    pricing.deliveryCharge ??
      order.deliveryCharge ??
      0
  );

  const originalDeliveryCharge = Number(
    pricing.originalDeliveryCharge ??
      order.originalDeliveryCharge ??
      deliveryCharge
  );

  const discount = Number(
    pricing.discount ?? order.discount ?? 0
  );

  const total = Number(
    pricing.total ?? order.total ?? 0
  );

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const itemCount = items.reduce(
    (sum, item) =>
      sum + Math.max(1, Number(item?.quantity || 1)),
    0
  );

  const courier = order?.courier || {};

  const hasCourierInformation = Boolean(
    courier.name ||
      courier.trackingNumber ||
      courier.trackingUrl ||
      courier.bookingDate ||
      courier.estimatedDelivery ||
      courier.deliveryNote
  );

  return (
    <main className="min-h-screen bg-[#eee7dc] text-[#171717]">
      <section className="relative overflow-hidden bg-[#171717] text-[#f7f0e4]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-0 h-[460px] w-[460px] rounded-full bg-[#8d7452]/20 blur-[140px]" />
          <div className="absolute -right-40 -top-40 h-[540px] w-[540px] rounded-full bg-white/[0.06] blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-7 sm:px-8 lg:px-12 lg:pb-20">
          <nav className="flex items-center justify-between gap-4">
            <Link
              className="group inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55 transition hover:text-white"
              href="/account/orders"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition group-hover:border-white/30 group-hover:bg-white/[0.06]">
                <ArrowLeftIcon className="h-4 w-4" />
              </span>

              <span className="hidden sm:inline">
                Order History
              </span>
            </Link>

            <Link
              className="font-serif text-xl tracking-[0.2em] sm:text-2xl"
              href="/"
            >
              OBSIDIAN
            </Link>

            <button
              aria-label="Refresh order details"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/55 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={refreshing}
              onClick={() =>
                loadOrder({ refresh: true })
              }
              type="button"
            >
              <RefreshIcon
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>
          </nav>

          <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c9b18d]">
                Order Dossier
              </p>

              <h1 className="mt-5 break-words font-serif text-[44px] leading-[0.95] tracking-[-0.035em] sm:text-[66px] lg:text-[80px]">
                {order.orderId}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] ${statusDetails.className}`}
                >
                  {statusDetails.label}
                </span>

                <span className="text-xs text-white/40">
                  Placed {formatLongDate(order.createdAt)}
                </span>
              </div>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                {statusDetails.description}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
                Order Total
              </p>

              <p className="mt-4 font-serif text-5xl">
                {formatCurrency(total)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                    Pieces
                  </p>

                  <p className="mt-2 text-xl">
                    {itemCount}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                    Payment
                  </p>

                  <p className="mt-2 text-sm">
                    {formatPaymentStatus(
                      order.paymentStatus
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="space-y-6">
            <StatusTimeline order={order} />

            <section className="rounded-[30px] border border-black/10 bg-[#f7f3eb] p-6 shadow-[0_20px_60px_rgba(34,26,18,0.05)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                    Selected Pieces
                  </p>

                  <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                    Order Items
                  </h2>
                </div>

                <p className="text-sm text-black/45">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "piece"
                    : "pieces"}
                </p>
              </div>

              <div className="mt-7 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-black/15 p-8 text-center">
                    <BoxIcon className="mx-auto h-7 w-7 text-black/25" />

                    <p className="mt-4 text-sm text-black/45">
                      No order items were found.
                    </p>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const quantity = Math.max(
                      1,
                      Number(item?.quantity || 1)
                    );

                    const unitPrice = Number(
                      item?.price || 0
                    );

                    return (
                      <article
                        className="group flex flex-col gap-5 rounded-[24px] border border-black/10 bg-white/35 p-4 sm:flex-row sm:items-center sm:p-5"
                        key={`${item?.id || "item"}-${index}`}
                      >
                        <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-[20px] bg-[#ddd4c6] sm:h-32 sm:w-28">
                          {item?.image ? (
                            <Image
                              alt={
                                item?.name ||
                                "Order item"
                              }
                              className="object-cover transition duration-700 group-hover:scale-[1.04]"
                              fill
                              sizes="(max-width: 640px) 100vw, 112px"
                              src={item.image}
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-black/25">
                              <BoxIcon className="h-7 w-7" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                            {item?.series || "OBSIDIAN"}
                          </p>

                          <h3 className="mt-2 font-serif text-2xl">
                            {item?.name || "Unnamed Piece"}
                          </h3>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/50">
                            {item?.color ? (
                              <span>
                                Color{" "}
                                <strong className="font-medium text-black/75">
                                  {item.color}
                                </strong>
                              </span>
                            ) : null}

                            {item?.size ? (
                              <span>
                                Size{" "}
                                <strong className="font-medium text-black/75">
                                  {item.size}
                                </strong>
                              </span>
                            ) : null}

                            <span>
                              Quantity{" "}
                              <strong className="font-medium text-black/75">
                                {quantity}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 sm:text-right">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
                            Item Total
                          </p>

                          <p className="mt-2 font-serif text-2xl">
                            {formatCurrency(
                              unitPrice * quantity
                            )}
                          </p>

                          <p className="mt-2 text-xs text-black/40">
                            {formatCurrency(unitPrice)} each
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-[30px] border border-black/10 bg-[#f7f3eb] p-6 shadow-[0_20px_60px_rgba(34,26,18,0.05)] sm:p-7">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/50 text-black/60">
                  <LocationIcon className="h-5 w-5" />
                </div>

                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                  Delivery Address
                </p>

                <h2 className="mt-3 font-serif text-2xl">
                  {order?.customer?.fullName ||
                    "Customer"}
                </h2>

                <div className="mt-5 space-y-2 text-sm leading-6 text-black/55">
                  {order?.customer?.phone ? (
                    <p>{order.customer.phone}</p>
                  ) : null}

                  {order?.customer?.email ? (
                    <p className="break-all">
                      {order.customer.email}
                    </p>
                  ) : null}

                  {order?.customer?.address ? (
                    <p>{order.customer.address}</p>
                  ) : null}
                </div>

                {order?.customer?.deliveryArea ? (
                  <span className="mt-5 inline-flex rounded-full border border-black/10 bg-white/45 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-black/50">
                    {formatDeliveryArea(
                      order.customer.deliveryArea
                    )}
                  </span>
                ) : null}
              </section>

              <section className="rounded-[30px] border border-black/10 bg-[#f7f3eb] p-6 shadow-[0_20px_60px_rgba(34,26,18,0.05)] sm:p-7">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/50 text-black/60">
                  <WalletIcon className="h-5 w-5" />
                </div>

                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                  Payment Details
                </p>

                <h2 className="mt-3 font-serif text-2xl">
                  {formatPaymentMethod(
                    order.paymentMethod
                  )}
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-black/45">
                      Payment Status
                    </span>

                    <span className="font-medium text-black/75">
                      {formatPaymentStatus(
                        order.paymentStatus
                      )}
                    </span>
                  </div>

                  {order?.transactionId ? (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-black/45">
                        Transaction ID
                      </span>

                      <span className="break-all text-right font-medium text-black/75">
                        {order.transactionId}
                      </span>
                    </div>
                  ) : null}

                  {order?.paymentReceivedAt ? (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-black/45">
                        Received
                      </span>

                      <span className="text-right font-medium text-black/75">
                        {formatDate(
                          order.paymentReceivedAt
                        )}
                      </span>
                    </div>
                  ) : null}

                  {order?.coupon?.code ? (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-black/45">
                        Coupon
                      </span>

                      <span className="font-medium text-black/75">
                        {order.coupon.code}
                      </span>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            {order?.customer?.note ? (
              <section className="rounded-[30px] border border-black/10 bg-[#e7ddcd] p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                  Customer Note
                </p>

                <p className="mt-4 text-sm leading-7 text-black/60">
                  {order.customer.note}
                </p>
              </section>
            ) : null}

            {hasCourierInformation ? (
              <section className="rounded-[30px] bg-[#171717] p-6 text-[#f7f0e4] shadow-[0_24px_70px_rgba(0,0,0,0.14)] sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#c9b18d]">
                      Courier Information
                    </p>

                    <h2 className="mt-3 font-serif text-3xl">
                      Delivery Details
                    </h2>
                  </div>

                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-[#c9b18d]">
                    <TruckIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {courier.name ? (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                        Courier
                      </p>

                      <p className="mt-2 text-sm">
                        {courier.name}
                      </p>
                    </div>
                  ) : null}

                  {courier.trackingNumber ? (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                        Tracking Number
                      </p>

                      <p className="mt-2 break-all text-sm">
                        {courier.trackingNumber}
                      </p>
                    </div>
                  ) : null}

                  {courier.bookingDate ? (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                        Booking Date
                      </p>

                      <p className="mt-2 text-sm">
                        {formatDate(
                          courier.bookingDate
                        )}
                      </p>
                    </div>
                  ) : null}

                  {courier.estimatedDelivery ? (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">
                        Estimated Delivery
                      </p>

                      <p className="mt-2 text-sm">
                        {formatDate(
                          courier.estimatedDelivery
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>

                {courier.deliveryNote ? (
                  <p className="mt-5 text-sm leading-7 text-white/50">
                    {courier.deliveryNote}
                  </p>
                ) : null}

                {courier.trackingUrl ? (
                  <a
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f3eadb] px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#171717] transition hover:bg-white"
                    href={courier.trackingUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open Courier Tracking
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="overflow-hidden rounded-[30px] bg-[#171717] text-[#f7f0e4] shadow-[0_28px_85px_rgba(0,0,0,0.18)]">
              <div className="border-b border-white/10 p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                  Order Summary
                </p>

                <p className="mt-4 font-serif text-4xl">
                  {formatCurrency(total)}
                </p>
              </div>

              <div className="space-y-4 p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/45">
                    Subtotal
                  </span>

                  <span>
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/45">
                    Delivery
                  </span>

                  <span>
                    {formatCurrency(
                      originalDeliveryCharge
                    )}
                  </span>
                </div>

                {discount > 0 ? (
                  <div className="flex items-center justify-between gap-4 text-sm text-[#d4b47c]">
                    <span>Discount</span>

                    <span>
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                ) : null}

                {originalDeliveryCharge !==
                deliveryCharge ? (
                  <div className="flex items-center justify-between gap-4 text-sm text-[#d4b47c]">
                    <span>Delivery Payable</span>

                    <span>
                      {formatCurrency(deliveryCharge)}
                    </span>
                  </div>
                ) : null}

                <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                  <span className="font-serif text-xl">
                    Total
                  </span>

                  <span className="font-serif text-3xl">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-black/10 bg-[#f7f3eb] p-6 shadow-[0_20px_60px_rgba(34,26,18,0.05)] sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                Order Information
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-black/45">
                    Order ID
                  </span>

                  <span className="break-all text-right font-medium text-black/75">
                    {order.orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-black/45">
                    Placed
                  </span>

                  <span className="text-right font-medium text-black/75">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-black/45">
                    Last Updated
                  </span>

                  <span className="text-right font-medium text-black/75">
                    {formatDate(order.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-black/45">
                    Status
                  </span>

                  <span className="text-right font-medium text-black/75">
                    {statusDetails.label}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-black/10 bg-[#e7ddcd] p-6 sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                Need Assistance?
              </p>

              <h2 className="mt-4 font-serif text-3xl">
                Support for this order.
              </h2>

              <p className="mt-4 text-sm leading-7 text-black/50">
                Include your order ID when contacting
                OBSIDIAN support for faster assistance.
              </p>

              <div className="mt-7 flex flex-col gap-3">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black"
                  href={`/track-order?orderId=${encodeURIComponent(
                    order.orderId
                  )}`}
                >
                  Track Order
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-black hover:bg-black hover:text-white"
                  href="/contact"
                >
                  Contact Support
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-14 overflow-hidden rounded-[34px] bg-[#171717] text-[#f7f0e4]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9b18d]">
                Continue Your Collection
              </p>

              <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
                Discover the next piece in your
                OBSIDIAN archive.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">
                Explore refined essentials shaped by
                restraint, precision and lasting
                character.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f3eadb] px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#171717] transition hover:bg-white"
                  href="/shop"
                >
                  Explore Collection
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
                  href="/account/orders"
                >
                  All Orders
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden border-t border-white/10 bg-[#211f1c] p-8 lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(199,170,126,0.18),transparent_58%)]" />

              <div className="relative text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-[#c9b18d]">
                  <BoxIcon className="h-8 w-8" />
                </div>

                <p className="mt-6 font-serif text-2xl">
                  Built under pressure.
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Finished with precision
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}