/* eslint-disable @next/next/no-img-element -- Printable documents require direct native image rendering for predictable output. */
import { notFound } from "next/navigation";
import clientPromise from "../../../../../../lib/mongodb";
import { requireAdminPermission } from "../../../../../../lib/adminAuth";
import OrderDocumentToolbar from "../../../../../../components/admin/OrderDocumentToolbar";

export const dynamic = "force-dynamic";

const supportedDocumentTypes = [
  "invoice",
  "packing-slip",
  "admin-copy",
];

const documentConfiguration = {
  invoice: {
    title: "Customer Invoice",
    shortTitle: "Invoice",
    referenceLabel: "Invoice Number",
    subtitle: "Official customer order and payment record",
    showPrices: true,
    showPayment: true,
    showCustomerNote: true,
    showInternalInformation: false,
    showStatusHistory: false,
  },

  "packing-slip": {
    title: "Packing Slip",
    shortTitle: "Packing Slip",
    referenceLabel: "Packing Reference",
    subtitle: "Warehouse packing and fulfilment record",
    showPrices: false,
    showPayment: false,
    showCustomerNote: true,
    showInternalInformation: false,
    showStatusHistory: false,
  },

  "admin-copy": {
    title: "Admin Order Copy",
    shortTitle: "Admin Copy",
    referenceLabel: "Internal Reference",
    subtitle: "Complete internal order and operational record",
    showPrices: true,
    showPayment: true,
    showCustomerNote: true,
    showInternalInformation: true,
    showStatusHistory: true,
  },
};

