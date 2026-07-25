import Image from "next/image";
import Link from "next/link";
import clientPromise from "../../../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../../../lib/adminAuth";
import OrderStatusUpdater from "../../../../components/admin/OrderStatusUpdater";

async function getOrder(id) {
  const client = await clientPromise;
  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const order = await db
    .collection("orders")
    .findOne({
      orderId: id,
    });

  if (!order) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(order)
  );
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳ 0";
  }

  return `৳ ${amount.toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(value) {
  if (!value) {
    return "N/A";
  }

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getStatusClass(status) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (normalizedStatus === "pending") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (normalizedStatus === "confirmed") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }

  if (normalizedStatus === "processing") {
    return "border-purple-400/30 bg-purple-400/10 text-purple-300";
  }

  if (normalizedStatus === "packed") {
    return "border-violet-400/30 bg-violet-400/10 text-violet-300";
  }

  if (normalizedStatus === "shipped") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }

  if (normalizedStatus === "delivered") {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  if (normalizedStatus === "cancelled") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/15 bg-white/5 text-neutral-300";
}

function getPaymentStatusClass(status) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (
    normalizedStatus === "paid" ||
    normalizedStatus === "completed" ||
    normalizedStatus === "successful"
  ) {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  if (
    normalizedStatus === "failed" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "refunded"
  ) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (
    normalizedStatus ===
    "partially-refunded"
  ) {
    return "border-orange-400/30 bg-orange-400/10 text-orange-300";
  }

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getItemKey(item, index) {
  return [
    item.id,
    item._id,
    item.productId,
    item.variantId,
    item.slug,
    item.sku,
    item.name,
    item.size,
    item.color,
    index,
  ]
    .filter(Boolean)
    .join("-");
}

function getItemImage(item) {
  const images = Array.isArray(
    item.images
  )
    ? item.images
    : [];

  const firstImage = images[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  if (
    firstImage &&
    typeof firstImage === "object"
  ) {
    return (
      firstImage.url ||
      firstImage.src ||
      firstImage.imageUrl ||
      firstImage.secureUrl ||
      ""
    );
  }

  if (
    typeof item.featuredImage ===
    "string"
  ) {
    return item.featuredImage;
  }

  if (
    item.featuredImage &&
    typeof item.featuredImage ===
      "object"
  ) {
    return (
      item.featuredImage.url ||
      item.featuredImage.src ||
      item.featuredImage.imageUrl ||
      ""
    );
  }

  return (
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    item.thumbnailUrl ||
    item.productImage ||
    item.productImageUrl ||
    ""
  );
}

function getItemVariant(item) {
  return (
    item.variant ||
    item.variantName ||
    item.option ||
    item.style ||
    null
  );
}

function getCouponCode(order) {
  return (
    order.coupon?.code ||
    order.couponCode ||
    order.appliedCoupon?.code ||
    order.discountCode ||
    null
  );
}

function getDiscountAmount(order) {
  const possibleDiscount =
    order.discountAmount ??
    order.discount ??
    order.couponDiscount ??
    order.coupon?.discountAmount ??
    order.appliedCoupon
      ?.discountAmount ??
    0;

  const amount = Number(
    possibleDiscount
  );

  return Number.isFinite(amount)
    ? amount
    : 0;
}

function getPaymentMethod(order) {
  return (
    order.paymentMethod ||
    order.payment?.method ||
    order.paymentMethodName ||
    "Cash on Delivery"
  );
}

function getPaymentStatus(order) {
  const storedStatus =
    order.paymentStatus ||
    order.payment?.status ||
    order.transactionStatus;

  if (storedStatus) {
    return storedStatus;
  }

  const paymentMethod = String(
    getPaymentMethod(order)
  ).toLowerCase();

  if (
    paymentMethod.includes("cash") ||
    paymentMethod.includes("cod") ||
    paymentMethod.includes(
      "delivery"
    )
  ) {
    return "unpaid";
  }

  return "pending";
}

function getTransactionId(order) {
  return (
    order.transactionId ||
    order.payment?.transactionId ||
    order.payment?.reference ||
    ""
  );
}

function getPaymentReceivedAt(order) {
  return (
    order.paymentReceivedAt ||
    order.paidAt ||
    order.payment?.receivedAt ||
    order.payment?.paidAt ||
    ""
  );
}

function getPaymentNote(order) {
  return (
    order.paymentNote ||
    order.payment?.note ||
    order.payment?.adminNote ||
    ""
  );
}

function getCustomerNote(order) {
  return (
    order.customerNote ||
    order.orderNote ||
    order.note ||
    order.notes ||
    order.customer?.note ||
    null
  );
}

function getInternalNote(order) {
  return (
    order.internalNote ||
    order.adminNote ||
    order.internalNotes ||
    order.adminNotes ||
    ""
  );
}

function getDeliveryAddress(order) {
  const customer =
    order.customer || {};

  const shippingAddress =
    order.shippingAddress ||
    order.deliveryAddress ||
    order.shipping?.address ||
    {};

  if (
    typeof shippingAddress ===
      "string" &&
    shippingAddress.trim()
  ) {
    return shippingAddress.trim();
  }

  const parts = [
    customer.address ||
      shippingAddress.address ||
      shippingAddress.addressLine1,

    shippingAddress.addressLine2,

    customer.area ||
      shippingAddress.area,

    customer.city ||
      shippingAddress.city,

    customer.district ||
      shippingAddress.district,

    customer.postalCode ||
      shippingAddress.postalCode ||
      shippingAddress.zipCode,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : "N/A";
}

function getCourierInformation(order) {
  const shipment =
    order.shipment ||
    order.shipping ||
    {};

  return {
    courierName:
      order.courierName ||
      shipment.courierName ||
      shipment.courier ||
      "",

    trackingNumber:
      order.trackingNumber ||
      order.consignmentNumber ||
      shipment.trackingNumber ||
      shipment.consignmentNumber ||
      "",

    trackingUrl:
      order.trackingUrl ||
      shipment.trackingUrl ||
      "",

    bookingDate:
      order.courierBookingDate ||
      shipment.bookingDate ||
      shipment.shippedAt ||
      "",

    estimatedDelivery:
      order.estimatedDelivery ||
      shipment.estimatedDelivery ||
      "",

    deliveryNote:
      order.deliveryNote ||
      shipment.deliveryNote ||
      "",
  };
}

function getCancellationReason(order) {
  return (
    order.cancellationReason ||
    order.cancelReason ||
    order.refundReason ||
    ""
  );
}

function getTimeline(order) {
  const existingHistory =
    Array.isArray(
      order.statusHistory
    )
      ? order.statusHistory
      : [];

  const timeline = existingHistory
    .map((entry, index) => ({
      id: `${
        entry.changedAt ||
        entry.createdAt ||
        index
      }-${index}`,

      from: entry.from || null,

      status:
        entry.status ||
        entry.to ||
        null,

      changedAt:
        entry.changedAt ||
        entry.createdAt ||
        entry.updatedAt ||
        order.updatedAt ||
        null,

      note:
        entry.note ||
        entry.reason ||
        null,

      changedBy:
        entry.actor ||
        entry.changedBy ||
        entry.updatedBy ||
        entry.adminName ||
        null,
    }))
    .filter(
      (entry) => entry.status
    );

  const initialStatus =
    timeline[0]?.from ||
    "pending";

  const fullTimeline = [
    {
      id: `initial-${
        order.createdAt ||
        order.orderId
      }`,

      from: null,
      status: initialStatus,

      changedAt:
        order.createdAt || null,

      note: null,
      changedBy: null,
      isInitial: true,
    },

    ...timeline,
  ];

  return fullTimeline.sort(
    (
      firstEntry,
      secondEntry
    ) => {
      const firstDate =
        firstEntry.changedAt
          ? new Date(
              firstEntry.changedAt
            ).getTime()
          : 0;

      const secondDate =
        secondEntry.changedAt
          ? new Date(
              secondEntry.changedAt
            ).getTime()
          : 0;

      return (
        firstDate -
        secondDate
      );
    }
  );
}

function getActivityHistory(order) {
  const activities =
    Array.isArray(
      order.activityHistory
    )
      ? order.activityHistory
      : [];

  return [...activities]
    .map(
      (activity, index) => ({
        id: `${
          activity.changedAt ||
          activity.createdAt ||
          index
        }-${index}`,

        type:
          activity.type ||
          "order-management-update",

        changedFields:
          Array.isArray(
            activity.changedFields
          )
            ? activity.changedFields
            : [],

        changedAt:
          activity.changedAt ||
          activity.createdAt ||
          activity.updatedAt ||
          null,

        actor:
          activity.actor ||
          activity.changedBy ||
          activity.updatedBy ||
          "admin",
      })
    )
    .sort(
      (
        firstActivity,
        secondActivity
      ) => {
        const firstDate =
          firstActivity.changedAt
            ? new Date(
                firstActivity.changedAt
              ).getTime()
            : 0;

        const secondDate =
          secondActivity.changedAt
            ? new Date(
                secondActivity.changedAt
              ).getTime()
            : 0;

        return (
          secondDate -
          firstDate
        );
      }
    );
}

function isSafeExternalUrl(value) {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function InformationField({
  label,
  children,
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
        {label}
      </p>

      <div className="mt-3 break-words text-sm text-neutral-300">
        {children || "N/A"}
      </div>
    </div>
  );
}

export default async function OrderDetailsPage({
  params,
}) {
  await requireAdminPermission({
    orders: ["read"],
  });

  const [
    canUpdateOrders,
    canExportOrders,
  ] = await Promise.all([
    hasAdminPermission({
      orders: ["update"],
    }),

    hasAdminPermission({
      orders: ["export"],
    }),
  ]);

  const { id } = await params;

  const order =
    await getOrder(id);

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-[#f1ece4]">
        <div className="w-full max-w-xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Admin / Orders
          </p>

          <h1 className="font-heading text-4xl font-light">
            Order not found
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-400">
            The requested order could
            not be found. It may have
            been removed or the order
            ID may be incorrect.
          </p>

          <Link
            href="/admin/orders"
            className="mt-8 inline-flex border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const items = Array.isArray(
    order.items
  )
    ? order.items
    : [];

  const timeline =
    getTimeline(order);

  const activityHistory =
    getActivityHistory(order);

  const subtotal =
    Number(order.subtotal) || 0;

  const deliveryCharge =
    Number(
      order.deliveryCharge ??
        order.shippingCharge ??
        order.deliveryFee
    ) || 0;

  const discountAmount =
    getDiscountAmount(order);

  const total =
    Number(
      order.total ??
        order.grandTotal
    ) ||
    Math.max(
      subtotal -
        discountAmount +
        deliveryCharge,
      0
    );

  const couponCode =
    getCouponCode(order);

  const paymentMethod =
    getPaymentMethod(order);

  const paymentStatus =
    getPaymentStatus(order);

  const transactionId =
    getTransactionId(order);

  const paymentReceivedAt =
    getPaymentReceivedAt(order);

  const paymentNote =
    getPaymentNote(order);

  const customerNote =
    getCustomerNote(order);

  const internalNote =
    getInternalNote(order);

  const courierInformation =
    getCourierInformation(order);

  const cancellationReason =
    getCancellationReason(order);

  const currentStatus =
    order.status || "pending";

  const hasCourierInformation =
    Object.values(
      courierInformation
    ).some(Boolean);

  const totalQuantity =
    items.reduce(
      (
        quantityTotal,
        item
      ) =>
        quantityTotal +
        (Number(
          item.quantity
        ) || 1),
      0
    );

  const encodedOrderId =
    encodeURIComponent(
      order.orderId
    );

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div>
              <p className="mb-4 break-all text-xs uppercase tracking-[0.35em] text-neutral-500">
                Admin / Orders /{" "}
                {order.orderId}
              </p>

              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <h1 className="font-heading text-5xl font-light md:text-7xl">
                  Order Details
                </h1>

                <span
                  className={`w-fit border px-4 py-2 text-xs uppercase tracking-[0.25em] ${getStatusClass(
                    currentStatus
                  )}`}
                >
                  {formatLabel(
                    currentStatus
                  )}
                </span>
              </div>

              <p className="mt-5 text-sm text-neutral-400">
                Placed on{" "}
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/track-order?orderId=${encodedOrderId}`}
                target="_blank"
                className="border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.22em] transition duration-300 hover:border-white/40 hover:bg-white/[0.05]"
              >
                Customer View
              </Link>

              <Link
                href="/admin/orders"
                className="border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.22em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </header>

        {canExportOrders ? (
          <section className="mb-8 overflow-hidden border border-white/10 bg-white/[0.025]">
            <div className="flex flex-col justify-between gap-5 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Order Documents
                </p>

                <h2 className="mt-2 font-heading text-3xl font-light">
                  Print & PDF Documents
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-400">
                  Generate individual
                  customer, fulfilment
                  and internal documents
                  for this order. Each
                  document can be
                  printed or saved as a
                  PDF.
                </p>
              </div>

              <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-neutral-600">
                {order.orderId}
              </p>
            </div>

            <div className="grid gap-px bg-white/10 lg:grid-cols-3">
              <Link
                href={`/admin/orders/${encodedOrderId}/documents/invoice`}
                target="_blank"
                className="group bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.045] sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
                      Customer Document
                    </p>

                    <h3 className="mt-4 font-heading text-3xl font-light">
                      Customer Invoice
                    </h3>
                  </div>

                  <span className="text-neutral-600 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#f1ece4]">
                    ↗
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-neutral-400">
                  Customer-facing
                  invoice containing
                  product, pricing,
                  discount, delivery,
                  payment and order
                  information.
                </p>
              </Link>

              <Link
                href={`/admin/orders/${encodedOrderId}/documents/packing-slip`}
                target="_blank"
                className="group bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.045] sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
                      Fulfilment Document
                    </p>

                    <h3 className="mt-4 font-heading text-3xl font-light">
                      Packing Slip
                    </h3>
                  </div>

                  <span className="text-neutral-600 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#f1ece4]">
                    ↗
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-neutral-400">
                  Warehouse and courier
                  copy containing
                  customer address,
                  product variants,
                  size, color, SKU and
                  quantities without
                  prices.
                </p>
              </Link>

              <Link
                href={`/admin/orders/${encodedOrderId}/documents/admin-copy`}
                target="_blank"
                className="group bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.045] sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
                      Internal Document
                    </p>

                    <h3 className="mt-4 font-heading text-3xl font-light">
                      Admin Copy
                    </h3>
                  </div>

                  <span className="text-neutral-600 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#f1ece4]">
                    ↗
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-neutral-400">
                  Complete internal
                  record containing
                  financial, payment,
                  shipment, private
                  notes and order status
                  history.
                </p>
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Fulfilment
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Ordered Products
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="px-6 py-10 text-sm text-neutral-400 sm:px-8">
                  No products were found
                  in this order.
                </div>
              ) : (
                <div>
                  {items.map(
                    (
                      item,
                      index
                    ) => {
                      const quantity =
                        Number(
                          item.quantity
                        ) || 1;

                      const price =
                        Number(
                          item.price ??
                            item.unitPrice ??
                            item.salePrice
                        ) || 0;

                      const lineTotal =
                        Number(
                          item.lineTotal
                        ) ||
                        price *
                          quantity;

                      const productImage =
                        getItemImage(
                          item
                        );

                      const variant =
                        getItemVariant(
                          item
                        );

                      return (
                        <article
                          key={getItemKey(
                            item,
                            index
                          )}
                          className="group border-b border-white/10 p-6 transition duration-500 last:border-b-0 hover:bg-white/[0.018] sm:p-8"
                        >
                          <div className="flex flex-col gap-6 sm:flex-row">
                            <div className="h-36 w-full shrink-0 overflow-hidden border border-white/10 bg-white/[0.03] sm:h-36 sm:w-32">
                              {productImage ? (
                                <Image
                                  src={
                                    productImage
                                  }
                                  alt={
                                    item.name ||
                                    "Ordered product"
                                  }
                                  loading="lazy"
                                  width={512}
                                  height={576}
                                  sizes="(min-width: 640px) 128px, 100vw"
                                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center px-4 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                  Image
                                  Unavailable
                                </div>
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 md:flex-row">
                              <div className="min-w-0">
                                <h3 className="break-words font-heading text-3xl font-light">
                                  {item.name ||
                                    "Unnamed Product"}
                                </h3>

                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-400">
                                  {item.sku ? (
                                    <p>
                                      <span className="text-neutral-600">
                                        SKU:
                                      </span>{" "}
                                      {
                                        item.sku
                                      }
                                    </p>
                                  ) : null}

                                  {item.series ? (
                                    <p>
                                      <span className="text-neutral-600">
                                        Series:
                                      </span>{" "}
                                      {
                                        item.series
                                      }
                                    </p>
                                  ) : null}

                                  {variant ? (
                                    <p>
                                      <span className="text-neutral-600">
                                        Variant:
                                      </span>{" "}
                                      {
                                        variant
                                      }
                                    </p>
                                  ) : null}

                                  {item.size ? (
                                    <p>
                                      <span className="text-neutral-600">
                                        Size:
                                      </span>{" "}
                                      {
                                        item.size
                                      }
                                    </p>
                                  ) : null}

                                  {item.color ? (
                                    <p>
                                      <span className="text-neutral-600">
                                        Color:
                                      </span>{" "}
                                      {
                                        item.color
                                      }
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="grid shrink-0 grid-cols-3 gap-6 border-t border-white/10 pt-5 text-sm md:block md:min-w-40 md:border-l md:border-t-0 md:pl-8 md:pt-0 md:text-right">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-600">
                                    Unit Price
                                  </p>

                                  <p className="mt-2">
                                    {formatMoney(
                                      price
                                    )}
                                  </p>
                                </div>

                                <div className="md:mt-5">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-600">
                                    Quantity
                                  </p>

                                  <p className="mt-2">
                                    {
                                      quantity
                                    }
                                  </p>
                                </div>

                                <div className="md:mt-5">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-600">
                                    Line Total
                                  </p>

                                  <p className="mt-2 text-base text-[#f1ece4]">
                                    {formatMoney(
                                      lineTotal
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Customer Information
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Delivery Details
                </h2>
              </div>

              <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                <div className="bg-[#0e0e0e] p-6 sm:p-8">
                  <InformationField label="Customer Name">
                    {order.customer
                      ?.fullName ||
                      order.customer
                        ?.name ||
                      order.fullName ||
                      "N/A"}
                  </InformationField>
                </div>

                <div className="bg-[#0e0e0e] p-6 sm:p-8">
                  <InformationField label="Phone Number">
                    {order.customer
                      ?.phone ||
                    order.phone ? (
                      <a
                        href={`tel:${
                          order
                            .customer
                            ?.phone ||
                          order.phone
                        }`}
                        className="transition duration-300 hover:text-white"
                      >
                        {order
                          .customer
                          ?.phone ||
                          order.phone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </InformationField>
                </div>

                <div className="bg-[#0e0e0e] p-6 sm:p-8">
                  <InformationField label="Email Address">
                    {order.customer
                      ?.email ||
                    order.email ? (
                      <a
                        href={`mailto:${
                          order
                            .customer
                            ?.email ||
                          order.email
                        }`}
                        className="transition duration-300 hover:text-white"
                      >
                        {order
                          .customer
                          ?.email ||
                          order.email}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </InformationField>
                </div>

                <div className="bg-[#0e0e0e] p-6 sm:p-8">
                  <InformationField label="Delivery Area">
                    {order.customer
                      ?.area ||
                      order.deliveryArea ||
                      order.shippingArea ||
                      order
                        .shippingAddress
                        ?.area ||
                      "N/A"}
                  </InformationField>
                </div>

                <div className="bg-[#0e0e0e] p-6 sm:col-span-2 sm:p-8">
                  <InformationField label="Full Delivery Address">
                    <p className="whitespace-pre-line leading-7">
                      {getDeliveryAddress(
                        order
                      )}
                    </p>
                  </InformationField>
                </div>
              </div>
            </section>

            {customerNote ? (
              <section className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Customer Note
                </p>

                <p className="whitespace-pre-line text-sm leading-7 text-neutral-300">
                  {customerNote}
                </p>
              </section>
            ) : null}

            {hasCourierInformation ? (
              <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
                <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                  <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Shipment
                  </p>

                  <h2 className="font-heading text-3xl font-light">
                    Courier Information
                  </h2>
                </div>

                <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                  <div className="bg-[#0e0e0e] p-6 sm:p-8">
                    <InformationField label="Courier">
                      {courierInformation
                        .courierName ||
                        "N/A"}
                    </InformationField>
                  </div>

                  <div className="bg-[#0e0e0e] p-6 sm:p-8">
                    <InformationField label="Tracking / Consignment">
                      {courierInformation
                        .trackingNumber ||
                        "N/A"}
                    </InformationField>
                  </div>

                  <div className="bg-[#0e0e0e] p-6 sm:p-8">
                    <InformationField label="Booking Date">
                      {formatDate(
                        courierInformation
                          .bookingDate
                      )}
                    </InformationField>
                  </div>

                  <div className="bg-[#0e0e0e] p-6 sm:p-8">
                    <InformationField label="Estimated Delivery">
                      {formatDate(
                        courierInformation
                          .estimatedDelivery
                      )}
                    </InformationField>
                  </div>

                  {courierInformation
                    .trackingUrl ? (
                    <div className="bg-[#0e0e0e] p-6 sm:col-span-2 sm:p-8">
                      <InformationField label="Tracking URL">
                        {isSafeExternalUrl(
                          courierInformation
                            .trackingUrl
                        ) ? (
                          <a
                            href={
                              courierInformation
                                .trackingUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="break-all underline decoration-white/20 underline-offset-4 transition duration-300 hover:text-white"
                          >
                            {
                              courierInformation
                                .trackingUrl
                            }
                          </a>
                        ) : (
                          courierInformation
                            .trackingUrl
                        )}
                      </InformationField>
                    </div>
                  ) : null}

                  {courierInformation
                    .deliveryNote ? (
                    <div className="bg-[#0e0e0e] p-6 sm:col-span-2 sm:p-8">
                      <InformationField label="Delivery Note">
                        <p className="whitespace-pre-line leading-7">
                          {
                            courierInformation
                              .deliveryNote
                          }
                        </p>
                      </InformationField>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {internalNote ||
            cancellationReason ? (
              <section className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <p className="mb-5 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Internal Information
                </p>

                <div className="space-y-7">
                  {internalNote ? (
                    <InformationField label="Private Admin Note">
                      <p className="whitespace-pre-line leading-7">
                        {
                          internalNote
                        }
                      </p>
                    </InformationField>
                  ) : null}

                  {cancellationReason ? (
                    <InformationField label="Cancellation / Refund Reason">
                      <p className="whitespace-pre-line leading-7">
                        {
                          cancellationReason
                        }
                      </p>
                    </InformationField>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  History
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Order Timeline
                </h2>
              </div>

              <div className="p-6 sm:p-8">
                <div className="relative">
                  <div className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10" />

                  <div className="space-y-8">
                    {timeline.map(
                      (
                        entry,
                        index
                      ) => {
                        const isLatest =
                          index ===
                          timeline.length -
                            1;

                        return (
                          <div
                            key={
                              entry.id
                            }
                            className="relative grid grid-cols-[16px_1fr] gap-5"
                          >
                            <div
                              className={`relative z-10 mt-1 h-[15px] w-[15px] rounded-full border ${
                                isLatest
                                  ? "border-[#f1ece4] bg-[#f1ece4]"
                                  : "border-white/30 bg-[#0b0b0b]"
                              }`}
                            />

                            <div>
                              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                <div>
                                  <p className="text-sm text-[#f1ece4]">
                                    {entry.isInitial
                                      ? `Order placed as ${formatLabel(
                                          entry.status
                                        )}`
                                      : `${formatLabel(
                                          entry.from
                                        )} → ${formatLabel(
                                          entry.status
                                        )}`}
                                  </p>

                                  {entry.note ? (
                                    <p className="mt-2 whitespace-pre-line text-xs leading-6 text-neutral-500">
                                      {
                                        entry.note
                                      }
                                    </p>
                                  ) : null}

                                  {!entry.isInitial ? (
                                    <p className="mt-2 text-xs text-neutral-600">
                                      Updated
                                      by{" "}
                                      {formatLabel(
                                        entry.changedBy ||
                                          "Admin"
                                      )}
                                    </p>
                                  ) : null}
                                </div>

                                <p className="shrink-0 text-xs text-neutral-600">
                                  {formatDate(
                                    entry.changedAt
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>

            {activityHistory.length >
            0 ? (
              <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
                <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                  <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                    Audit Record
                  </p>

                  <h2 className="font-heading text-3xl font-light">
                    Management Activity
                  </h2>
                </div>

                <div className="divide-y divide-white/10">
                  {activityHistory.map(
                    (activity) => (
                      <div
                        key={
                          activity.id
                        }
                        className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-start sm:px-8"
                      >
                        <div>
                          <p className="text-sm text-neutral-300">
                            {formatLabel(
                              activity.type
                            )}
                          </p>

                          {activity
                            .changedFields
                            .length > 0 ? (
                            <p className="mt-2 text-xs leading-6 text-neutral-600">
                              Updated:{" "}
                              {activity.changedFields
                                .map(
                                  (
                                    field
                                  ) =>
                                    formatLabel(
                                      field
                                    )
                                )
                                .join(
                                  ", "
                                )}
                            </p>
                          ) : null}

                          <p className="mt-2 text-xs text-neutral-600">
                            By{" "}
                            {formatLabel(
                              activity.actor
                            )}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs text-neutral-600">
                          {formatDate(
                            activity.changedAt
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-8">
            <section className="border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                Management
              </p>

              <h2 className="mb-7 font-heading text-3xl font-light">
                Order Operations
              </h2>

              {canUpdateOrders ? (
                <OrderStatusUpdater
                  orderId={
                    order.orderId
                  }
                  currentStatus={
                    currentStatus
                  }
                  paymentStatus={
                    paymentStatus
                  }
                  transactionId={
                    transactionId
                  }
                  paymentReceivedAt={
                    paymentReceivedAt
                  }
                  paymentNote={
                    paymentNote
                  }
                  courierName={
                    courierInformation
                      .courierName
                  }
                  trackingNumber={
                    courierInformation
                      .trackingNumber
                  }
                  trackingUrl={
                    courierInformation
                      .trackingUrl
                  }
                  courierBookingDate={
                    courierInformation
                      .bookingDate
                  }
                  estimatedDelivery={
                    courierInformation
                      .estimatedDelivery
                  }
                  deliveryNote={
                    courierInformation
                      .deliveryNote
                  }
                  internalNote={
                    internalNote
                  }
                  cancellationReason={
                    cancellationReason
                  }
                />
              ) : (
                <div className="border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-600">
                    Read-only access
                  </p>

                  <p className="mt-3 text-sm leading-7 text-neutral-500">
                    You can review this
                    order, but status,
                    payment, courier and
                    internal-note
                    controls are hidden
                    for this role.
                  </p>
                </div>
              )}
            </section>

            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Financial Summary
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Order Total
                </h2>
              </div>

              <div className="space-y-5 p-6 text-sm sm:p-8">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span>
                    {formatMoney(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <span className="text-neutral-500">
                    Discount
                  </span>

                  <span
                    className={
                      discountAmount >
                      0
                        ? "text-green-300"
                        : "text-neutral-300"
                    }
                  >
                    {discountAmount > 0
                      ? `− ${formatMoney(
                          discountAmount
                        )}`
                      : formatMoney(
                          0
                        )}
                  </span>
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-neutral-500">
                      Coupon
                    </span>

                    <span className="border border-white/15 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em]">
                      {
                        couponCode
                      }
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-6">
                  <span className="text-neutral-500">
                    Delivery Charge
                  </span>

                  <span>
                    {formatMoney(
                      deliveryCharge
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6 border-t border-white/10 pt-5">
                  <span className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                    Grand Total
                  </span>

                  <span className="font-heading text-3xl font-light">
                    {formatMoney(
                      total
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Transaction
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Payment Details
                </h2>
              </div>

              <div className="space-y-6 p-6 text-sm sm:p-8">
                <InformationField label="Payment Method">
                  {formatLabel(
                    paymentMethod
                  )}
                </InformationField>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
                    Payment Status
                  </p>

                  <span
                    className={`mt-3 inline-flex border px-3 py-2 text-xs uppercase tracking-[0.2em] ${getPaymentStatusClass(
                      paymentStatus
                    )}`}
                  >
                    {formatLabel(
                      paymentStatus
                    )}
                  </span>
                </div>

                {transactionId ? (
                  <InformationField label="Transaction ID">
                    {transactionId}
                  </InformationField>
                ) : null}

                {paymentReceivedAt ? (
                  <InformationField label="Payment Received">
                    {formatDate(
                      paymentReceivedAt
                    )}
                  </InformationField>
                ) : null}

                {paymentNote ? (
                  <InformationField label="Payment Note">
                    <p className="whitespace-pre-line leading-7">
                      {
                        paymentNote
                      }
                    </p>
                  </InformationField>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-6 py-5 sm:px-8">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Record
                </p>

                <h2 className="font-heading text-3xl font-light">
                  Order Information
                </h2>
              </div>

              <div className="space-y-6 p-6 text-sm sm:p-8">
                <InformationField label="Order ID">
                  {order.orderId}
                </InformationField>

                <InformationField label="Total Products">
                  {items.length}
                </InformationField>

                <InformationField label="Total Quantity">
                  {totalQuantity}
                </InformationField>

                <InformationField label="Order Created">
                  {formatDate(
                    order.createdAt
                  )}
                </InformationField>

                <InformationField label="Last Updated">
                  {formatDate(
                    order.updatedAt ||
                      order.createdAt
                  )}
                </InformationField>

                {order.lastUpdatedBy ? (
                  <InformationField label="Last Updated By">
                    {formatLabel(
                      order.lastUpdatedBy
                    )}
                  </InformationField>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}