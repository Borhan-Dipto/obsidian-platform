"use client";

import { useState } from "react";
import Link from "next/link";

function cleanText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleanedValue = value.replace(/\s+/g, " ").trim();

  return cleanedValue || fallback;
}

function formatCurrency(value, symbol, locale) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `${symbol} 0`;
  }

  try {
    return `${symbol} ${new Intl.NumberFormat(locale).format(
      numericValue
    )}`;
  } catch {
    return `${symbol} ${numericValue}`;
  }
}

function getStatusLabel(status, statusLabels) {
  const normalizedStatus = cleanText(status)
    .toLowerCase();

  const labels =
    statusLabels &&
    typeof statusLabels === "object"
      ? statusLabels
      : {};

  return cleanText(
    labels[normalizedStatus],
    cleanText(labels.fallback, "Pending")
  );
}

export default function TrackOrderClient({
  content = {},
}) {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const currencySymbol = cleanText(
    content.currencySymbol,
    "৳"
  );

  const currencyLocale = cleanText(
    content.currencyLocale,
    "en-BD"
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanId = orderId.trim();

    if (!cleanId) {
      setMessage(
        cleanText(
          content.emptyTrackingMessage,
          "Please enter your tracking ID."
        )
      );
      setOrder(null);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setOrder(null);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(cleanId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          cleanText(
            data.message,
            cleanText(
              content.orderNotFoundMessage,
              "Order not found."
            )
          )
        );
        return;
      }

      setOrder(data.order || null);
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

  const orderItems = Array.isArray(order?.items)
    ? order.items
    : [];

  const customerName = cleanText(
    order?.customer?.fullName
  );

  const customerPhone = cleanText(
    order?.customer?.phone
  );

  const customerAddress = cleanText(
    order?.customer?.address
  );

  const hasCustomerInformation = Boolean(
    customerName ||
      customerPhone ||
      customerAddress
  );

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-12 border border-black/10 bg-[#eee7dd] p-7 md:p-10"
      >
        <label
          htmlFor="tracking-id"
          className="mb-3 block text-xs uppercase tracking-[0.32em] text-neutral-500"
        >
          {cleanText(
            content.trackingIdLabel,
            "Tracking ID"
          )}
        </label>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            id="tracking-id"
            type="text"
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value)
            }
            placeholder={cleanText(
              content.trackingIdPlaceholder,
              "Example: OBS-123456789"
            )}
            aria-label={cleanText(
              content.trackingInputAriaLabel,
              "Enter your tracking ID"
            )}
            autoComplete="off"
            className="w-full border border-black/15 bg-[#f1ece4] px-5 py-4 text-base outline-none transition focus:border-black"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? cleanText(
                  content.loadingButtonText,
                  "Checking..."
                )
              : cleanText(
                  content.trackButtonText,
                  "Track"
                )}
          </button>
        </div>

        {message && (
          <p
            role="alert"
            className="mt-5 text-sm leading-7 text-red-700"
          >
            {message}
          </p>
        )}
      </form>

      {order && (
        <div className="mt-10 border border-black/10 bg-[#eee7dd]">
          <div className="border-b border-black/10 p-7 md:p-10">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              {cleanText(
                content.orderStatusLabel,
                "Order Status"
              )}
            </p>

            <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h2 className="font-heading text-5xl font-light">
                  {getStatusLabel(
                    order.status,
                    content.statusLabels
                  )}
                </h2>

                <p className="mt-3 text-sm text-neutral-600">
                  {cleanText(
                    content.trackingIdPrefix,
                    "Tracking ID:"
                  )}{" "}
                  {cleanText(order.orderId, orderId)}
                </p>
              </div>

              <p className="text-sm text-neutral-600">
                {cleanText(
                  content.totalLabel,
                  "Total:"
                )}{" "}
                {formatCurrency(
                  order.total,
                  currencySymbol,
                  currencyLocale
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-black/10 p-7 md:border-b-0 md:border-r md:p-10">
              <p className="mb-5 text-xs uppercase tracking-[0.32em] text-neutral-500">
                {cleanText(
                  content.customerSectionTitle,
                  "Customer"
                )}
              </p>

              {hasCustomerInformation ? (
                <div className="space-y-3 text-sm leading-7 text-neutral-700">
                  {customerName && <p>{customerName}</p>}
                  {customerPhone && (
                    <p>{customerPhone}</p>
                  )}
                  {customerAddress && (
                    <p>{customerAddress}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-7 text-neutral-600">
                  {cleanText(
                    content.customerEmptyMessage,
                    "Customer information is unavailable."
                  )}
                </p>
              )}
            </div>

            <div className="p-7 md:p-10">
              <p className="mb-5 text-xs uppercase tracking-[0.32em] text-neutral-500">
                {cleanText(
                  content.itemsSectionTitle,
                  "Items"
                )}
              </p>

              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item, index) => {
                    const itemName = cleanText(
                      item?.name,
                      "OBSIDIAN Product"
                    );

                    const itemSize = cleanText(
                      item?.size,
                      "-"
                    );

                    const quantity =
                      Number(item?.quantity) > 0
                        ? Number(item.quantity)
                        : 1;

                    const itemTotal =
                      Number(item?.price) * quantity;

                    return (
                      <div
                        key={
                          item?.id
                            ? `${item.id}-${itemSize}-${index}`
                            : `${itemName}-${itemSize}-${index}`
                        }
                        className="flex justify-between gap-5 text-sm"
                      >
                        <span>
                          {itemName} /{" "}
                          {cleanText(
                            content.itemSizeLabel,
                            "Size"
                          )}{" "}
                          {itemSize} × {quantity}
                        </span>

                        <span>
                          {formatCurrency(
                            itemTotal,
                            currencySymbol,
                            currencyLocale
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm leading-7 text-neutral-600">
                  {cleanText(
                    content.itemsEmptyMessage,
                    "No item information is available for this order."
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <Link
          href={cleanText(
            content.backToShopHref,
            "/shop"
          )}
          className="inline-flex border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
        >
          {cleanText(
            content.backToShopText,
            "Back To Shop"
          )}
        </Link>
      </div>
    </>
  );
}