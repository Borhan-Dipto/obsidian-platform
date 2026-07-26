"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const RECENT_ORDERS_KEY =
  "obsidian-recent-orders";

const LAST_ORDER_KEY =
  "obsidian-last-order";

const STATUS_STEPS = [
  {
    value: "pending",
    label: "Order Placed",
    description:
      "Your order has been received.",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    description:
      "Your order has been confirmed.",
  },
  {
    value: "processing",
    label: "Processing",
    description:
      "Your order is being prepared.",
  },
  {
    value: "packed",
    label: "Packed",
    description:
      "Your order is ready for delivery.",
  },
  {
    value: "shipped",
    label: "Shipped",
    description:
      "Your order is on the way.",
  },
  {
    value: "delivered",
    label: "Delivered",
    description:
      "Your order has been delivered.",
  },
];

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return (
    value
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim() || fallback
  );
}

function normalizePhone(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\D/g, "")
    .slice(0, 20);
}

function formatCurrency(
  value,
  symbol,
  locale
) {
  const amount = Number(value || 0);

  try {
    return `${symbol} ${new Intl.NumberFormat(
      locale
    ).format(amount)}`;
  } catch {
    return `${symbol} ${amount}`;
  }
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function getStatusLabel(
  status,
  statusLabels
) {
  const normalizedStatus = cleanText(
    status,
    "pending"
  ).toLowerCase();

  const labels =
    statusLabels &&
    typeof statusLabels === "object"
      ? statusLabels
      : {};

  const fallbackLabels = {
    pending: "Order Placed",
    confirmed: "Confirmed",
    processing: "Processing",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return cleanText(
    labels[normalizedStatus],
    fallbackLabels[normalizedStatus] ||
      "Pending"
  );
}

function getCurrencySymbol(
  currency,
  fallback
) {
  const normalizedCurrency = cleanText(
    currency
  ).toUpperCase();

  if (normalizedCurrency === "BDT") {
    return "৳";
  }

  return normalizedCurrency || fallback;
}

function getRecentOrders() {
  try {
    const savedValue =
      localStorage.getItem(
        RECENT_ORDERS_KEY
      );

    const parsedValue = savedValue
      ? JSON.parse(savedValue)
      : [];

    return Array.isArray(parsedValue)
      ? parsedValue.slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function saveRecentOrder(order) {
  try {
    const orderId = cleanText(
      order?.orderId || order?.id
    ).toUpperCase();

    if (!orderId) {
      return;
    }

    const existingOrders =
      getRecentOrders();

    const pricing = order?.pricing || {};

    const nextOrder = {
      orderId,

      status: cleanText(
        order?.status,
        "pending"
      ).toLowerCase(),

      total:
        Number(
          pricing.total ??
            order?.total ??
            0
        ) || 0,

      currency: cleanText(
        pricing.currency ||
          order?.currency,
        "BDT"
      ),

      createdAt:
        order?.createdAt || null,

      savedAt:
        new Date().toISOString(),
    };

    const nextOrders = [
      nextOrder,

      ...existingOrders.filter(
        (item) =>
          cleanText(
            item?.orderId
          ).toUpperCase() !== orderId
      ),
    ].slice(0, 5);

    localStorage.setItem(
      RECENT_ORDERS_KEY,
      JSON.stringify(nextOrders)
    );
  } catch {
    // Recent-order storage is optional.
  }
}

export default function TrackOrderClient({
  content = {},
}) {
  const [orderId, setOrderId] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [order, setOrder] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [loadingOrderId, setLoadingOrderId] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [recentOrders, setRecentOrders] =
    useState([]);

  const currencySymbol = cleanText(
    content.currencySymbol,
    "৳"
  );

  const currencyLocale = cleanText(
    content.currencyLocale,
    "en-BD"
  );

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        setRecentOrders(
          getRecentOrders()
        );

        try {
          const lastOrderValue =
            window.sessionStorage.getItem(
              LAST_ORDER_KEY
            );

          if (!lastOrderValue) {
            return;
          }

          const parsedValue =
            JSON.parse(lastOrderValue);

          const savedOrder =
            parsedValue?.order ||
            parsedValue;

          const savedOrderId =
            cleanText(
              savedOrder?.orderId ||
                savedOrder?.id
            ).toUpperCase();

          const savedPhone =
            cleanText(
              savedOrder?.customer
                ?.phone
            );

          if (savedOrderId) {
            setOrderId(
              savedOrderId
            );
          }

          if (savedPhone) {
            setPhone(savedPhone);
          }

          if (savedOrderId) {
            saveRecentOrder(
              savedOrder
            );

            setRecentOrders(
              getRecentOrders()
            );
          }
        } catch {
          // Ignore invalid saved order data.
        }
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, []);

  async function sendTrackingRequest({
    trackingId = "",
    phoneNumber = "",
  }) {
    const cleanId = cleanText(
      trackingId
    ).toUpperCase();

    const cleanPhone =
      normalizePhone(phoneNumber);

    const response = await fetch(
      "/api/orders/track",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        cache: "no-store",

        body: JSON.stringify({
          orderId: cleanId,
          phone: cleanPhone,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      data = {
        success: false,
        message:
          "Invalid server response.",
      };
    }

    return {
      response,
      data,
      cleanId,
      cleanPhone,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanId = cleanText(
      orderId
    ).toUpperCase();

    const cleanPhone =
      normalizePhone(phone);

    if (!cleanId) {
      setMessage(
        "Enter your Tracking ID."
      );

      setOrder(null);
      return;
    }

    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 13
    ) {
      setMessage(
        "Enter the phone number used during checkout."
      );

      setOrder(null);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setOrder(null);
    setCopied(false);

    try {
      const {
        response,
        data,
      } = await sendTrackingRequest({
        trackingId: cleanId,
        phoneNumber: cleanPhone,
      });

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        setMessage(
          cleanText(
            data.message,
            "Order not found. Check your Tracking ID and phone number."
          )
        );

        return;
      }

      setOrder(data.order);

      setOrderId(
        cleanText(
          data.order.orderId,
          cleanId
        ).toUpperCase()
      );

      saveRecentOrder(data.order);

      setRecentOrders(
        getRecentOrders()
      );
    } catch {
      setMessage(
        cleanText(
          content.genericErrorMessage,
          "Something went wrong. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetailedOrder(
    trackingId,
    phoneNumber = phone
  ) {
    const cleanId = cleanText(
      trackingId
    ).toUpperCase();

    const cleanPhone =
      normalizePhone(phoneNumber);

    if (!cleanId) {
      return;
    }

    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 13
    ) {
      setMessage(
        "Enter the phone number used during checkout."
      );

      return;
    }

    setLoadingOrderId(cleanId);
    setMessage("");
    setOrder(null);
    setCopied(false);

    try {
      const {
        response,
        data,
      } = await sendTrackingRequest({
        trackingId: cleanId,
        phoneNumber: cleanPhone,
      });

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        setMessage(
          cleanText(
            data.message,
            "Order not found. Check your Tracking ID and phone number."
          )
        );

        return;
      }

      setOrder(data.order);
      setOrderId(cleanId);

      saveRecentOrder(data.order);

      setRecentOrders(
        getRecentOrders()
      );
    } catch {
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoadingOrderId("");
    }
  }

  function handleRecentOrder(
    recentOrder
  ) {
    const recentOrderId = cleanText(
      recentOrder?.orderId
    ).toUpperCase();

    const cleanPhone =
      normalizePhone(phone);

    setOrderId(recentOrderId);

    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 13
    ) {
      setMessage(
        "Enter the phone number used during checkout, then try again."
      );

      setOrder(null);
      return;
    }

    void loadDetailedOrder(
      recentOrderId,
      cleanPhone
    );
  }

  async function handleCopyTrackingId() {
    const trackingId = cleanText(
      order?.orderId ||
        order?.id ||
        orderId
    ).toUpperCase();

    if (!trackingId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        trackingId
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleNewSearch() {
    setOrder(null);
    setMessage("");
    setCopied(false);
  }

  const orderItems = Array.isArray(
    order?.items
  )
    ? order.items
    : [];

  const pricing =
    order?.pricing || {};

  const orderCurrencySymbol =
    getCurrencySymbol(
      pricing.currency,
      currencySymbol
    );

  const normalizedStatus = cleanText(
    order?.status,
    "pending"
  ).toLowerCase();

  const currentStatusIndex =
    STATUS_STEPS.findIndex(
      (step) =>
        step.value === normalizedStatus
    );

  const statusTimeline = useMemo(() => {
    return STATUS_STEPS.map(
      (step, index) => {
        const dateField = {
          pending: "createdAt",
          confirmed: "confirmedAt",
          processing: "processingAt",
          packed: "packedAt",
          shipped: "shippedAt",
          delivered: "deliveredAt",
        }[step.value];

        return {
          ...step,

          completed:
            normalizedStatus !==
              "cancelled" &&
            currentStatusIndex >= index,

          active:
            normalizedStatus ===
            step.value,

          date:
            order?.[dateField] || null,
        };
      }
    );
  }, [
    normalizedStatus,
    currentStatusIndex,
    order,
  ]);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-12 border border-black/10 bg-[#eee7dd] p-6 sm:p-8 md:p-10"
      >
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <label
              htmlFor="tracking-id"
              className="mb-3 block text-xs uppercase tracking-[0.28em] text-neutral-500"
            >
              Tracking ID
            </label>

            <input
              id="tracking-id"
              type="text"
              value={orderId}
              maxLength={120}
              autoComplete="off"
              placeholder="OBS-XXXX-XXXX"
              required
              onChange={(event) =>
                setOrderId(
                  event.target.value.toUpperCase()
                )
              }
              className="w-full border border-black/15 bg-[#f1ece4] px-5 py-4 font-sans text-base font-medium uppercase tracking-[0.08em] outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="tracking-phone"
              className="mb-3 block text-xs uppercase tracking-[0.28em] text-neutral-500"
            >
              Order Phone Number
            </label>

            <input
              id="tracking-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              maxLength={24}
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              required
              onChange={(event) =>
                setPhone(event.target.value)
              }
              className="w-full border border-black/15 bg-[#f1ece4] px-5 py-4 text-base outline-none transition focus:border-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full bg-black px-8 py-5 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? "Checking Order..."
            : "Track My Order"}
        </button>

        <p className="mt-4 text-center text-xs leading-6 text-neutral-500">
          For your privacy, enter both your
          Tracking ID and the phone number used
          during checkout.
        </p>

        {message ? (
          <p
            role="alert"
            className="mt-5 border border-red-700/20 bg-red-50/50 px-5 py-4 text-sm leading-7 text-red-700"
          >
            {message}
          </p>
        ) : null}
      </form>

      {recentOrders.length > 0 &&
      !order ? (
        <section className="mt-8">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-500">
            Recent Orders On This Device
          </p>

          <div className="grid gap-3">
            {recentOrders.map(
              (recentOrder) => (
                <button
                  key={recentOrder.orderId}
                  type="button"
                  disabled={Boolean(
                    loadingOrderId
                  )}
                  onClick={() =>
                    handleRecentOrder(
                      recentOrder
                    )
                  }
                  className="flex flex-col justify-between gap-3 border border-black/10 bg-[#eee7dd] p-5 text-left transition hover:border-black disabled:opacity-60 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-sans text-sm font-semibold uppercase tracking-[0.08em]">
                      {recentOrder.orderId}
                    </p>

                    <p className="mt-2 text-xs text-neutral-500">
                      {getStatusLabel(
                        recentOrder.status,
                        content.statusLabels
                      )}
                    </p>
                  </div>

                  <span className="text-xs uppercase tracking-[0.24em]">
                    {loadingOrderId ===
                    recentOrder.orderId
                      ? "Opening..."
                      : "Track Again"}
                  </span>
                </button>
              )
            )}
          </div>
        </section>
      ) : null}

      {order ? (
        <section className="mt-10 border border-black/10 bg-[#eee7dd]">
          <div className="border-b border-black/10 p-6 sm:p-8 md:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">
                Current Status
              </p>

              <button
                type="button"
                onClick={handleNewSearch}
                className="self-start text-[10px] uppercase tracking-[0.24em] text-neutral-500 transition hover:text-black"
              >
                Track Another Order
              </button>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="font-heading text-5xl font-light sm:text-6xl">
                  {getStatusLabel(
                    order.status,
                    content.statusLabels
                  )}
                </h2>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <p className="select-all break-words font-sans text-sm font-semibold uppercase leading-relaxed tracking-[0.08em]">
                    {order.orderId}
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleCopyTrackingId
                    }
                    className="border border-black/20 px-3 py-2 text-[10px] uppercase tracking-[0.22em] transition hover:border-black"
                  >
                    {copied
                      ? "Copied"
                      : "Copy ID"}
                  </button>
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                  Order Total
                </p>

                <p className="mt-2 font-heading text-3xl font-light">
                  {formatCurrency(
                    pricing.total,
                    orderCurrencySymbol,
                    currencyLocale
                  )}
                </p>
              </div>
            </div>

            {normalizedStatus ===
            "cancelled" ? (
              <div className="mt-7 border border-red-700/20 bg-red-50/50 p-5 text-sm leading-7 text-red-700">
                This order has been
                cancelled.
              </div>
            ) : null}
          </div>

          {normalizedStatus !==
          "cancelled" ? (
            <div className="border-b border-black/10 p-6 sm:p-8 md:p-10">
              <p className="mb-8 text-xs uppercase tracking-[0.3em] text-neutral-500">
                Order Progress
              </p>

              <div>
                {statusTimeline.map(
                  (step, index) => (
                    <div
                      key={step.value}
                      className="relative flex gap-5 pb-8 last:pb-0"
                    >
                      {index <
                      statusTimeline.length -
                        1 ? (
                        <div
                          className={`absolute left-[7px] top-5 h-full w-px ${
                            step.completed
                              ? "bg-black"
                              : "bg-black/15"
                          }`}
                        />
                      ) : null}

                      <div
                        className={`relative z-10 mt-1 h-[15px] w-[15px] shrink-0 rounded-full border ${
                          step.completed
                            ? "border-black bg-black"
                            : "border-black/25 bg-[#eee7dd]"
                        }`}
                      />

                      <div className="-mt-1">
                        <p
                          className={`text-sm font-medium ${
                            step.completed
                              ? "text-black"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.label}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-neutral-500">
                          {step.description}
                        </p>

                        {step.date ? (
                          <p className="mt-2 text-xs text-neutral-400">
                            {formatDate(
                              step.date
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2">
            <div className="border-b border-black/10 p-6 sm:p-8 md:border-b-0 md:border-r md:p-10">
              <p className="mb-5 text-xs uppercase tracking-[0.3em] text-neutral-500">
                Delivery Details
              </p>

              <div className="space-y-3 text-sm leading-7 text-neutral-700">
                {order.customer?.fullName ? (
                  <p>
                    {
                      order.customer
                        .fullName
                    }
                  </p>
                ) : null}

                {order.customer?.phone ? (
                  <p>
                    {
                      order.customer
                        .phone
                    }
                  </p>
                ) : null}

                {order.customer
                  ?.deliveryArea ? (
                  <p>
                    {
                      order.customer
                        .deliveryArea
                    }
                  </p>
                ) : null}

                {order.estimatedDelivery ? (
                  <p className="pt-3">
                    Estimated delivery:{" "}
                    <strong>
                      {formatDate(
                        order.estimatedDelivery
                      )}
                    </strong>
                  </p>
                ) : null}
              </div>

              {order.courier?.name ||
              order.courier
                ?.trackingNumber ? (
                <div className="mt-7 border-t border-black/10 pt-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Courier
                  </p>

                  <p className="mt-3 text-sm">
                    {order.courier.name ||
                      "Delivery Partner"}
                  </p>

                  {order.courier
                    .trackingNumber ? (
                    <p className="mt-2 break-words font-sans text-sm font-semibold tracking-[0.06em]">
                      {
                        order.courier
                          .trackingNumber
                      }
                    </p>
                  ) : null}

                  {order.courier
                    .trackingUrl ? (
                    <a
                      href={
                        order.courier
                          .trackingUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex border border-black px-5 py-3 text-[10px] uppercase tracking-[0.24em] transition hover:bg-black hover:text-[#f1ece4]"
                    >
                      Track With Courier
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              <p className="mb-5 text-xs uppercase tracking-[0.3em] text-neutral-500">
                Order Items
              </p>

              {orderItems.length > 0 ? (
                <div className="space-y-5">
                  {orderItems.map(
                    (item, index) => {
                      const quantity =
                        Number(
                          item.quantity
                        ) || 1;

                      const itemTotal =
                        Number(
                          item.lineTotal
                        ) ||
                        Number(
                          item.price || 0
                        ) *
                          quantity;

                      return (
                        <div
                          key={`${item.id || item.name}-${item.size || "default"}-${index}`}
                          className="flex justify-between gap-5 border-b border-black/10 pb-5 last:border-0"
                        >
                          <div>
                            <p className="font-medium">
                              {item.name ||
                                "OBSIDIAN Product"}
                            </p>

                            <p className="mt-2 text-sm text-neutral-500">
                              {item.size
                                ? `Size ${item.size} / `
                                : ""}
                              Qty {quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm">
                            {formatCurrency(
                              itemTotal,
                              orderCurrencySymbol,
                              currencyLocale
                            )}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Order item information is
                  unavailable.
                </p>
              )}

              <div className="mt-7 space-y-3 border-t border-black/10 pt-6 text-sm">
                <div className="flex justify-between gap-5">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span>
                    {formatCurrency(
                      pricing.subtotal,
                      orderCurrencySymbol,
                      currencyLocale
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-5">
                  <span className="text-neutral-500">
                    Delivery
                  </span>

                  <span>
                    {formatCurrency(
                      pricing.payableDeliveryCharge,
                      orderCurrencySymbol,
                      currencyLocale
                    )}
                  </span>
                </div>

                {Number(
                  pricing.totalDiscount
                ) > 0 ? (
                  <div className="flex justify-between gap-5">
                    <span className="text-neutral-500">
                      Discount
                    </span>

                    <span>
                      -
                      {formatCurrency(
                        pricing.totalDiscount,
                        orderCurrencySymbol,
                        currencyLocale
                      )}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between gap-5 border-t border-black/10 pt-4 font-medium">
                  <span>Total</span>

                  <span>
                    {formatCurrency(
                      pricing.total,
                      orderCurrencySymbol,
                      currencyLocale
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/shop"
          className="inline-flex justify-center border border-black px-8 py-4 text-xs uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
        >
          Back To Shop
        </Link>

        <Link
          href="/contact"
          className="inline-flex justify-center border border-black/20 px-8 py-4 text-xs uppercase tracking-[0.28em] transition hover:border-black"
        >
          Need Help?
        </Link>
      </div>
    </>
  );
}