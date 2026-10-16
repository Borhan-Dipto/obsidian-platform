"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const statusConfig = {
  pending: {
    label: "Pending",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  },
  processing: {
    label: "Processing",
    tone: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  packed: {
    label: "Packed",
    tone: "bg-violet-50 text-violet-700 border-violet-200",
  },
  shipped: {
    label: "Shipped",
    tone: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  out_for_delivery: {
    label: "Out for delivery",
    tone: "bg-sky-50 text-sky-700 border-sky-200",
  },
  delivered: {
    label: "Delivered",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Completed",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
  },
  canceled: {
    label: "Cancelled",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
  },
  returned: {
    label: "Returned",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  },
  refunded: {
    label: "Refunded",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  },
};

function formatCurrency(value) {
  return `৳${new Intl.NumberFormat("en-BD").format(
    Number(value) || 0
  )}`;
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPaymentMethod(value) {
  const method = String(value || "")
    .trim()
    .toLowerCase();

  if (method === "cash_on_delivery") {
    return "Cash on delivery";
  }

  return method
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusDetails(status) {
  const normalizedStatus = String(status || "pending")
    .trim()
    .toLowerCase();

  return (
    statusConfig[normalizedStatus] || {
      label: normalizedStatus
        .split("_")
        .filter(Boolean)
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" "),
      tone: "bg-stone-100 text-stone-700 border-stone-200",
    }
  );
}

function OrderSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-black/8 bg-white">
      <div className="animate-pulse p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded-full bg-stone-200" />
            <div className="h-7 w-48 rounded-full bg-stone-200" />
          </div>

          <div className="h-9 w-28 rounded-full bg-stone-200" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-2xl bg-stone-100"
            />
          ))}
        </div>

        <div className="mt-8 h-24 rounded-2xl bg-stone-100" />
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalSpent: 0,
  });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/account/orders",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load orders."
          );
        }

        if (!isMounted) {
          return;
        }

        setOrders(
          Array.isArray(data.orders) ? data.orders : []
        );

        setSummary(
          data.summary || {
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            totalSpent: 0,
          }
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.message ||
            "We could not load your orders right now."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    const activeStatuses = new Set([
      "pending",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
    ]);

    const completedStatuses = new Set([
      "completed",
      "delivered",
    ]);

    const cancelledStatuses = new Set([
      "cancelled",
      "canceled",
      "returned",
      "refunded",
    ]);

    return orders.filter((order) => {
      const status = String(order.status || "")
        .trim()
        .toLowerCase();

      if (filter === "active") {
        return activeStatuses.has(status);
      }

      if (filter === "completed") {
        return completedStatuses.has(status);
      }

      if (filter === "cancelled") {
        return cancelledStatuses.has(status);
      }

      return true;
    });
  }, [filter, orders]);

  const filters = [
    {
      key: "all",
      label: "All orders",
      count: summary.totalOrders,
    },
    {
      key: "active",
      label: "Active",
      count: summary.activeOrders,
    },
    {
      key: "completed",
      label: "Completed",
      count: summary.completedOrders,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: summary.cancelledOrders,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f0e8] text-[#171512]">
      <section className="relative overflow-hidden border-b border-black/8">
        <div className="absolute inset-0">
          <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#d8c8aa]/40 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-6">
            <Link
              href="/account"
              className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-black/55 transition hover:text-black"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/65 transition group-hover:-translate-x-1">
                ←
              </span>
              Account
            </Link>

            <Link
              href="/"
              className="font-serif text-xl tracking-[0.25em] sm:text-2xl"
            >
              OBSIDIAN
            </Link>
          </div>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-black/45">
                Private client archive
              </p>

              <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-8xl">
                Your orders,
                <span className="block italic text-black/55">
                  carefully recorded.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-black/58 sm:text-base">
                Review every piece you have collected,
                follow active deliveries, and revisit the
                details of each OBSIDIAN order.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-black px-6 py-7 text-white shadow-[0_35px_80px_rgba(0,0,0,0.16)] sm:px-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                Lifetime collection value
              </p>

              <div className="mt-4 flex items-end justify-between gap-5">
                <p className="font-serif text-4xl sm:text-5xl">
                  {formatCurrency(summary.totalSpent)}
                </p>

                <span className="rounded-full border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Delivered orders
                </span>
              </div>

              <div className="mt-7 h-px bg-white/10" />

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-medium">
                    {summary.totalOrders}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
                    Total
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-medium">
                    {summary.activeOrders}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
                    Active
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-medium">
                    {summary.completedOrders}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
                    Delivered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="flex flex-col gap-6 border-b border-black/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/40">
              Order history
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
              Your OBSIDIAN archive
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const isActive = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white/55 text-black/50 hover:border-black/30 hover:text-black"
                  }`}
                >
                  {item.label}
                  <span
                    className={`ml-2 ${
                      isActive
                        ? "text-white/50"
                        : "text-black/30"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <OrderSkeleton key={index} />
            ))}

          {!loading && error && (
            <div className="rounded-[30px] border border-rose-200 bg-rose-50 px-6 py-10 text-center sm:px-10">
              <p className="font-serif text-3xl text-rose-950">
                Your archive could not be opened.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-rose-800/70">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-full bg-rose-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:scale-[1.02]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredOrders.length === 0 && (
              <div className="rounded-[30px] border border-black/8 bg-white px-6 py-16 text-center sm:px-10">
                <p className="text-xs uppercase tracking-[0.28em] text-black/35">
                  Nothing here yet
                </p>
                <h3 className="mt-4 font-serif text-4xl">
                  No orders in this collection.
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black/50">
                  Your future OBSIDIAN pieces will appear
                  here once an order is placed.
                </p>

                <Link
                  href="/shop"
                  className="mt-7 inline-flex rounded-full bg-black px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:scale-[1.02]"
                >
                  Explore the collection
                </Link>
              </div>
            )}

          {!loading &&
            !error &&
            filteredOrders.map((order, orderIndex) => {
              const status = getStatusDetails(order.status);
              const items = Array.isArray(order.items)
                ? order.items
                : [];
              const primaryItem = items[0];
              const remainingItemCount = Math.max(
                0,
                items.length - 1
              );

              return (
                <article
                  key={order._id || order.orderId}
                  className="group overflow-hidden rounded-[30px] border border-black/8 bg-white shadow-[0_20px_60px_rgba(38,31,22,0.045)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_85px_rgba(38,31,22,0.09)]"
                  style={{
                    animationDelay: `${orderIndex * 80}ms`,
                  }}
                >
                  <div className="border-b border-black/8 px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/35">
                          Order reference
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <h3 className="font-serif text-2xl sm:text-3xl">
                            {order.orderId}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${status.tone}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-black/35">
                          Placed
                        </p>
                        <p className="mt-2 text-sm font-medium">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="relative h-36 w-full overflow-hidden rounded-[22px] bg-[#eee9df] sm:h-32 sm:w-28 sm:shrink-0">
                          {primaryItem?.image ? (
                            <Image
                              src={primaryItem.image}
                              alt={
                                primaryItem.name ||
                                "Ordered product"
                              }
                              width={448}
                              height={576}
                              sizes="(min-width: 640px) 112px, 100vw"
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="font-serif text-3xl text-black/20">
                                O
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-black/35">
                            {primaryItem?.series ||
                              "OBSIDIAN Collection"}
                          </p>

                          <h4 className="mt-2 truncate font-serif text-2xl">
                            {primaryItem?.name ||
                              "OBSIDIAN Piece"}
                          </h4>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/50">
                            {primaryItem?.color && (
                              <span>
                                Color:{" "}
                                <strong className="font-medium text-black/75">
                                  {primaryItem.color}
                                </strong>
                              </span>
                            )}

                            {primaryItem?.size && (
                              <span>
                                Size:{" "}
                                <strong className="font-medium text-black/75">
                                  {primaryItem.size}
                                </strong>
                              </span>
                            )}

                            <span>
                              Qty:{" "}
                              <strong className="font-medium text-black/75">
                                {primaryItem?.quantity || 1}
                              </strong>
                            </span>
                          </div>

                          {remainingItemCount > 0 && (
                            <p className="mt-4 text-xs font-medium text-black/45">
                              + {remainingItemCount} more{" "}
                              {remainingItemCount === 1
                                ? "item"
                                : "items"}{" "}
                              in this order
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#f6f2ea] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-black/35">
                            Payment
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            {formatPaymentMethod(
                              order.paymentMethod
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f6f2ea] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-black/35">
                            Payment status
                          </p>
                          <p className="mt-2 text-sm font-medium capitalize">
                            {order.paymentStatus || "Unpaid"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f6f2ea] px-4 py-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-black/35">
                            Pieces
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            {items.reduce(
                              (total, item) =>
                                total +
                                (Number(item.quantity) || 0),
                              0
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black/8 bg-[#181613] p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                        Order total
                      </p>

                      <p className="mt-3 font-serif text-4xl">
                        {formatCurrency(
                          order.pricing?.total ?? order.total
                        )}
                      </p>

                      <div className="mt-7 space-y-3 text-sm">
                        <div className="flex items-center justify-between text-white/50">
                          <span>Subtotal</span>
                          <span>
                            {formatCurrency(
                              order.pricing?.subtotal ??
                                order.subtotal
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-white/50">
                          <span>Delivery</span>
                          <span>
                            {formatCurrency(
                              order.pricing?.deliveryCharge ??
                                order.deliveryCharge
                            )}
                          </span>
                        </div>

                        {(order.pricing?.discount ||
                          order.discount) > 0 && (
                          <div className="flex items-center justify-between text-[#d5b77d]">
                            <span>Discount</span>
                            <span>
                              −
                              {formatCurrency(
                                order.pricing?.discount ??
                                  order.discount
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-7 h-px bg-white/10" />

                      <div className="mt-6 flex flex-col gap-3">
                        <Link
                          href={`/track-order?orderId=${encodeURIComponent(
                            order.orderId
                          )}`}
                          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition hover:scale-[1.02]"
                        >
                          Track order
                        </Link>

                        <Link
                          href={`/account/orders/${encodeURIComponent(
                            order.orderId
                          )}`}
                          className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-white/40 hover:text-white"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <section className="border-t border-black/8 bg-[#ebe4d8]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-black/35">
              Need assistance?
            </p>
            <h2 className="mt-3 font-serif text-3xl">
              We are here for every order.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full border border-black/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
            >
              Contact support
            </Link>

            <Link
              href="/shop"
              className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:scale-[1.02]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}