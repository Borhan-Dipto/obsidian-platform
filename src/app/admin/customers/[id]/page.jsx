import Link from "next/link";
import { notFound } from "next/navigation";
import clientPromise from "../../../../lib/mongodb";
import { requireAdminPermission } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeText(value).replace(/[^\d+]/g, "");
}

function normalizeKey(value) {
  try {
    return decodeURIComponent(normalizeText(value));
  } catch {
    return normalizeText(value);
  }
}

function getValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTimestamp(value) {
  return getValidDate(value)?.getTime() || 0;
}

function formatDate(value) {
  const date = getValidDate(value);

  if (!date) {
    return "Not available";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = getValidDate(value);

  if (!date) {
    return "Not available";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function formatNumber(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount.toLocaleString("en-BD");
}

function formatLabel(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "Not available";
  }

  return normalizedValue
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getOrderStatus(order) {
  return normalizeText(
    order.status || "pending"
  ).toLowerCase();
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
    return normalizeText(storedStatus).toLowerCase();
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

function getOrderTotal(order) {
  const directTotal = Number(
    order.total ?? order.grandTotal
  );

  if (Number.isFinite(directTotal)) {
    return Math.max(directTotal, 0);
  }

  const subtotal = Number(order.subtotal) || 0;

  const discount =
    Number(
      order.discountAmount ??
        order.discount ??
        order.couponDiscount ??
        order.coupon?.discountAmount ??
        order.appliedCoupon?.discountAmount
    ) || 0;

  const deliveryCharge =
    Number(
      order.deliveryCharge ??
        order.shippingCharge ??
        order.deliveryFee
    ) || 0;

  return Math.max(
    subtotal - discount + deliveryCharge,
    0
  );
}

function isConfirmedRevenueOrder(order) {
  const orderStatus = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);

  const paymentMethod = normalizeText(
    getPaymentMethod(order)
  ).toLowerCase();

  if (
    orderStatus === "cancelled" ||
    paymentStatus === "cancelled" ||
    paymentStatus === "failed" ||
    paymentStatus === "refunded"
  ) {
    return false;
  }

  const paidStatuses = new Set([
    "paid",
    "completed",
    "successful",
  ]);

  if (paidStatuses.has(paymentStatus)) {
    return true;
  }

  const isCashOnDelivery =
    paymentMethod.includes("cash") ||
    paymentMethod.includes("cod") ||
    paymentMethod.includes("delivery");

  return (
    orderStatus === "delivered" &&
    isCashOnDelivery
  );
}

function getOrderCustomerData(order) {
  const customer = order.customer || {};
  const shippingAddress = order.shippingAddress || {};

  return {
    name:
      customer.fullName ||
      customer.name ||
      order.fullName ||
      shippingAddress.fullName ||
      shippingAddress.name ||
      "Unknown Customer",

    email:
      customer.email ||
      order.email ||
      shippingAddress.email ||
      "",

    phone:
      customer.phone ||
      order.phone ||
      shippingAddress.phone ||
      "",

    address:
      customer.address ||
      shippingAddress.address ||
      shippingAddress.addressLine1 ||
      order.deliveryAddress ||
      "",

    addressLine2:
      shippingAddress.addressLine2 ||
      customer.addressLine2 ||
      "",

    area:
      customer.area ||
      shippingAddress.area ||
      order.deliveryArea ||
      "",

    city:
      customer.city ||
      shippingAddress.city ||
      order.deliveryCity ||
      "",

    postcode:
      customer.postcode ||
      shippingAddress.postcode ||
      shippingAddress.postalCode ||
      order.postcode ||
      "",
  };
}

function getRegisteredCustomerData(customer) {
  const addressSource =
    customer.address ||
    customer.defaultAddress ||
    customer.shippingAddress ||
    {};

  const name =
    customer.fullName ||
    customer.name ||
    [
      customer.firstName,
      customer.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Unknown Customer";

  return {
    databaseId: String(customer._id || ""),
    name,
    email: customer.email || "",
    phone:
      customer.phone ||
      customer.mobile ||
      "",

    address:
      typeof addressSource === "string"
        ? addressSource
        : addressSource.address ||
          addressSource.addressLine1 ||
          "",

    addressLine2:
      typeof addressSource === "object"
        ? addressSource.addressLine2 || ""
        : "",

    area:
      typeof addressSource === "object"
        ? addressSource.area || ""
        : "",

    city:
      typeof addressSource === "object"
        ? addressSource.city || ""
        : "",

    postcode:
      typeof addressSource === "object"
        ? addressSource.postcode ||
          addressSource.postalCode ||
          ""
        : "",

    registeredAt:
      customer.createdAt ||
      customer.registeredAt ||
      null,

    updatedAt: customer.updatedAt || null,

    lastLoginAt:
      customer.lastLoginAt ||
      customer.lastSeenAt ||
      null,

    tags: Array.isArray(customer.tags)
      ? customer.tags
      : [],

    notes:
      customer.adminNotes ||
      customer.internalNotes ||
      customer.notes ||
      "",

    isVip: Boolean(
      customer.isVip ||
        customer.vip ||
        customer.isVIP
    ),

    isBlacklisted: Boolean(
      customer.isBlacklisted ||
        customer.blacklisted
    ),

    fraudWarning: Boolean(
      customer.fraudWarning ||
        customer.isFraudRisk
    ),

    loyaltyPoints:
      Number(customer.loyaltyPoints) || 0,

    storeCredit:
      Number(customer.storeCredit) || 0,

    marketingConsent:
      customer.marketingConsent ??
      customer.acceptsMarketing ??
      null,

    status:
      customer.status ||
      customer.accountStatus ||
      "active",

    isRegistered: true,
  };
}

function createCustomerKey(customer, fallbackValue) {
  const email = normalizeEmail(customer.email);

  if (email) {
    return `email:${email}`;
  }

  const phone = normalizePhone(customer.phone);

  if (phone) {
    return `phone:${phone}`;
  }

  if (customer.databaseId) {
    return `id:${customer.databaseId}`;
  }

  const normalizedName = normalizeText(
    customer.name
  ).toLowerCase();

  return `fallback:${normalizedName}:${fallbackValue}`;
}

function getOrderIdentifier(order) {
  return String(
    order.orderId ||
      order.trackingId ||
      order._id ||
      ""
  );
}

function getOrderItems(order) {
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.products)
      ? order.products
      : Array.isArray(order.cartItems)
        ? order.cartItems
        : [];

  return items.map((item, index) => {
    const product =
      item.product &&
      typeof item.product === "object"
        ? item.product
        : {};

    const quantity =
      Number(
        item.quantity ??
          item.qty ??
          item.count
      ) || 1;

    const unitPrice =
      Number(
        item.price ??
          item.salePrice ??
          item.unitPrice ??
          product.price
      ) || 0;

    return {
      key: String(
        item._id ||
          item.productId ||
          item.slug ||
          product._id ||
          `${getOrderIdentifier(order)}-${index}`
      ),

      productId: String(
        item.productId ||
          product._id ||
          item._id ||
          ""
      ),

      name:
        item.name ||
        item.title ||
        item.productName ||
        product.name ||
        product.title ||
        "Unnamed Product",

      slug:
        item.slug ||
        product.slug ||
        "",

      category:
        item.category ||
        item.collection ||
        product.category ||
        product.collection ||
        "Uncategorised",

      image:
        item.image ||
        item.imageUrl ||
        item.thumbnail ||
        product.image ||
        product.imageUrl ||
        product.thumbnail ||
        "",

      size:
        item.size ||
        item.variant?.size ||
        "",

      color:
        item.color ||
        item.variant?.color ||
        "",

      quantity,
      unitPrice,
      lineTotal:
        Number(
          item.lineTotal ??
            item.total
        ) || unitPrice * quantity,
    };
  });
}

function getCourierName(order) {
  return (
    order.courierName ||
    order.courier ||
    order.shipping?.courier ||
    order.delivery?.courier ||
    ""
  );
}

function getTrackingNumber(order) {
  return (
    order.trackingNumber ||
    order.courierTrackingNumber ||
    order.shipping?.trackingNumber ||
    order.delivery?.trackingNumber ||
    ""
  );
}

function customerMatchesRoute({
  routeKey,
  customerKey,
  customer,
}) {
  const normalizedRouteKey =
    normalizeKey(routeKey);

  if (
    normalizedRouteKey === customerKey ||
    normalizedRouteKey ===
      customer.databaseId ||
    normalizedRouteKey ===
      `id:${customer.databaseId}`
  ) {
    return true;
  }

  const routeEmail = normalizedRouteKey.startsWith(
    "email:"
  )
    ? normalizedRouteKey.slice(6)
    : "";

  if (
    routeEmail &&
    routeEmail === normalizeEmail(customer.email)
  ) {
    return true;
  }

  const routePhone = normalizedRouteKey.startsWith(
    "phone:"
  )
    ? normalizePhone(
        normalizedRouteKey.slice(6)
      )
    : "";

  if (
    routePhone &&
    routePhone === normalizePhone(customer.phone)
  ) {
    return true;
  }

  return false;
}

function buildCustomerProfile({
  routeKey,
  orders,
  registeredCustomers,
}) {
  const normalizedRouteKey =
    normalizeKey(routeKey);

  let registeredProfile = null;
  let registeredProfileKey = "";

  for (
    let index = 0;
    index < registeredCustomers.length;
    index += 1
  ) {
    const customerData =
      getRegisteredCustomerData(
        registeredCustomers[index]
      );

    const customerKey = createCustomerKey(
      customerData,
      customerData.databaseId ||
        `registered-${index}`
    );

    if (
      customerMatchesRoute({
        routeKey: normalizedRouteKey,
        customerKey,
        customer: customerData,
      })
    ) {
      registeredProfile = customerData;
      registeredProfileKey = customerKey;
      break;
    }
  }

  const matchingOrders = orders.filter(
    (order, index) => {
      const orderCustomer =
        getOrderCustomerData(order);

      const orderCustomerKey =
        createCustomerKey(
          orderCustomer,
          getOrderIdentifier(order) ||
            `order-${index}`
        );

      if (
        orderCustomerKey ===
          normalizedRouteKey ||
        orderCustomerKey ===
          registeredProfileKey
      ) {
        return true;
      }

      if (
        registeredProfile?.email &&
        normalizeEmail(
          orderCustomer.email
        ) ===
          normalizeEmail(
            registeredProfile.email
          )
      ) {
        return true;
      }

      if (
        registeredProfile?.phone &&
        normalizePhone(
          orderCustomer.phone
        ) ===
          normalizePhone(
            registeredProfile.phone
          )
      ) {
        return true;
      }

      return customerMatchesRoute({
        routeKey: normalizedRouteKey,
        customerKey: orderCustomerKey,
        customer: {
          ...orderCustomer,
          databaseId: "",
        },
      });
    }
  );

  const mostRecentOrder = [...matchingOrders].sort(
    (firstOrder, secondOrder) =>
      getTimestamp(secondOrder.createdAt) -
      getTimestamp(firstOrder.createdAt)
  )[0];

  const orderCustomer = mostRecentOrder
    ? getOrderCustomerData(mostRecentOrder)
    : null;

  if (
    !registeredProfile &&
    !orderCustomer
  ) {
    return null;
  }

  const baseProfile = registeredProfile || {
    databaseId: "",
    name:
      orderCustomer?.name ||
      "Unknown Customer",
    email: orderCustomer?.email || "",
    phone: orderCustomer?.phone || "",
    address: orderCustomer?.address || "",
    addressLine2:
      orderCustomer?.addressLine2 || "",
    area: orderCustomer?.area || "",
    city: orderCustomer?.city || "",
    postcode:
      orderCustomer?.postcode || "",
    registeredAt: null,
    updatedAt: null,
    lastLoginAt: null,
    tags: [],
    notes: "",
    isVip: false,
    isBlacklisted: false,
    fraudWarning: false,
    loyaltyPoints: 0,
    storeCredit: 0,
    marketingConsent: null,
    status: "active",
    isRegistered: false,
  };

  return {
    ...baseProfile,

    name:
      baseProfile.name ||
      orderCustomer?.name ||
      "Unknown Customer",

    email:
      baseProfile.email ||
      orderCustomer?.email ||
      "",

    phone:
      baseProfile.phone ||
      orderCustomer?.phone ||
      "",

    address:
      baseProfile.address ||
      orderCustomer?.address ||
      "",

    addressLine2:
      baseProfile.addressLine2 ||
      orderCustomer?.addressLine2 ||
      "",

    area:
      baseProfile.area ||
      orderCustomer?.area ||
      "",

    city:
      baseProfile.city ||
      orderCustomer?.city ||
      "",

    postcode:
      baseProfile.postcode ||
      orderCustomer?.postcode ||
      "",

    customerKey:
      registeredProfileKey ||
      createCustomerKey(
        orderCustomer || baseProfile,
        getOrderIdentifier(
          mostRecentOrder || {}
        ) || "customer"
      ),

    orders: matchingOrders.sort(
      (firstOrder, secondOrder) =>
        getTimestamp(secondOrder.createdAt) -
        getTimestamp(firstOrder.createdAt)
    ),
  };
}

async function getCustomerProfile(routeKey) {
  const client = await clientPromise;

  const db = client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );

  const [orders, registeredCustomers] =
    await Promise.all([
      db
        .collection("orders")
        .find({})
        .sort({ createdAt: -1 })
        .toArray(),

      db
        .collection("customers")
        .find({})
        .sort({ createdAt: -1 })
        .toArray()
        .catch(() => []),
    ]);

  const profile = buildCustomerProfile({
    routeKey,
    orders,
    registeredCustomers,
  });

  return JSON.parse(
    JSON.stringify(profile)
  );
}

function calculateCustomerMetrics(profile) {
  const orders = profile.orders || [];

  const completedStatuses = new Set([
    "delivered",
    "completed",
  ]);

  const deliveredOrders = orders.filter(
    (order) =>
      completedStatuses.has(
        getOrderStatus(order)
      )
  );

  const cancelledOrders = orders.filter(
    (order) =>
      getOrderStatus(order) ===
      "cancelled"
  );

  const activeOrders = orders.filter(
    (order) =>
      ![
        "delivered",
        "completed",
        "cancelled",
        "refunded",
      ].includes(getOrderStatus(order))
  );

  const grossOrderValue = orders.reduce(
    (total, order) =>
      total + getOrderTotal(order),
    0
  );

  const confirmedRevenue = orders.reduce(
    (total, order) =>
      isConfirmedRevenueOrder(order)
        ? total + getOrderTotal(order)
        : total,
    0
  );

  const eligibleOrders = orders.filter(
    (order) =>
      getOrderStatus(order) !==
      "cancelled"
  );

  const averageOrderValue =
    eligibleOrders.length > 0
      ? eligibleOrders.reduce(
          (total, order) =>
            total + getOrderTotal(order),
          0
        ) / eligibleOrders.length
      : 0;

  const chronologicalOrders = [...orders]
    .filter((order) =>
      getValidDate(order.createdAt)
    )
    .sort(
      (firstOrder, secondOrder) =>
        getTimestamp(firstOrder.createdAt) -
        getTimestamp(secondOrder.createdAt)
    );

  const firstOrder =
    chronologicalOrders[0] || null;

  const latestOrder =
    chronologicalOrders[
      chronologicalOrders.length - 1
    ] || null;

  let averagePurchaseIntervalDays = 0;

  if (chronologicalOrders.length > 1) {
    let totalIntervalMilliseconds = 0;

    for (
      let index = 1;
      index <
      chronologicalOrders.length;
      index += 1
    ) {
      totalIntervalMilliseconds +=
        getTimestamp(
          chronologicalOrders[index].createdAt
        ) -
        getTimestamp(
          chronologicalOrders[index - 1]
            .createdAt
        );
    }

    averagePurchaseIntervalDays =
      totalIntervalMilliseconds /
      (chronologicalOrders.length - 1) /
      (1000 * 60 * 60 * 24);
  }

  const latestOrderDate = getValidDate(
    latestOrder?.createdAt
  );

  const daysSinceLastPurchase =
    latestOrderDate
      ? Math.max(
          0,
          Math.floor(
            (Date.now() -
              latestOrderDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const deliveredRate =
    orders.length > 0
      ? (deliveredOrders.length /
          orders.length) *
        100
      : 0;

  const cancellationRate =
    orders.length > 0
      ? (cancelledOrders.length /
          orders.length) *
        100
      : 0;

  return {
    totalOrders: orders.length,
    deliveredOrders:
      deliveredOrders.length,
    cancelledOrders:
      cancelledOrders.length,
    activeOrders: activeOrders.length,
    grossOrderValue,
    confirmedRevenue,
    averageOrderValue,
    firstOrder,
    latestOrder,
    averagePurchaseIntervalDays,
    daysSinceLastPurchase,
    deliveredRate,
    cancellationRate,
  };
}

function buildProductInsights(orders) {
  const productMap = new Map();
  const categoryMap = new Map();

  orders.forEach((order) => {
    getOrderItems(order).forEach((item) => {
      const productKey =
        item.productId ||
        item.slug ||
        item.name.toLowerCase();

      const existingProduct =
        productMap.get(productKey) || {
          key: productKey,
          name: item.name,
          slug: item.slug,
          category: item.category,
          image: item.image,
          quantity: 0,
          orderCount: 0,
          revenue: 0,
        };

      existingProduct.quantity +=
        item.quantity;

      existingProduct.orderCount += 1;

      existingProduct.revenue +=
        item.lineTotal;

      if (!existingProduct.image) {
        existingProduct.image =
          item.image;
      }

      productMap.set(
        productKey,
        existingProduct
      );

      const categoryName =
        item.category || "Uncategorised";

      const existingCategory =
        categoryMap.get(categoryName) || {
          name: categoryName,
          quantity: 0,
          revenue: 0,
        };

      existingCategory.quantity +=
        item.quantity;

      existingCategory.revenue +=
        item.lineTotal;

      categoryMap.set(
        categoryName,
        existingCategory
      );
    });
  });

  const products = Array.from(
    productMap.values()
  ).sort(
    (firstProduct, secondProduct) =>
      secondProduct.quantity -
      firstProduct.quantity
  );

  const categories = Array.from(
    categoryMap.values()
  ).sort(
    (firstCategory, secondCategory) =>
      secondCategory.quantity -
      firstCategory.quantity
  );

  return {
    products,
    categories,
    favouriteProduct:
      products[0] || null,
    favouriteCategory:
      categories[0] || null,
  };
}

function getCustomerSegment(profile, metrics) {
  if (profile.isBlacklisted) {
    return {
      label: "Restricted",
      description:
        "This customer profile is currently marked as restricted.",
      className:
        "border-red-400/30 bg-red-400/10 text-red-300",
    };
  }

  if (
    profile.isVip ||
    metrics.confirmedRevenue >= 10000 ||
    metrics.totalOrders >= 5
  ) {
    return {
      label: "High Value",
      description:
        "A high-value customer with strong purchasing activity.",
      className:
        "border-amber-400/30 bg-amber-400/10 text-amber-300",
    };
  }

  if (metrics.totalOrders >= 2) {
    return {
      label: "Returning",
      description:
        "A repeat customer with more than one completed purchase journey.",
      className:
        "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    };
  }

  if (metrics.totalOrders === 1) {
    return {
      label: "New Customer",
      description:
        "A customer who has placed their first order.",
      className:
        "border-purple-400/30 bg-purple-400/10 text-purple-300",
    };
  }

  return {
    label: "Registered Lead",
    description:
      "A registered customer who has not placed an order yet.",
    className:
      "border-white/15 bg-white/[0.04] text-neutral-400",
  };
}

function getStatusClass(status) {
  const normalizedStatus =
    normalizeText(status).toLowerCase();

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

  if (
    normalizedStatus === "delivered" ||
    normalizedStatus === "completed" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "successful"
  ) {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "failed" ||
    normalizedStatus === "refunded"
  ) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/15 bg-white/[0.04] text-neutral-400";
}

function getCustomerInitials(name) {
  const words = normalizeText(name)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "CU";
  }

  return words
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

function getFullAddress(profile) {
  return [
    profile.address,
    profile.addressLine2,
    profile.area,
    profile.city,
    profile.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function MetricCard({
  label,
  value,
  note,
  valueClassName = "",
}) {
  return (
    <article className="bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.035]">
      <p className="text-xs uppercase tracking-[0.23em] text-neutral-600">
        {label}
      </p>

      <p
        className={`mt-4 break-words font-heading text-4xl font-light ${valueClassName}`}
      >
        {value}
      </p>

      {note ? (
        <p className="mt-3 text-xs leading-5 text-neutral-600">
          {note}
        </p>
      ) : null}
    </article>
  );
}

function InformationRow({
  label,
  value,
  valueClassName = "",
}) {
  return (
    <div className="grid gap-2 border-b border-white/10 py-4 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">
        {label}
      </p>

      <p
        className={`break-words text-sm leading-6 text-neutral-300 ${valueClassName}`}
      >
        {value || "Not available"}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}) {
  return (
    <div className="border border-dashed border-white/10 p-8 text-center">
      <p className="font-heading text-2xl font-light text-neutral-300">
        {title}
      </p>

      <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-neutral-600">
        {description}
      </p>
    </div>
  );
}

export default async function AdminCustomerDetailsPage({
  params,
}) {
  await requireAdminPermission({
    customers: ["read"],
  });

  const resolvedParams = await params;
  const routeKey = normalizeKey(
    resolvedParams?.id
  );

  const profile =
    await getCustomerProfile(routeKey);

  if (!profile) {
    notFound();
  }

  const metrics =
    calculateCustomerMetrics(profile);

  const productInsights =
    buildProductInsights(profile.orders);

  const customerSegment =
    getCustomerSegment(profile, metrics);

  const fullAddress =
    getFullAddress(profile);

  const recentProducts =
    productInsights.products.slice(0, 5);

  const recentOrders =
    profile.orders.slice(0, 20);

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] font-heading text-3xl font-light sm:h-24 sm:w-24">
                {getCustomerInitials(
                  profile.name
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-3 text-xs uppercase tracking-[0.4em] text-neutral-500">
                  Admin / Customers / Profile
                </p>

                <h1 className="break-words font-heading text-4xl font-light sm:text-5xl md:text-6xl">
                  {profile.name}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`border px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${
                      profile.isRegistered
                        ? "border-green-400/30 bg-green-400/10 text-green-300"
                        : "border-white/15 bg-white/[0.04] text-neutral-400"
                    }`}
                  >
                    {profile.isRegistered
                      ? "Registered"
                      : "Guest"}
                  </span>

                  <span
                    className={`border px-3 py-2 text-[10px] uppercase tracking-[0.16em] ${customerSegment.className}`}
                  >
                    {customerSegment.label}
                  </span>

                  {profile.isVip ? (
                    <span className="border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-amber-300">
                      VIP
                    </span>
                  ) : null}

                  {profile.fraudWarning ? (
                    <span className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-red-300">
                      Fraud Warning
                    </span>
                  ) : null}

                  {profile.isBlacklisted ? (
                    <span className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-red-300">
                      Blacklisted
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/customers"
                className="border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-neutral-300 transition duration-300 hover:border-white/40 hover:text-white"
              >
                Back to Customers
              </Link>

              {metrics.latestOrder ? (
                <Link
                  href={`/admin/orders/${encodeURIComponent(
                    getOrderIdentifier(
                      metrics.latestOrder
                    )
                  )}`}
                  className="border border-[#f1ece4] bg-[#f1ece4] px-5 py-3 text-xs uppercase tracking-[0.2em] text-[#0b0b0b] transition duration-300 hover:bg-transparent hover:text-[#f1ece4]"
                >
                  Latest Order
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Lifetime Orders"
            value={formatNumber(
              metrics.totalOrders
            )}
            note={`${metrics.activeOrders} active order${
              metrics.activeOrders === 1
                ? ""
                : "s"
            }`}
          />

          <MetricCard
            label="Confirmed Revenue"
            value={formatMoney(
              metrics.confirmedRevenue
            )}
            note="Paid and delivered COD orders"
            valueClassName="text-green-300"
          />

          <MetricCard
            label="Average Order Value"
            value={formatMoney(
              metrics.averageOrderValue
            )}
            note="Cancelled orders excluded"
            valueClassName="text-cyan-300"
          />

          <MetricCard
            label="Days Since Purchase"
            value={
              metrics.daysSinceLastPurchase ===
              null
                ? "N/A"
                : formatNumber(
                    metrics.daysSinceLastPurchase
                  )
            }
            note={
              metrics.latestOrder
                ? `Last order ${formatDate(
                    metrics.latestOrder
                      .createdAt
                  )}`
                : "No purchases recorded"
            }
            valueClassName="text-yellow-300"
          />
        </section>

        <section className="mb-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Delivered"
            value={metrics.deliveredOrders}
            note={`${metrics.deliveredRate.toFixed(
              1
            )}% delivery rate`}
          />

          <MetricCard
            label="Cancelled"
            value={metrics.cancelledOrders}
            note={`${metrics.cancellationRate.toFixed(
              1
            )}% cancellation rate`}
            valueClassName={
              metrics.cancelledOrders > 0
                ? "text-red-300"
                : ""
            }
          />

          <MetricCard
            label="Gross Value"
            value={formatMoney(
              metrics.grossOrderValue
            )}
            note="All recorded orders"
          />

          <MetricCard
            label="First Order"
            value={formatDate(
              metrics.firstOrder?.createdAt
            )}
            note="Customer acquisition date"
          />

          <MetricCard
            label="Latest Order"
            value={formatDate(
              metrics.latestOrder?.createdAt
            )}
            note="Most recent purchase"
          />

          <MetricCard
            label="Purchase Interval"
            value={
              metrics.averagePurchaseIntervalDays >
              0
                ? `${Math.round(
                    metrics.averagePurchaseIntervalDays
                  )} days`
                : "N/A"
            }
            note="Average time between orders"
          />
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <div className="space-y-8">
            <section className="border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Order History
                </p>

                <h2 className="mt-3 font-heading text-3xl font-light sm:text-4xl">
                  Customer Orders
                </h2>

                <p className="mt-3 text-xs leading-6 text-neutral-600">
                  Complete purchase, payment,
                  fulfilment and delivery history.
                </p>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-5 sm:p-6">
                  <EmptyState
                    title="No orders yet"
                    description="This customer has not placed an order."
                  />
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <div className="min-w-[940px]">
                      <div className="grid grid-cols-[1.05fr_0.9fr_0.8fr_0.9fr_0.9fr_0.55fr] border-b border-white/10 bg-white/[0.035] px-5 py-4 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                        <span>Order</span>
                        <span>Status</span>
                        <span>Payment</span>
                        <span>Courier</span>
                        <span>Total</span>
                        <span className="text-right">
                          Action
                        </span>
                      </div>

                      {recentOrders.map(
                        (order) => {
                          const orderId =
                            getOrderIdentifier(
                              order
                            );

                          const orderStatus =
                            getOrderStatus(
                              order
                            );

                          const paymentStatus =
                            getPaymentStatus(
                              order
                            );

                          return (
                            <article
                              key={orderId}
                              className="grid grid-cols-[1.05fr_0.9fr_0.8fr_0.9fr_0.9fr_0.55fr] items-center border-b border-white/10 px-5 py-5 text-sm last:border-b-0 hover:bg-white/[0.025]"
                            >
                              <div className="min-w-0 pr-4">
                                <p className="truncate text-[#f1ece4]">
                                  {orderId}
                                </p>

                                <p className="mt-1 text-xs text-neutral-600">
                                  {formatDateTime(
                                    order.createdAt
                                  )}
                                </p>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                                    orderStatus
                                  )}`}
                                >
                                  {formatLabel(
                                    orderStatus
                                  )}
                                </span>
                              </div>

                              <div>
                                <span
                                  className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                                    paymentStatus
                                  )}`}
                                >
                                  {formatLabel(
                                    paymentStatus
                                  )}
                                </span>

                                <p className="mt-2 text-[11px] text-neutral-600">
                                  {formatLabel(
                                    getPaymentMethod(
                                      order
                                    )
                                  )}
                                </p>
                              </div>

                              <div className="min-w-0 pr-4">
                                <p className="truncate text-xs text-neutral-300">
                                  {getCourierName(
                                    order
                                  ) ||
                                    "Not assigned"}
                                </p>

                                <p className="mt-1 truncate text-[11px] text-neutral-600">
                                  {getTrackingNumber(
                                    order
                                  ) ||
                                    "No tracking"}
                                </p>
                              </div>

                              <p className="text-[#f1ece4]">
                                {formatMoney(
                                  getOrderTotal(
                                    order
                                  )
                                )}
                              </p>

                              <div className="text-right">
                                <Link
                                  href={`/admin/orders/${encodeURIComponent(
                                    orderId
                                  )}`}
                                  className="inline-flex text-[11px] uppercase tracking-[0.18em] text-neutral-500 transition duration-300 hover:translate-x-1 hover:text-[#f1ece4]"
                                >
                                  View →
                                </Link>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 lg:hidden">
                    {recentOrders.map((order) => {
                      const orderId =
                        getOrderIdentifier(
                          order
                        );

                      const orderStatus =
                        getOrderStatus(order);

                      const paymentStatus =
                        getPaymentStatus(order);

                      return (
                        <article
                          key={orderId}
                          className="border border-white/10 bg-[#0e0e0e]"
                        >
                          <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start">
                            <div>
                              <p className="break-all text-sm text-[#f1ece4]">
                                {orderId}
                              </p>

                              <p className="mt-2 text-xs text-neutral-600">
                                {formatDateTime(
                                  order.createdAt
                                )}
                              </p>
                            </div>

                            <span
                              className={`w-fit border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                                orderStatus
                              )}`}
                            >
                              {formatLabel(
                                orderStatus
                              )}
                            </span>
                          </div>

                          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                                Payment
                              </p>

                              <p className="mt-2 text-sm">
                                {formatLabel(
                                  paymentStatus
                                )}
                              </p>

                              <p className="mt-1 text-xs text-neutral-600">
                                {formatLabel(
                                  getPaymentMethod(
                                    order
                                  )
                                )}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                                Total
                              </p>

                              <p className="mt-2 text-sm text-[#f1ece4]">
                                {formatMoney(
                                  getOrderTotal(
                                    order
                                  )
                                )}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                                Courier
                              </p>

                              <p className="mt-2 text-sm">
                                {getCourierName(
                                  order
                                ) ||
                                  "Not assigned"}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                                Tracking
                              </p>

                              <p className="mt-2 break-all text-sm">
                                {getTrackingNumber(
                                  order
                                ) ||
                                  "Not available"}
                              </p>
                            </div>
                          </div>

                          <div className="p-4">
                            <Link
                              href={`/admin/orders/${encodeURIComponent(
                                orderId
                              )}`}
                              className="flex w-full items-center justify-center border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
                            >
                              View Order Details
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <section className="border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Product Insights
                </p>

                <h2 className="mt-3 font-heading text-3xl font-light sm:text-4xl">
                  Purchasing Preferences
                </h2>
              </div>

              <div className="p-5 sm:p-6">
                {recentProducts.length === 0 ? (
                  <EmptyState
                    title="No product data"
                    description="Product preferences will appear after the customer places an order containing recognised products."
                  />
                ) : (
                  <div className="space-y-3">
                    {recentProducts.map(
                      (product, index) => (
                        <article
                          key={product.key}
                          className="grid gap-4 border border-white/10 p-4 transition duration-300 hover:bg-white/[0.025] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="flex h-12 w-12 items-center justify-center border border-white/10 bg-white/[0.04] font-heading text-lg text-neutral-500">
                            {String(
                              index + 1
                            ).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm text-[#f1ece4]">
                              {product.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-neutral-600">
                              {product.category}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-sm">
                              {product.quantity} item
                              {product.quantity === 1
                                ? ""
                                : "s"}
                            </p>

                            <p className="mt-1 text-xs text-neutral-600">
                              {formatMoney(
                                product.revenue
                              )}
                            </p>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Customer Overview
                </p>

                <h2 className="mt-3 font-heading text-3xl font-light">
                  Contact Profile
                </h2>
              </div>

              <div className="px-5 sm:px-6">
                <InformationRow
                  label="Full Name"
                  value={profile.name}
                />

                <InformationRow
                  label="Customer Key"
                  value={profile.customerKey}
                  valueClassName="break-all"
                />

                <InformationRow
                  label="Email"
                  value={profile.email}
                  valueClassName="break-all"
                />

                <InformationRow
                  label="Phone"
                  value={profile.phone}
                />

                <InformationRow
                  label="Address"
                  value={fullAddress}
                />

                <InformationRow
                  label="Account Type"
                  value={
                    profile.isRegistered
                      ? "Registered Customer"
                      : "Guest Customer"
                  }
                />

                <InformationRow
                  label="Account Status"
                  value={formatLabel(
                    profile.status
                  )}
                />

                <InformationRow
                  label="Registered"
                  value={formatDateTime(
                    profile.registeredAt
                  )}
                />

                <InformationRow
                  label="Last Login"
                  value={formatDateTime(
                    profile.lastLoginAt
                  )}
                />

                <InformationRow
                  label="Marketing"
                  value={
                    profile.marketingConsent ===
                    true
                      ? "Consent granted"
                      : profile.marketingConsent ===
                          false
                        ? "Consent declined"
                        : "Not recorded"
                  }
                />
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Customer Intelligence
                </p>

                <h2 className="mt-3 font-heading text-3xl font-light">
                  Segment & Behaviour
                </h2>
              </div>

              <div className="p-5 sm:p-6">
                <div
                  className={`border p-5 ${customerSegment.className}`}
                >
                  <p className="text-xs uppercase tracking-[0.2em]">
                    {customerSegment.label}
                  </p>

                  <p className="mt-3 text-xs leading-6 opacity-80">
                    {customerSegment.description}
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="border-b border-white/10 pb-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                      Favourite Product
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {productInsights
                        .favouriteProduct?.name ||
                        "Not enough data"}
                    </p>
                  </div>

                  <div className="border-b border-white/10 pb-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                      Favourite Category
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {productInsights
                        .favouriteCategory?.name ||
                        "Not enough data"}
                    </p>
                  </div>

                  <div className="border-b border-white/10 pb-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                      Repeat Purchase
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {metrics.totalOrders > 1
                        ? "Yes — returning customer"
                        : "Not yet"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                      Purchase Frequency
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {metrics.averagePurchaseIntervalDays >
                      0
                        ? `Approximately every ${Math.round(
                            metrics.averagePurchaseIntervalDays
                          )} days`
                        : "Not enough data"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Admin Profile
                </p>

                <h2 className="mt-3 font-heading text-3xl font-light">
                  Internal Records
                </h2>
              </div>

              <div className="px-5 sm:px-6">
                <InformationRow
                  label="VIP Status"
                  value={
                    profile.isVip
                      ? "VIP customer"
                      : "Standard customer"
                  }
                />

                <InformationRow
                  label="Blacklist"
                  value={
                    profile.isBlacklisted
                      ? "Blacklisted"
                      : "Not blacklisted"
                  }
                />

                <InformationRow
                  label="Fraud Warning"
                  value={
                    profile.fraudWarning
                      ? "Warning active"
                      : "No warning"
                  }
                />

                <InformationRow
                  label="Loyalty Points"
                  value={formatNumber(
                    profile.loyaltyPoints
                  )}
                />

                <InformationRow
                  label="Store Credit"
                  value={formatMoney(
                    profile.storeCredit
                  )}
                />

                <InformationRow
                  label="Tags"
                  value={
                    profile.tags.length > 0
                      ? profile.tags.join(", ")
                      : "No tags"
                  }
                />

                <InformationRow
                  label="Admin Notes"
                  value={
                    profile.notes ||
                    "No internal notes"
                  }
                />
              </div>
            </section>

            <section className="border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                Communications
              </p>

              <h2 className="mt-3 font-heading text-3xl font-light">
                Contact Channels
              </h2>

              <div className="mt-5 grid gap-3">
                {profile.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center justify-between border border-white/10 px-4 py-4 text-xs uppercase tracking-[0.18em] text-neutral-300 transition duration-300 hover:border-white/35 hover:text-white"
                  >
                    <span>Email Customer</span>
                    <span>↗</span>
                  </a>
                ) : null}

                {profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center justify-between border border-white/10 px-4 py-4 text-xs uppercase tracking-[0.18em] text-neutral-300 transition duration-300 hover:border-white/35 hover:text-white"
                  >
                    <span>Call Customer</span>
                    <span>↗</span>
                  </a>
                ) : null}

                {!profile.email &&
                !profile.phone ? (
                  <p className="border border-dashed border-white/10 p-5 text-xs leading-6 text-neutral-600">
                    No direct contact information is
                    available for this customer.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}