async function getOrder(orderId) {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB || "obsidian"
  );

  const order = await db.collection("orders").findOne({
    orderId,
  });

  if (!order) {
    return null;
  }

  return JSON.parse(JSON.stringify(order));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳ 0";
  }

  return `৳ ${amount.toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
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
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "N/A";
  }

  return normalizedValue
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getItemKey(item, index) {
  return [
    item.id,
    item._id,
    item.productId,
    item.slug,
    item.name,
    item.size,
    item.color,
    index,
  ]
    .filter(Boolean)
    .join("-");
}

function getOrderItems(order) {
  if (Array.isArray(order.items)) {
    return order.items;
  }

  if (Array.isArray(order.products)) {
    return order.products;
  }

  if (Array.isArray(order.cartItems)) {
    return order.cartItems;
  }

  return [];
}

function getItemQuantity(item) {
  const quantity = Number(
    item.quantity ??
      item.qty ??
      item.count
  );

  return Number.isFinite(quantity) && quantity > 0
    ? quantity
    : 1;
}

function getItemPrice(item) {
  const price = Number(
    item.price ??
      item.salePrice ??
      item.unitPrice
  );

  return Number.isFinite(price) ? price : 0;
}

function getItemImage(item) {
  const imageFromArray = Array.isArray(item.images)
    ? item.images.find((image) => {
        if (typeof image === "string") {
          return image.trim();
        }

        return (
          image?.url ||
          image?.src ||
          image?.imageUrl
        );
      })
    : null;

  const resolvedArrayImage =
    typeof imageFromArray === "string"
      ? imageFromArray
      : imageFromArray?.url ||
        imageFromArray?.src ||
        imageFromArray?.imageUrl ||
        null;

  const possibleImage =
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    item.thumbnailUrl ||
    item.productImage ||
    item.featuredImage ||
    item.variantImage ||
    resolvedArrayImage ||
    null;

  if (!possibleImage) {
    return null;
  }

  if (typeof possibleImage === "string") {
    return possibleImage.trim() || null;
  }

  return (
    possibleImage.url ||
    possibleImage.src ||
    possibleImage.imageUrl ||
    null
  );
}

function getSubtotal(order, items) {
  const storedSubtotal = Number(order.subtotal);

  if (
    Number.isFinite(storedSubtotal) &&
    storedSubtotal >= 0
  ) {
    return storedSubtotal;
  }

  return items.reduce((total, item) => {
    return (
      total +
      getItemPrice(item) *
        getItemQuantity(item)
    );
  }, 0);
}

function getDiscountAmount(order) {
  const amount = Number(
    order.discountAmount ??
      order.discount ??
      order.couponDiscount ??
      order.coupon?.discountAmount ??
      order.appliedCoupon?.discountAmount ??
      0
  );

  return Number.isFinite(amount)
    ? Math.max(amount, 0)
    : 0;
}

function getDeliveryCharge(order) {
  const amount = Number(
    order.deliveryCharge ??
      order.shippingCharge ??
      order.deliveryFee ??
      0
  );

  return Number.isFinite(amount)
    ? Math.max(amount, 0)
    : 0;
}

function getOrderTotal(
  order,
  subtotal,
  discountAmount,
  deliveryCharge
) {
  const savedTotal = Number(
    order.total ?? order.grandTotal
  );

  if (Number.isFinite(savedTotal)) {
    return Math.max(savedTotal, 0);
  }

  return Math.max(
    subtotal - discountAmount + deliveryCharge,
    0
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

  const paymentMethod = normalizeText(
    getPaymentMethod(order)
  ).toLowerCase();

  if (
    paymentMethod.includes("cash") ||
    paymentMethod.includes("cod") ||
    paymentMethod.includes("delivery")
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
    null
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
    null
  );
}

function getCustomerInformation(order) {
  const customer = order.customer || {};
  const shippingAddress =
    order.shippingAddress || {};

  return {
    fullName:
      customer.fullName ||
      customer.name ||
      order.fullName ||
      shippingAddress.fullName ||
      shippingAddress.name ||
      "N/A",

    phone:
      customer.phone ||
      order.phone ||
      shippingAddress.phone ||
      "N/A",

    email:
      customer.email ||
      order.email ||
      shippingAddress.email ||
      "N/A",

    area:
      customer.area ||
      order.deliveryArea ||
      order.shippingArea ||
      shippingAddress.area ||
      "N/A",

    city:
      customer.city ||
      customer.district ||
      order.deliveryCity ||
      shippingAddress.city ||
      shippingAddress.district ||
      "",

    postcode:
      customer.postalCode ||
      customer.postcode ||
      order.postcode ||
      shippingAddress.postalCode ||
      shippingAddress.postcode ||
      "",

    address:
      customer.address ||
      order.deliveryAddress ||
      shippingAddress.address ||
      shippingAddress.addressLine1 ||
      "N/A",

    addressLine2:
      shippingAddress.addressLine2 ||
      customer.addressLine2 ||
      "",
  };
}

function getDeliveryAddress(order) {
  const customer =
    getCustomerInformation(order);

  const parts = [
    customer.address,
    customer.addressLine2,
    customer.area !== "N/A"
      ? customer.area
      : "",
    customer.city,
    customer.postcode,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : "N/A";
}

function getCourierInformation(order) {
  const shipment =
    order.shipment ||
    order.shipping ||
    order.delivery ||
    {};

  return {
    courierName:
      order.courierName ||
      order.courier ||
      shipment.courierName ||
      shipment.courier ||
      null,

    trackingNumber:
      order.trackingNumber ||
      order.consignmentNumber ||
      shipment.trackingNumber ||
      shipment.consignmentNumber ||
      null,

    trackingUrl:
      order.trackingUrl ||
      shipment.trackingUrl ||
      null,

    bookingDate:
      order.courierBookingDate ||
      shipment.bookingDate ||
      shipment.shippedAt ||
      null,

    estimatedDelivery:
      order.estimatedDelivery ||
      shipment.estimatedDelivery ||
      null,

    deliveryNote:
      order.deliveryNote ||
      shipment.deliveryNote ||
      null,
  };
}

function getCancellationReason(order) {
  return (
    order.cancellationReason ||
    order.cancelReason ||
    order.refundReason ||
    null
  );
}

function getStatusHistory(order) {
  if (!Array.isArray(order.statusHistory)) {
    return [];
  }

  return order.statusHistory
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
        null,

      note:
        entry.note ||
        entry.reason ||
        null,

      changedBy:
        entry.changedBy ||
        entry.updatedBy ||
        entry.adminName ||
        null,
    }))
    .filter((entry) => entry.status);
}

function getBusinessInformation() {
  return {
    name:
      process.env.NEXT_PUBLIC_BUSINESS_NAME ||
      "OBSIDIAN",

    tagline:
      process.env.NEXT_PUBLIC_BUSINESS_TAGLINE ||
      "Built Under Pressure. Finished With Precision.",

    address:
      process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
      "Dhaka, Bangladesh",

    phone:
      process.env.NEXT_PUBLIC_BUSINESS_PHONE ||
      "",

    email:
      process.env.NEXT_PUBLIC_BUSINESS_EMAIL ||
      "",

    website:
      process.env.NEXT_PUBLIC_BUSINESS_WEBSITE ||
      "obsidianwearbd.store",

    logo: "/images/obsidian-logo-black.png",
  };
}

function DetailField({
  label,
  children,
  className = "",
  align = "left",
}) {
  return (
    <div className={className}>
      <p
        className={`mb-[3px] text-[6.5px] font-semibold uppercase tracking-[0.16em] text-neutral-500 ${
          align === "right"
            ? "text-right"
            : "text-left"
        }`}
      >
        {label}
      </p>

      <div
        className={`break-words text-[8.5px] leading-[1.45] text-neutral-900 ${
          align === "right"
            ? "text-right"
            : "text-left"
        }`}
      >
        {children || "N/A"}
      </div>
    </div>
  );
}

function BrandLockup({
  business,
  compact = false,
}) {
  return (
    <div className="brand-lockup flex items-center">
      <div
        className={`flex shrink-0 items-center justify-center border border-black ${
          compact
            ? "h-8 w-8 p-[5px]"
            : "h-11 w-11 p-[7px]"
        }`}
      >
        <img
          src={business.logo}
          alt={`${business.name} brand mark`}
          width={compact ? 26 : 36}
          height={compact ? 26 : 36}
          className="block h-full w-full object-contain"
        />
      </div>

      <div
        className={
          compact
            ? "ml-2 border-l border-neutral-300 pl-2"
            : "ml-3 border-l border-neutral-300 pl-3"
        }
      >
        <p
          className={`font-serif font-medium leading-none tracking-[0.17em] text-black ${
            compact
              ? "text-[14px]"
              : "text-[20px]"
          }`}
        >
          {business.name}
        </p>

        <p
          className={`uppercase leading-none text-neutral-500 ${
            compact
              ? "mt-[6px] text-[4.8px] tracking-[0.12em]"
              : "mt-[7px] text-[5.5px] tracking-[0.15em]"
          }`}
        >
          {business.tagline}
        </p>
      </div>
    </div>
  );
}

function DocumentHeader({
  business,
  configuration,
  order,
}) {
  return (
    <header className="document-header">
      <div className="grid grid-cols-[1fr_auto] items-start gap-8">
        <BrandLockup business={business} />

        <div className="max-w-[280px] text-right">
          <p className="text-[5.5px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Official Order Document
          </p>

          <h1 className="mt-2 font-serif text-[25px] font-normal leading-none text-black">
            {configuration.title}
          </h1>

          <p className="mt-2 text-[6px] uppercase leading-[1.6] tracking-[0.14em] text-neutral-500">
            {configuration.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-4 h-[2px] w-full bg-black" />

      <div className="grid grid-cols-[0.85fr_1.15fr] gap-8 border-b border-neutral-300 py-3">
        <div>
          <p className="mb-2 text-[5.5px] font-semibold uppercase tracking-[0.19em] text-neutral-500">
            Issued By
          </p>

          <div className="space-y-[1px] text-[7px] leading-[1.5] text-neutral-600">
            <p className="font-semibold text-black">
              {business.name}
            </p>

            {business.address ? (
              <p>{business.address}</p>
            ) : null}

            {business.phone ? (
              <p>{business.phone}</p>
            ) : null}

            {business.email ? (
              <p>{business.email}</p>
            ) : null}

            {business.website ? (
              <p>{business.website}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-7 gap-y-3">
          <DetailField
            label={configuration.referenceLabel}
            align="right"
          >
            {order.orderId}
          </DetailField>

          <DetailField
            label="Issue Date"
            align="right"
          >
            {formatDate(order.createdAt)}
          </DetailField>

          <DetailField
            label="Order Status"
            align="right"
          >
            {formatLabel(
              order.status || "pending"
            )}
          </DetailField>

          <DetailField
            label="Document Type"
            align="right"
          >
            {configuration.shortTitle}
          </DetailField>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  title,
  meta,
}) {
  return (
    <div className="mb-2 flex items-end justify-between border-b border-neutral-300 pb-[6px]">
      <h2 className="text-[7px] font-semibold uppercase tracking-[0.19em] text-black">
        {title}
      </h2>

      {meta ? (
        <p className="text-[5.5px] uppercase tracking-[0.14em] text-neutral-500">
          {meta}
        </p>
      ) : null}
    </div>
  );
}

function CustomerSection({ order }) {
  const customer =
    getCustomerInformation(order);

  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Delivery Information"
        meta="Customer & Destination"
      />

      <div className="grid grid-cols-2 gap-x-9 gap-y-3">
        <DetailField label="Customer Name">
          {customer.fullName}
        </DetailField>

        <DetailField label="Phone Number">
          {customer.phone}
        </DetailField>

        <DetailField label="Email Address">
          {customer.email}
        </DetailField>

        <DetailField label="Delivery Area">
          {customer.area}
        </DetailField>

        <DetailField
          label="Full Delivery Address"
          className="col-span-2"
        >
          {getDeliveryAddress(order)}
        </DetailField>
      </div>
    </section>
  );
}

function ProductImage({
  item,
  productName,
}) {
  const image = getItemImage(item);

  return (
    <div className="product-image-frame mx-auto flex h-[46px] w-[46px] items-center justify-center overflow-hidden border border-neutral-300 bg-neutral-50">
      {image ? (
        <img
          src={image}
          alt={`${productName} ordered product`}
          width={46}
          height={46}
          loading="eager"
          className="block h-full w-full object-cover"
        />
      ) : (
        <div className="px-1 text-center text-[4.5px] font-semibold uppercase leading-[1.4] tracking-[0.1em] text-neutral-400">
          Image
          <br />
          Unavailable
        </div>
      )}
    </div>
  );
}

function ProductsTable({
  items,
  showPrices,
}) {
  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Ordered Products"
        meta={`${items.length} Product${
          items.length === 1 ? "" : "s"
        }`}
      />

      <div className="overflow-hidden border border-neutral-300">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="w-[5%] border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                No.
              </th>

              <th className="w-[11%] border-b border-neutral-300 px-2 py-2 text-center text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Image
              </th>

              <th className="border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Product Details
              </th>

              <th className="w-[7%] border-b border-neutral-300 px-2 py-2 text-center text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Size
              </th>

              <th className="w-[11%] border-b border-neutral-300 px-2 py-2 text-center text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Colour
              </th>

              <th className="w-[6%] border-b border-neutral-300 px-2 py-2 text-center text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Qty
              </th>

              {showPrices ? (
                <>
                  <th className="w-[12%] border-b border-neutral-300 px-2 py-2 text-right text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                    Unit
                  </th>

                  <th className="w-[12%] border-b border-neutral-300 px-2 py-2 text-right text-[5.5px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                    Total
                  </th>
                </>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    showPrices ? 8 : 6
                  }
                  className="px-4 py-6 text-center text-[7px] text-neutral-500"
                >
                  No products were found in this order.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const quantity =
                  getItemQuantity(item);

                const price =
                  getItemPrice(item);

                const lineTotal =
                  price * quantity;

                const productName =
                  item.name ||
                  item.productName ||
                  item.title ||
                  "Unnamed Product";

                return (
                  <tr
                    key={getItemKey(
                      item,
                      index
                    )}
                    className="product-row"
                  >
                    <td className="border-b border-neutral-200 px-2 py-2 align-middle text-[6.5px] text-neutral-500">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </td>

                    <td className="border-b border-neutral-200 px-2 py-[6px] align-middle">
                      <ProductImage
                        item={item}
                        productName={productName}
                      />
                    </td>

                    <td className="border-b border-neutral-200 px-2 py-2 align-middle">
                      <p className="text-[8px] font-semibold leading-[1.4] text-black">
                        {productName}
                      </p>

                      <div className="mt-1 space-y-[1px] text-[5.5px] leading-[1.4] text-neutral-500">
                        {item.sku ? (
                          <p>SKU: {item.sku}</p>
                        ) : null}

                        {item.series ? (
                          <p>
                            Series: {item.series}
                          </p>
                        ) : null}

                        {item.variant &&
                        typeof item.variant ===
                          "string" ? (
                          <p>
                            Variant: {item.variant}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    <td className="border-b border-neutral-200 px-2 py-2 text-center align-middle text-[6.5px]">
                      {item.size ||
                        item.variant?.size ||
                        "—"}
                    </td>

                    <td className="border-b border-neutral-200 px-2 py-2 text-center align-middle text-[6.5px]">
                      {item.color ||
                        item.variant?.color ||
                        "—"}
                    </td>

                    <td className="border-b border-neutral-200 px-2 py-2 text-center align-middle text-[6.5px] font-semibold">
                      {quantity}
                    </td>

                    {showPrices ? (
                      <>
                        <td className="border-b border-neutral-200 px-2 py-2 text-right align-middle text-[6.5px]">
                          {formatMoney(price)}
                        </td>

                        <td className="border-b border-neutral-200 px-2 py-2 text-right align-middle text-[6.5px] font-semibold">
                          {formatMoney(lineTotal)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-[5px] text-[5px] leading-[1.5] text-neutral-500">
        Product images are included for visual identification.
        Printed colour may vary slightly from the original product.
      </p>
    </section>
  );
}

function FinancialSummary({
  subtotal,
  discountAmount,
  deliveryCharge,
  total,
  couponCode,
}) {
  return (
    <section className="document-section mt-4 flex justify-end">
      <div className="w-[280px] border border-neutral-300">
        <div className="border-b border-neutral-300 bg-neutral-100 px-4 py-2">
          <p className="text-[6.5px] font-semibold uppercase tracking-[0.17em] text-black">
            Financial Summary
          </p>
        </div>

        <div className="space-y-[7px] px-4 py-3 text-[7px]">
          <div className="flex justify-between gap-5">
            <span className="text-neutral-500">
              Subtotal
            </span>

            <span>
              {formatMoney(subtotal)}
            </span>
          </div>

          <div className="flex justify-between gap-5">
            <span className="text-neutral-500">
              Discount
            </span>

            <span>
              {discountAmount > 0
                ? `− ${formatMoney(
                    discountAmount
                  )}`
                : formatMoney(0)}
            </span>
          </div>

          {couponCode ? (
            <div className="flex justify-between gap-5">
              <span className="text-neutral-500">
                Coupon
              </span>

              <span className="font-semibold uppercase">
                {couponCode}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between gap-5">
            <span className="text-neutral-500">
              Delivery Charge
            </span>

            <span>
              {formatMoney(deliveryCharge)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5 border-t-2 border-black pt-[9px]">
            <span className="text-[6.5px] font-semibold uppercase tracking-[0.14em]">
              Grand Total
            </span>

            <span className="font-serif text-[18px] leading-none">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentSection({
  order,
  paymentMethod,
  paymentStatus,
}) {
  const transactionId =
    getTransactionId(order);

  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Payment Information"
        meta="Transaction Record"
      />

      <div className="grid grid-cols-3 gap-7">
        <DetailField label="Payment Method">
          {formatLabel(paymentMethod)}
        </DetailField>

        <DetailField label="Payment Status">
          {formatLabel(paymentStatus)}
        </DetailField>

        <DetailField label="Transaction ID">
          {transactionId || "N/A"}
        </DetailField>
      </div>
    </section>
  );
}

function ShipmentSection({
  courierInformation,
}) {
  const hasShipmentInformation =
    Object.values(
      courierInformation
    ).some(Boolean);

  if (!hasShipmentInformation) {
    return null;
  }

  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Courier & Shipment"
        meta="Fulfilment Record"
      />

      <div className="grid grid-cols-4 gap-6">
        <DetailField label="Courier">
          {courierInformation.courierName ||
            "N/A"}
        </DetailField>

        <DetailField label="Tracking Number">
          {courierInformation.trackingNumber ||
            "N/A"}
        </DetailField>

        <DetailField label="Booking Date">
          {formatDate(
            courierInformation.bookingDate
          )}
        </DetailField>

        <DetailField label="Estimated Delivery">
          {formatDate(
            courierInformation.estimatedDelivery
          )}
        </DetailField>

        {courierInformation.deliveryNote ? (
          <DetailField
            label="Delivery Note"
            className="col-span-4"
          >
            {courierInformation.deliveryNote}
          </DetailField>
        ) : null}
      </div>
    </section>
  );
}

function NotesSection({
  customerNote,
  internalNote,
  showInternalInformation,
  cancellationReason,
}) {
  const visibleNotes = [
    customerNote
      ? {
          label: "Customer Note",
          value: customerNote,
        }
      : null,

    showInternalInformation &&
    internalNote
      ? {
          label: "Private Admin Note",
          value: internalNote,
        }
      : null,

    showInternalInformation &&
    cancellationReason
      ? {
          label:
            "Cancellation / Refund Reason",
          value: cancellationReason,
        }
      : null,
  ].filter(Boolean);

  if (visibleNotes.length === 0) {
    return null;
  }

  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Notes"
        meta="Order Communication"
      />

      <div
        className={`grid gap-6 ${
          visibleNotes.length > 1
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {visibleNotes.map((note) => (
          <DetailField
            key={note.label}
            label={note.label}
          >
            {note.value}
          </DetailField>
        ))}
      </div>
    </section>
  );
}

