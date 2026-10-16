"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const LAST_ORDER_KEY =
  "obsidian-last-order";

function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  );
}

function getCurrencySymbol(currency) {
  return currency === "BDT"
    ? "৳"
    : currency || "৳";
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value) {
  const normalizedValue = String(
    value || ""
  )
    .trim()
    .replace(/[_-]+/g, " ");

  if (!normalizedValue) {
    return "Not available";
  }

  return normalizedValue.replace(
    /\b\w/g,
    (character) =>
      character.toUpperCase()
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeFileName(value) {
  return String(value || "receipt")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function getLineTotal(item) {
  return Number(
    item?.lineTotal ??
      Number(item?.price || 0) *
        Number(item?.quantity || 0)
  );
}

function createReceiptHtml({
  storeName,
  order,
  orderNumber,
  pricing,
  currencySymbol,
  receiptDate,
}) {
  const customer = order?.customer || {};

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const itemRows = items
    .map((item) => {
      const details = [
        item?.series,
        item?.color,
        item?.size
          ? `Size ${item.size}`
          : "",
      ]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" · ");

      return `
        <tr>
          <td>
            <strong>${escapeHtml(
              item?.name || "Product"
            )}</strong>
            ${
              details
                ? `<div class="muted">${details}</div>`
                : ""
            }
          </td>

          <td class="center">
            ${escapeHtml(
              item?.quantity || 1
            )}
          </td>

          <td class="right">
            ${escapeHtml(
              currencySymbol
            )} ${escapeHtml(
              formatMoney(item?.price)
            )}
          </td>

          <td class="right">
            ${escapeHtml(
              currencySymbol
            )} ${escapeHtml(
              formatMoney(
                getLineTotal(item)
              )
            )}
          </td>
        </tr>
      `;
    })
    .join("");

  const totalDiscount = Number(
    pricing?.totalDiscount ??
      pricing?.discount ??
      order?.discount ??
      0
  );

  const deliveryCharge = Number(
    pricing?.payableDeliveryCharge ??
      pricing?.deliveryCharge ??
      order?.deliveryCharge ??
      0
  );

  const couponCode = String(
    order?.coupon?.code || ""
  ).trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>${escapeHtml(
    storeName
  )} Receipt ${escapeHtml(
    orderNumber
  )}</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f3f0ea;
      color: #111111;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    .receipt {
      width: min(860px, calc(100% - 32px));
      margin: 32px auto;
      background: #ffffff;
      border: 1px solid #d9d4cb;
      padding: 42px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      padding-bottom: 28px;
      border-bottom: 1px solid #dedbd5;
    }

    .brand {
      margin: 0;
      font-family: Georgia, serif;
      font-size: 40px;
      font-weight: 400;
      letter-spacing: 0.08em;
    }

    .eyebrow {
      margin: 0 0 10px;
      color: #666666;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24em;
    }

    .right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      padding: 28px 0;
      border-bottom: 1px solid #dedbd5;
    }

    .details p {
      margin: 7px 0 0;
      line-height: 1.6;
    }

    .muted {
      margin-top: 7px;
      color: #666666;
      font-size: 12px;
      line-height: 1.6;
    }

    table {
      width: 100%;
      margin-top: 28px;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 15px 10px;
      border-bottom: 1px solid #e6e2dc;
      vertical-align: top;
    }

    th {
      color: #666666;
      font-size: 10px;
      font-weight: 600;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }

    .summary {
      width: min(360px, 100%);
      margin: 30px 0 0 auto;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 8px 0;
    }

    .summary-total {
      margin-top: 10px;
      padding-top: 17px;
      border-top: 1px solid #111111;
      font-family: Georgia, serif;
      font-size: 24px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #dedbd5;
      color: #666666;
      font-size: 12px;
      line-height: 1.7;
      text-align: center;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .receipt {
        width: 100%;
        margin: 0;
        border: 0;
        padding: 20px;
      }
    }

    @media (max-width: 640px) {
      .receipt {
        padding: 24px;
      }

      .header,
      .details {
        display: block;
      }

      .header > div + div,
      .details > div + div {
        margin-top: 24px;
      }

      .header .right {
        text-align: left;
      }

      th:nth-child(3),
      td:nth-child(3) {
        display: none;
      }
    }
  </style>
</head>

<body>
  <main class="receipt">
    <header class="header">
      <div>
        <p class="eyebrow">
          Official Order Receipt
        </p>

        <h1 class="brand">
          ${escapeHtml(storeName)}
        </h1>
      </div>

      <div class="right">
        <p class="eyebrow">
          Order ID
        </p>

        <strong>
          ${escapeHtml(orderNumber)}
        </strong>

        <p class="muted">
          ${escapeHtml(receiptDate)}
        </p>
      </div>
    </header>

    <section class="details">
      <div>
        <p class="eyebrow">
          Customer
        </p>

        <p>
          <strong>
            ${escapeHtml(
              customer?.fullName ||
                "Customer"
            )}
          </strong>
        </p>

        <p>
          ${escapeHtml(
            customer?.phone ||
              "Phone not provided"
          )}
        </p>

        ${
          customer?.email
            ? `<p>${escapeHtml(
                customer.email
              )}</p>`
            : ""
        }

        <p>
          ${escapeHtml(
            customer?.address ||
              "Address not available"
          )}
        </p>
      </div>

      <div>
        <p class="eyebrow">
          Order Information
        </p>

        <p>
          Status:
          <strong>
            ${escapeHtml(
              formatLabel(order?.status)
            )}
          </strong>
        </p>

        <p>
          Payment:
          <strong>
            ${escapeHtml(
              order?.paymentMethodLabel ||
                formatLabel(
                  order?.paymentMethod
                )
            )}
          </strong>
        </p>

        ${
          couponCode
            ? `<p>
                Coupon:
                <strong>
                  ${escapeHtml(
                    couponCode
                  )}
                </strong>
              </p>`
            : ""
        }
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th class="center">Qty</th>
          <th class="right">Price</th>
          <th class="right">Total</th>
        </tr>
      </thead>

      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <section class="summary">
      <div class="summary-row">
        <span>Subtotal</span>

        <span>
          ${escapeHtml(
            currencySymbol
          )} ${escapeHtml(
            formatMoney(
              pricing?.subtotal
            )
          )}
        </span>
      </div>

      <div class="summary-row">
        <span>Delivery</span>

        <span>
          ${escapeHtml(
            currencySymbol
          )} ${escapeHtml(
            formatMoney(
              deliveryCharge
            )
          )}
        </span>
      </div>

      ${
        totalDiscount > 0
          ? `<div class="summary-row">
              <span>Discount</span>

              <span>
                -${escapeHtml(
                  currencySymbol
                )} ${escapeHtml(
                  formatMoney(
                    totalDiscount
                  )
                )}
              </span>
            </div>`
          : ""
      }

      <div class="summary-row summary-total">
        <span>Total</span>

        <strong>
          ${escapeHtml(
            currencySymbol
          )} ${escapeHtml(
            formatMoney(
              pricing?.total
            )
          )}
        </strong>
      </div>
    </section>

    <footer class="footer">
      Thank you for choosing
      ${escapeHtml(storeName)}.

      <br />

      This receipt confirms that your order
      was received successfully.
    </footer>
  </main>
</body>
</html>`;
}

function PrintableReceipt({
  storeName,
  order,
  orderNumber,
  pricing,
  currencySymbol,
  receiptDate,
}) {
  const customer = order?.customer || {};

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const deliveryCharge = Number(
    pricing?.payableDeliveryCharge ??
      pricing?.deliveryCharge ??
      order?.deliveryCharge ??
      0
  );

  const totalDiscount = Number(
    pricing?.totalDiscount ??
      pricing?.discount ??
      order?.discount ??
      0
  );

  return (
    <section className="hidden bg-white p-8 text-black print:block">
      <div className="mx-auto max-w-[900px]">
        <header className="flex items-start justify-between gap-8 border-b border-black/15 pb-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
              Official Order Receipt
            </p>

            <h1 className="mt-3 font-heading text-5xl font-light tracking-[0.08em]">
              {storeName}
            </h1>
          </div>

          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Order ID
            </p>

            <p className="mt-3 font-semibold uppercase tracking-[0.08em]">
              {orderNumber}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              {receiptDate}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-10 border-b border-black/15 py-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Customer
            </p>

            <p className="mt-3 font-semibold">
              {customer.fullName ||
                "Customer"}
            </p>

            <p className="mt-2 text-sm">
              {customer.phone ||
                "Phone not provided"}
            </p>

            {customer.email ? (
              <p className="mt-1 text-sm">
                {customer.email}
              </p>
            ) : null}

            <p className="mt-1 max-w-sm text-sm leading-6">
              {customer.address ||
                "Address not available"}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Order Information
            </p>

            <p className="mt-3 text-sm">
              Status:{" "}
              <strong>
                {formatLabel(order?.status)}
              </strong>
            </p>

            <p className="mt-2 text-sm">
              Payment:{" "}
              <strong>
                {order?.paymentMethodLabel ||
                  formatLabel(
                    order?.paymentMethod
                  )}
              </strong>
            </p>

            {order?.coupon?.code ? (
              <p className="mt-2 text-sm">
                Coupon:{" "}
                <strong>
                  {order.coupon.code}
                </strong>
              </p>
            ) : null}
          </div>
        </div>

        <table className="mt-7 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              <th className="py-4">
                Product
              </th>

              <th className="py-4 text-center">
                Qty
              </th>

              <th className="py-4 text-right">
                Price
              </th>

              <th className="py-4 text-right">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr
                key={`${item.id}-${item.size}-${index}`}
                className="border-b border-black/10"
              >
                <td className="py-4">
                  <p className="font-semibold">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {[
                      item.series,
                      item.color,
                      item.size
                        ? `Size ${item.size}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </td>

                <td className="py-4 text-center">
                  {item.quantity}
                </td>

                <td className="py-4 text-right">
                  {currencySymbol}{" "}
                  {formatMoney(item.price)}
                </td>

                <td className="py-4 text-right">
                  {currencySymbol}{" "}
                  {formatMoney(
                    getLineTotal(item)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-8 max-w-sm space-y-3 text-sm">
          <div className="flex justify-between gap-6">
            <span>Subtotal</span>

            <span>
              {currencySymbol}{" "}
              {formatMoney(
                pricing.subtotal
              )}
            </span>
          </div>

          <div className="flex justify-between gap-6">
            <span>Delivery</span>

            <span>
              {currencySymbol}{" "}
              {formatMoney(
                deliveryCharge
              )}
            </span>
          </div>

          {totalDiscount > 0 ? (
            <div className="flex justify-between gap-6">
              <span>Discount</span>

              <span>
                -{currencySymbol}{" "}
                {formatMoney(
                  totalDiscount
                )}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between gap-6 border-t border-black pt-4 font-heading text-2xl">
            <span>Total</span>

            <span>
              {currencySymbol}{" "}
              {formatMoney(
                pricing.total
              )}
            </span>
          </div>
        </div>

        <footer className="mt-12 border-t border-black/15 pt-6 text-center text-xs leading-6 text-neutral-500">
          Thank you for choosing {storeName}.
          This receipt confirms that your order
          was received successfully.
        </footer>
      </div>
    </section>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();

  const orderId = String(
    searchParams.get("orderId") || ""
  ).trim();

  const [savedOrder, setSavedOrder] =
    useState(null);

  const [
    receiptMessage,
    setReceiptMessage,
  ] = useState("");

  const [
    isOrderIdCopied,
    setIsOrderIdCopied,
  ] = useState(false);

  const [settings, setSettings] = useState({
    store: {
      name: "OBSIDIAN",
      currency: "BDT",
    },

    contact: {
      whatsappNumber: "",
    },
  });

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        try {
          const savedValue =
            window.sessionStorage.getItem(
              LAST_ORDER_KEY
            );

          if (!savedValue) {
            return;
          }

          const parsedValue =
            JSON.parse(savedValue);

          const storedOrder =
            parsedValue?.order || null;

          if (
            storedOrder &&
            (!orderId ||
              storedOrder.id === orderId ||
              storedOrder.orderId === orderId)
          ) {
            setSavedOrder({
              ...parsedValue,
              order: storedOrder,
            });
          }
        } catch {
          window.sessionStorage.removeItem(
            LAST_ORDER_KEY
          );
        }
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [orderId]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          active &&
          response.ok &&
          data.success &&
          data.settings
        ) {
          setSettings(data.settings);
        }
      } catch {
        // Default values remain available.
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const order = savedOrder?.order || null;

  const pricing = useMemo(
    () =>
      savedOrder?.pricing ||
      order?.pricing ||
      {},
    [
      savedOrder?.pricing,
      order?.pricing,
    ]
  );

  const currency =
    pricing.currency ||
    settings.store?.currency ||
    "BDT";

  const currencySymbol =
    getCurrencySymbol(currency);

  const storeName =
    String(
      settings.store?.name ||
        "OBSIDIAN"
    ).trim() || "OBSIDIAN";

  const rawOrderNumber =
    order?.orderId ||
    order?.id ||
    orderId;

  const orderNumber =
    rawOrderNumber ||
    "Order confirmed";

  const canCopyOrderNumber =
    Boolean(
      String(
        rawOrderNumber || ""
      ).trim()
    );

  const receiptDate = formatDateTime(
    order?.createdAt ||
      savedOrder?.createdAt
  );

  const whatsappNumber = String(
    settings.contact?.whatsappNumber || ""
  ).replace(/\D/g, "");

  const whatsappUrl = useMemo(() => {
    if (!whatsappNumber || !order) {
      return "";
    }

    const items = Array.isArray(
      order.items
    )
      ? order.items
      : [];

    const itemLines = items
      .map((item) => {
        const details = [
          item.name,

          item.size
            ? `Size: ${item.size}`
            : null,

          `Quantity: ${item.quantity}`,

          `Price: ${currencySymbol} ${formatMoney(
            getLineTotal(item)
          )}`,
        ].filter(Boolean);

        return details.join("\n");
      })
      .join("\n\n");

    const customer =
      order.customer || {};

    const message = [
      `Hello ${storeName},`,
      "",
      "I have placed an order through the website.",
      "",
      `Order ID: ${orderNumber}`,
      `Customer: ${
        customer.fullName || ""
      }`,
      `Phone: ${
        customer.phone || ""
      }`,
      `Address: ${
        customer.address || ""
      }`,
      "",
      "Order Items:",
      itemLines,
      "",
      `Subtotal: ${currencySymbol} ${formatMoney(
        pricing.subtotal
      )}`,
      `Delivery: ${currencySymbol} ${formatMoney(
        pricing.payableDeliveryCharge ??
          pricing.deliveryCharge
      )}`,

      Number(
        pricing.totalDiscount
      ) > 0
        ? `Discount: -${currencySymbol} ${formatMoney(
            pricing.totalDiscount
          )}`
        : null,

      `Total: ${currencySymbol} ${formatMoney(
        pricing.total
      )}`,
      "",
      "Please confirm my order.",
    ]
      .filter(
        (line) =>
          line !== null &&
          line !== undefined
      )
      .join("\n");

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;
  }, [
    whatsappNumber,
    order,
    orderNumber,
    pricing,
    currencySymbol,
    storeName,
  ]);

  async function handleCopyOrderId() {
    const trackingId = String(
      rawOrderNumber || ""
    ).trim();

    if (!trackingId) {
      setReceiptMessage(
        "Tracking ID is not available."
      );

      return;
    }

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          trackingId
        );
      } else {
        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value = trackingId;

        textArea.setAttribute(
          "readonly",
          ""
        );

        textArea.style.position =
          "fixed";

        textArea.style.opacity =
          "0";

        document.body.appendChild(
          textArea
        );

        textArea.select();

        const copied =
          document.execCommand(
            "copy"
          );

        document.body.removeChild(
          textArea
        );

        if (!copied) {
          throw new Error(
            "Copy command failed."
          );
        }
      }

      setIsOrderIdCopied(true);
      setReceiptMessage("");

      window.setTimeout(() => {
        setIsOrderIdCopied(false);
      }, 2000);
    } catch {
      setIsOrderIdCopied(false);

      setReceiptMessage(
        "Tracking ID could not be copied. Please copy it manually."
      );
    }
  }

  function handlePrintReceipt() {
    if (!order) {
      setReceiptMessage(
        "Receipt details are not available."
      );

      return;
    }

    setReceiptMessage("");
    window.print();
  }

  function handleDownloadReceipt() {
    if (!order) {
      setReceiptMessage(
        "Receipt details are not available."
      );

      return;
    }

    try {
      const receiptHtml =
        createReceiptHtml({
          storeName,
          order,
          orderNumber,
          pricing,
          currencySymbol,
          receiptDate,
        });

      const receiptBlob = new Blob(
        [receiptHtml],
        {
          type: "text/html;charset=utf-8",
        }
      );

      const receiptUrl =
        URL.createObjectURL(
          receiptBlob
        );

      const downloadLink =
        document.createElement("a");

      downloadLink.href = receiptUrl;

      downloadLink.download = `${sanitizeFileName(
        storeName
      )}-Receipt-${sanitizeFileName(
        orderNumber
      )}.html`;

      document.body.appendChild(
        downloadLink
      );

      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(
          receiptUrl
        );
      }, 1000);

      setReceiptMessage(
        "Receipt downloaded successfully."
      );
    } catch {
      setReceiptMessage(
        "Receipt could not be downloaded."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b] print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="print:hidden">
        <section className="px-5 pb-20 pt-32 sm:px-6 lg:px-10 lg:pb-28 lg:pt-40">
          <div className="mx-auto max-w-[1100px]">
            <div className="border border-black/10 bg-[#eee7dd] p-7 sm:p-10 md:p-14">
              <p className="text-xs uppercase tracking-[0.42em] text-neutral-500">
                Order Received
              </p>

              <h1 className="mt-6 max-w-4xl font-heading text-5xl font-light leading-[0.95] sm:text-6xl md:text-8xl">
                Thank You.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600">
                Your order has been placed
                successfully. Our team will
                review it and contact you for
                confirmation.
              </p>

              <div className="mt-10 border-y border-black/10 py-7">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Tracking ID
                </p>

                <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <p className="select-all break-words font-sans text-xl font-semibold uppercase leading-relaxed tracking-[0.08em] tabular-nums sm:text-2xl md:text-3xl">
                    {orderNumber}
                  </p>

                  {canCopyOrderNumber ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyOrderId()
                      }
                      aria-label={
                        isOrderIdCopied
                          ? "Tracking ID copied"
                          : "Copy Tracking ID"
                      }
                      className="shrink-0 border border-black/20 px-4 py-3 text-[11px] uppercase tracking-[0.24em] transition hover:border-black"
                    >
                      {isOrderIdCopied
                        ? "Copied"
                        : "Copy ID"}
                    </button>
                  ) : null}
                </div>

                {order ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {receiptDate}
                  </p>
                ) : null}
              </div>

              {order ? (
                <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
                  <div>
                    <p className="mb-5 text-xs uppercase tracking-[0.32em] text-neutral-500">
                      Items
                    </p>

                    <div className="space-y-5">
                      {(order.items || []).map(
                        (item, index) => (
                          <div
                            key={`${item.id}-${item.size}-${index}`}
                            className="flex gap-4 border-b border-black/10 pb-5"
                          >
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={
                                  item.name
                                }
                                width={160}
                                height={192}
                                sizes="80px"
                                className="h-24 w-20 shrink-0 object-cover"
                              />
                            ) : (
                              <div className="h-24 w-20 shrink-0 bg-black/5" />
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                                {item.series}
                              </p>

                              <h2 className="mt-2 font-heading text-2xl font-light">
                                {item.name}
                              </h2>

                              <p className="mt-2 text-sm text-neutral-600">
                                {item.size
                                  ? `Size ${item.size} / `
                                  : ""}
                                Qty{" "}
                                {
                                  item.quantity
                                }
                              </p>
                            </div>

                            <p className="shrink-0 text-sm">
                              {currencySymbol}{" "}
                              {formatMoney(
                                getLineTotal(
                                  item
                                )
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <aside className="h-fit border border-black/10 p-6">
                    <p className="mb-5 text-xs uppercase tracking-[0.3em] text-neutral-500">
                      Summary
                    </p>

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between gap-5">
                        <span className="text-neutral-500">
                          Subtotal
                        </span>

                        <span>
                          {currencySymbol}{" "}
                          {formatMoney(
                            pricing.subtotal
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-5">
                        <span className="text-neutral-500">
                          Delivery
                        </span>

                        <span>
                          {currencySymbol}{" "}
                          {formatMoney(
                            pricing
                              .payableDeliveryCharge ??
                              pricing.deliveryCharge
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
                            {
                              currencySymbol
                            }{" "}
                            {formatMoney(
                              pricing.totalDiscount
                            )}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex justify-between gap-5 border-t border-black/10 pt-6">
                      <span className="font-heading text-2xl font-light">
                        Total
                      </span>

                      <span className="font-heading text-2xl font-light">
                        {currencySymbol}{" "}
                        {formatMoney(
                          pricing.total
                        )}
                      </span>
                    </div>
                  </aside>
                </div>
              ) : null}

              {receiptMessage ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-7 border border-black/10 px-5 py-4 text-sm text-neutral-600"
                >
                  {receiptMessage}
                </p>
              ) : null}

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex justify-center bg-black px-7 py-4 text-xs uppercase tracking-[0.28em] text-[#f1ece4] transition hover:opacity-85"
                  >
                    Confirm Via WhatsApp
                  </a>
                ) : null}

                {order ? (
                  <>
                    <button
                      type="button"
                      onClick={
                        handlePrintReceipt
                      }
                      className="inline-flex justify-center border border-black px-7 py-4 text-xs uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
                    >
                      Print Receipt
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleDownloadReceipt
                      }
                      className="inline-flex justify-center border border-black px-7 py-4 text-xs uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
                    >
                      Download Receipt
                    </button>
                  </>
                ) : null}

                <Link
                  href="/track-order"
                  className="inline-flex justify-center border border-black px-7 py-4 text-xs uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
                >
                  Track Order
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex justify-center border border-black/20 px-7 py-4 text-xs uppercase tracking-[0.28em] transition hover:border-black"
                >
                  Continue Shopping
                </Link>
              </div>

              {order ? (
                <p className="mt-5 text-xs leading-6 text-neutral-500">
                  The Print Receipt option also
                  allows customers to save the
                  receipt as a PDF from the
                  browser print window.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {order ? (
        <PrintableReceipt
          storeName={storeName}
          order={order}
          orderNumber={orderNumber}
          pricing={pricing}
          currencySymbol={
            currencySymbol
          }
          receiptDate={receiptDate}
        />
      ) : null}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f1ece4]">
          <Navbar />

          <div className="flex min-h-[70vh] items-center justify-center px-6 pt-28 text-xs uppercase tracking-[0.3em] text-neutral-500">
            Loading order…
          </div>

          <Footer />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}