function StatusHistorySection({
  history,
}) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section className="document-section mt-4">
      <SectionHeading
        title="Status History"
        meta={`${history.length} Update${
          history.length === 1
            ? ""
            : "s"
        }`}
      />

      <div className="overflow-hidden border border-neutral-300">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="w-[24%] border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] uppercase tracking-[0.11em] text-neutral-600">
                Change
              </th>

              <th className="w-[22%] border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] uppercase tracking-[0.11em] text-neutral-600">
                Date
              </th>

              <th className="w-[18%] border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] uppercase tracking-[0.11em] text-neutral-600">
                Updated By
              </th>

              <th className="border-b border-neutral-300 px-2 py-2 text-left text-[5.5px] uppercase tracking-[0.11em] text-neutral-600">
                Note
              </th>
            </tr>
          </thead>

          <tbody>
            {history.map((entry) => (
              <tr
                key={entry.id}
                className="status-history-row"
              >
                <td className="border-b border-neutral-200 px-2 py-2 text-[6.5px]">
                  {entry.from
                    ? `${formatLabel(
                        entry.from
                      )} → ${formatLabel(
                        entry.status
                      )}`
                    : formatLabel(
                        entry.status
                      )}
                </td>

                <td className="border-b border-neutral-200 px-2 py-2 text-[6.5px]">
                  {formatDateTime(
                    entry.changedAt
                  )}
                </td>

                <td className="border-b border-neutral-200 px-2 py-2 text-[6.5px]">
                  {entry.changedBy ||
                    "Admin"}
                </td>

                <td className="border-b border-neutral-200 px-2 py-2 text-[6.5px]">
                  {entry.note || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DocumentFooter({
  business,
  configuration,
  orderId,
}) {
  return (
    <footer className="document-footer document-section mt-5 border-t-2 border-black pt-3">
      <div className="grid grid-cols-[1fr_auto] items-end gap-8">
        <div>
          <p className="text-[7.5px] font-semibold text-black">
            Thank you for choosing OBSIDIAN.
          </p>

          <p className="mt-1 max-w-[440px] text-[6px] leading-[1.5] text-neutral-500">
            Retain this{" "}
            {configuration.shortTitle.toLowerCase()}{" "}
            for future reference. For assistance,
            quote order number {orderId}.
          </p>

          <p className="mt-2 text-[5.5px] uppercase tracking-[0.14em] text-neutral-500">
            {business.website}
          </p>
        </div>

        <BrandLockup
          business={business}
          compact
        />
      </div>
    </footer>
  );
}

function DocumentIdentityStrip({
  configuration,
  orderId,
}) {
  return (
    <div className="document-identity-strip mb-4 flex items-center justify-between border border-neutral-300 bg-neutral-50 px-3 py-2">
      <p className="text-[5.5px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        OBSIDIAN / {configuration.shortTitle}
      </p>

      <p className="text-[5.5px] uppercase tracking-[0.14em] text-neutral-500">
        Reference: {orderId}
      </p>
    </div>
  );
}

export default async function OrderDocumentPage({
  params,
}) {
  await requireAdminPermission({
    orders: ["export"],
  });

  const { id, type } = await params;

  if (
    !supportedDocumentTypes.includes(type)
  ) {
    notFound();
  }

  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  const configuration =
    documentConfiguration[type];

  const business =
    getBusinessInformation();

  const items =
    getOrderItems(order);

  const subtotal =
    getSubtotal(order, items);

  const discountAmount =
    getDiscountAmount(order);

  const deliveryCharge =
    getDeliveryCharge(order);

  const total =
    getOrderTotal(
      order,
      subtotal,
      discountAmount,
      deliveryCharge
    );

  const couponCode =
    getCouponCode(order);

  const paymentMethod =
    getPaymentMethod(order);

  const paymentStatus =
    getPaymentStatus(order);

  const customerNote =
    getCustomerNote(order);

  const internalNote =
    getInternalNote(order);

  const courierInformation =
    getCourierInformation(order);

  const cancellationReason =
    getCancellationReason(order);

  const statusHistory =
    getStatusHistory(order);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 0;
            }

            .order-document-screen {
              min-height: 100vh;
            }

            .document-page {
              box-sizing: border-box;
            }

            @media print {
              html,
              body {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
              }

              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              body * {
                visibility: hidden !important;
              }

              .document-print-root,
              .document-print-root * {
                visibility: visible !important;
              }

              .document-print-root {
                position: absolute !important;
                inset: 0 auto auto 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                overflow: visible !important;
              }

              .document-page {
                position: relative !important;
                width: 210mm !important;
                min-height: 297mm !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 8mm 10mm 8mm !important;
                border: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                overflow: visible !important;
              }

              .document-toolbar-shell,
              [data-document-toolbar],
              [data-admin-toolbar] {
                display: none !important;
              }

              .document-header,
              .document-section,
              .document-footer,
              .brand-lockup,
              .product-row,
              .product-image-frame,
              .status-history-row,
              tr,
              td,
              th {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              .document-header {
                break-after: avoid !important;
                page-break-after: avoid !important;
              }

              thead {
                display: table-header-group !important;
              }

              tfoot {
                display: table-footer-group !important;
              }

              img {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .product-image-frame img {
                width: 46px !important;
                height: 46px !important;
                object-fit: cover !important;
              }

              a {
                color: inherit !important;
                text-decoration: none !important;
              }
            }
          `,
        }}
      />

      <main className="order-document-screen bg-[#0b0b0b] px-4 py-6 sm:px-6 sm:py-8 print:bg-white print:p-0">
        <div className="document-toolbar-shell">
          <OrderDocumentToolbar
            orderId={order.orderId}
            documentTitle={
              configuration.title
            }
          />
        </div>

        <div className="document-print-root">
          <article className="document-page mx-auto mt-5 min-h-[297mm] w-full max-w-[210mm] bg-white px-10 py-9 text-black shadow-2xl print:mt-0 print:shadow-none">
            <DocumentIdentityStrip
              configuration={configuration}
              orderId={order.orderId}
            />

            <DocumentHeader
              business={business}
              configuration={
                configuration
              }
              order={order}
            />

            <CustomerSection order={order} />

            <ProductsTable
              items={items}
              showPrices={
                configuration.showPrices
              }
            />

            {configuration.showPrices ? (
              <FinancialSummary
                subtotal={subtotal}
                discountAmount={
                  discountAmount
                }
                deliveryCharge={
                  deliveryCharge
                }
                total={total}
                couponCode={couponCode}
              />
            ) : null}

            {configuration.showPayment ? (
              <PaymentSection
                order={order}
                paymentMethod={
                  paymentMethod
                }
                paymentStatus={
                  paymentStatus
                }
              />
            ) : null}

            <ShipmentSection
              courierInformation={
                courierInformation
              }
            />

            <NotesSection
              customerNote={
                configuration.showCustomerNote
                  ? customerNote
                  : null
              }
              internalNote={internalNote}
              showInternalInformation={
                configuration.showInternalInformation
              }
              cancellationReason={
                cancellationReason
              }
            />

            {configuration.showStatusHistory ? (
              <StatusHistorySection
                history={statusHistory}
              />
            ) : null}

            <DocumentFooter
              business={business}
              configuration={
                configuration
              }
              orderId={order.orderId}
            />
          </article>
        </div>
      </main>
    </>
  );
}