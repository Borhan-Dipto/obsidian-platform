import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import { requireAdminPermission } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

async function getCustomerData() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const [orders, registeredCustomers] = await Promise.all([
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

  return JSON.parse(
    JSON.stringify({
      orders,
      registeredCustomers,
    })
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeText(value).replace(/[^\d+]/g, "");
}

function getOrderTotal(order) {
  const directTotal = Number(order.total ?? order.grandTotal);

  if (Number.isFinite(directTotal)) {
    return directTotal;
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

  return Math.max(subtotal - discount + deliveryCharge, 0);
}

function getOrderStatus(order) {
  return normalizeText(order.status || "pending").toLowerCase();
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

function isRevenueOrder(order) {
  const orderStatus = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);

  const paymentMethod = normalizeText(
    getPaymentMethod(order)
  ).toLowerCase();

  if (
    orderStatus === "cancelled" ||
    paymentStatus === "failed" ||
    paymentStatus === "cancelled" ||
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

  const isCashOrder =
    paymentMethod.includes("cash") ||
    paymentMethod.includes("cod") ||
    paymentMethod.includes("delivery");

  return orderStatus === "delivered" && isCashOrder;
}

function getValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getCustomerFromOrder(order) {
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
  };
}

function getRegisteredCustomerData(customer) {
  const address =
    customer.address ||
    customer.defaultAddress ||
    customer.shippingAddress ||
    {};

  return {
    id: String(customer._id || ""),

    name:
      customer.fullName ||
      customer.name ||
      `${customer.firstName || ""} ${
        customer.lastName || ""
      }`.trim() ||
      "Unknown Customer",

    email: customer.email || "",

    phone:
      customer.phone ||
      customer.mobile ||
      "",

    address:
      typeof address === "string"
        ? address
        : address.address ||
          address.addressLine1 ||
          "",

    area:
      typeof address === "object"
        ? address.area || ""
        : "",

    city:
      typeof address === "object"
        ? address.city || ""
        : "",

    createdAt: customer.createdAt || null,

    lastLoginAt:
      customer.lastLoginAt ||
      customer.lastSeenAt ||
      null,

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

  const normalizedName = normalizeText(
    customer.name
  ).toLowerCase();

  return `fallback:${normalizedName}:${fallbackValue}`;
}

function buildCustomerRecords(
  orders,
  registeredCustomers
) {
  const customersMap = new Map();

  registeredCustomers.forEach((customer, index) => {
    const customerData =
      getRegisteredCustomerData(customer);

    const key = createCustomerKey(
      customerData,
      customerData.id || `registered-${index}`
    );

    customersMap.set(key, {
      key,
      id: customerData.id,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      area: customerData.area,
      city: customerData.city,
      isRegistered: true,
      registeredAt: customerData.createdAt,
      lastLoginAt: customerData.lastLoginAt,
      firstOrderAt: null,
      lastOrderAt: null,
      orderCount: 0,
      deliveredOrderCount: 0,
      cancelledOrderCount: 0,
      totalOrderValue: 0,
      confirmedRevenue: 0,
      lastOrderId: "",
      lastOrderStatus: "",
    });
  });

  orders.forEach((order, index) => {
    const customerData = getCustomerFromOrder(order);

    const key = createCustomerKey(
      customerData,
      order.orderId ||
        order.trackingId ||
        String(order._id || "") ||
        `order-${index}`
    );

    let customerRecord = customersMap.get(key);

    if (!customerRecord) {
      customerRecord = {
        key,
        id: "",
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        area: customerData.area,
        city: customerData.city,
        isRegistered: false,
        registeredAt: null,
        lastLoginAt: null,
        firstOrderAt: null,
        lastOrderAt: null,
        orderCount: 0,
        deliveredOrderCount: 0,
        cancelledOrderCount: 0,
        totalOrderValue: 0,
        confirmedRevenue: 0,
        lastOrderId: "",
        lastOrderStatus: "",
      };

      customersMap.set(key, customerRecord);
    }

    if (
      !customerRecord.name ||
      customerRecord.name === "Unknown Customer"
    ) {
      customerRecord.name = customerData.name;
    }

    if (!customerRecord.email) {
      customerRecord.email = customerData.email;
    }

    if (!customerRecord.phone) {
      customerRecord.phone = customerData.phone;
    }

    if (!customerRecord.address) {
      customerRecord.address = customerData.address;
    }

    if (!customerRecord.area) {
      customerRecord.area = customerData.area;
    }

    if (!customerRecord.city) {
      customerRecord.city = customerData.city;
    }

    const orderDate = getValidDate(order.createdAt);
    const orderTotal = getOrderTotal(order);
    const orderStatus = getOrderStatus(order);

    customerRecord.orderCount += 1;
    customerRecord.totalOrderValue += orderTotal;

    if (isRevenueOrder(order)) {
      customerRecord.confirmedRevenue += orderTotal;
    }

    if (orderStatus === "delivered") {
      customerRecord.deliveredOrderCount += 1;
    }

    if (orderStatus === "cancelled") {
      customerRecord.cancelledOrderCount += 1;
    }

    if (orderDate) {
      const currentFirstOrderDate = getValidDate(
        customerRecord.firstOrderAt
      );

      const currentLastOrderDate = getValidDate(
        customerRecord.lastOrderAt
      );

      if (
        !currentFirstOrderDate ||
        orderDate < currentFirstOrderDate
      ) {
        customerRecord.firstOrderAt =
          orderDate.toISOString();
      }

      if (
        !currentLastOrderDate ||
        orderDate > currentLastOrderDate
      ) {
        customerRecord.lastOrderAt =
          orderDate.toISOString();

        customerRecord.lastOrderId =
          order.orderId ||
          order.trackingId ||
          String(order._id || "");

        customerRecord.lastOrderStatus =
          orderStatus;
      }
    }
  });

  return Array.from(customersMap.values());
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "৳ 0";
  }

  return `৳ ${amount.toLocaleString("en-BD")}`;
}

function formatDate(value) {
  const date = getValidDate(value);

  if (!date) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function getCustomerLocation(customer) {
  return [
    customer.address,
    customer.area,
    customer.city,
  ]
    .filter(Boolean)
    .join(", ");
}

function getCustomerType(customer) {
  return customer.isRegistered
    ? "registered"
    : "guest";
}

function getCustomerTypeClass(type) {
  if (type === "registered") {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  return "border-white/15 bg-white/[0.04] text-neutral-400";
}

function getStatusClass(status) {
  const normalizedStatus = normalizeText(
    status
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

  return "border-white/15 bg-white/[0.04] text-neutral-400";
}

function matchesSearch(customer, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  const searchableText = [
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    customer.area,
    customer.city,
    customer.lastOrderId,
    customer.lastOrderStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(searchTerm);
}

function sortCustomers(customers, sortOrder) {
  return [...customers].sort(
    (firstCustomer, secondCustomer) => {
      if (sortOrder === "oldest") {
        const firstDate =
          getValidDate(firstCustomer.firstOrderAt)
            ?.getTime() || 0;

        const secondDate =
          getValidDate(secondCustomer.firstOrderAt)
            ?.getTime() || 0;

        return firstDate - secondDate;
      }

      if (sortOrder === "highest-spend") {
        return (
          secondCustomer.confirmedRevenue -
          firstCustomer.confirmedRevenue
        );
      }

      if (sortOrder === "most-orders") {
        return (
          secondCustomer.orderCount -
          firstCustomer.orderCount
        );
      }

      if (sortOrder === "name") {
        return String(
          firstCustomer.name || ""
        ).localeCompare(
          String(secondCustomer.name || "")
        );
      }

      const firstDate =
        getValidDate(firstCustomer.lastOrderAt)
          ?.getTime() || 0;

      const secondDate =
        getValidDate(secondCustomer.lastOrderAt)
          ?.getTime() || 0;

      return secondDate - firstDate;
    }
  );
}

function createPageLink({
  page,
  search,
  customerType,
  sort,
  pageSize,
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (customerType !== "all") {
    params.set("type", customerType);
  }

  if (sort !== "recent") {
    params.set("sort", sort);
  }

  if (pageSize !== 20) {
    params.set("pageSize", String(pageSize));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/customers?${query}`
    : "/admin/customers";
}

function getCustomerProfileHref(customer) {
  return `/admin/customers/${encodeURIComponent(
    customer.key
  )}`;
}

function MetricCard({
  label,
  value,
  note,
  valueClassName = "",
}) {
  return (
    <article className="bg-[#0e0e0e] p-6 transition duration-500 hover:bg-white/[0.035]">
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-600">
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

export default async function AdminCustomersPage({
  searchParams,
}) {
  await requireAdminPermission({
    customers: ["read"],
  });

  const resolvedSearchParams =
    (await searchParams) || {};

  const search = normalizeText(
    resolvedSearchParams.search
  ).toLowerCase();

  const customerType = [
    "all",
    "registered",
    "guest",
  ].includes(resolvedSearchParams.type)
    ? resolvedSearchParams.type
    : "all";

  const sortOrder = [
    "recent",
    "oldest",
    "highest-spend",
    "most-orders",
    "name",
  ].includes(resolvedSearchParams.sort)
    ? resolvedSearchParams.sort
    : "recent";

  const requestedPageSize = Number(
    resolvedSearchParams.pageSize
  );

  const pageSize = PAGE_SIZE_OPTIONS.includes(
    requestedPageSize
  )
    ? requestedPageSize
    : 20;

  const requestedPage = Number(
    resolvedSearchParams.page
  );

  const currentPage =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const { orders, registeredCustomers } =
    await getCustomerData();

  const customers = buildCustomerRecords(
    orders,
    registeredCustomers
  );

  const filteredCustomers = sortCustomers(
    customers.filter((customer) => {
      const typeMatches =
        customerType === "all" ||
        getCustomerType(customer) === customerType;

      return (
        typeMatches &&
        matchesSearch(customer, search)
      );
    }),
    sortOrder
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * pageSize;

  const paginatedCustomers =
    filteredCustomers.slice(
      startIndex,
      startIndex + pageSize
    );

  const firstVisibleCustomer =
    filteredCustomers.length === 0
      ? 0
      : startIndex + 1;

  const lastVisibleCustomer = Math.min(
    startIndex + pageSize,
    filteredCustomers.length
  );

  const registeredCount = customers.filter(
    (customer) => customer.isRegistered
  ).length;

  const guestCount =
    customers.length - registeredCount;

  const repeatCustomerCount = customers.filter(
    (customer) => customer.orderCount > 1
  ).length;

  const totalConfirmedRevenue = customers.reduce(
    (total, customer) =>
      total + customer.confirmedRevenue,
    0
  );

  const averageCustomerValue =
    customers.length > 0
      ? totalConfirmedRevenue / customers.length
      : 0;

  const filtersAreActive =
    search !== "" ||
    customerType !== "all" ||
    sortOrder !== "recent" ||
    pageSize !== 20;

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
                Admin / Customers
              </p>

              <h1 className="font-heading text-5xl font-light md:text-7xl">
                Customers
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
                Review registered and guest customers,
                understand purchasing activity and monitor
                customer value from one operational workspace.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {customers.length}{" "}
                {customers.length === 1
                  ? "Customer"
                  : "Customers"}
              </p>

              <Link
                href="/admin"
                className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {customers.length === 0 ? (
          <section className="border border-white/10 bg-white/[0.025] p-10 sm:p-14">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
              Customer Management
            </p>

            <h2 className="font-heading text-4xl font-light sm:text-5xl">
              No customers yet
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400">
              Customers will appear here after account
              registration or checkout. Their order history
              and purchasing activity will be combined into
              one customer record.
            </p>

            <Link
              href="/admin"
              className="mt-8 inline-flex border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.25em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Return to Dashboard
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-8 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Customers"
                value={customers.length}
                note="Registered and guest customers"
              />

              <MetricCard
                label="Registered"
                value={registeredCount}
                note={`${guestCount} guest customers`}
                valueClassName="text-green-300"
              />

              <MetricCard
                label="Repeat Customers"
                value={repeatCustomerCount}
                note="Customers with multiple orders"
                valueClassName="text-cyan-300"
              />

              <MetricCard
                label="Average Customer Value"
                value={formatMoney(
                  averageCustomerValue
                )}
                note="Based on confirmed revenue"
                valueClassName="text-yellow-300"
              />
            </section>

            <section className="mb-5 overflow-hidden border border-white/10 bg-white/[0.025]">
              <form
                action="/admin/customers"
                method="get"
                className="grid gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
              >
                <div className="bg-[#0e0e0e] p-5 md:col-span-2 xl:col-span-1">
                  <label
                    htmlFor="customer-search"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                  >
                    Search Customers
                  </label>

                  <input
                    id="customer-search"
                    name="search"
                    type="search"
                    defaultValue={
                      resolvedSearchParams.search || ""
                    }
                    placeholder="Name, email, phone, address or order ID"
                    className="w-full border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition duration-300 placeholder:text-neutral-600 focus:border-white/30"
                  />
                </div>

                <div className="bg-[#0e0e0e] p-5">
                  <label
                    htmlFor="customer-type"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                  >
                    Customer Type
                  </label>

                  <select
                    id="customer-type"
                    name="type"
                    defaultValue={customerType}
                    className="w-full min-w-44 border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition duration-300 focus:border-white/30"
                  >
                    <option value="all">
                      All Customers
                    </option>

                    <option value="registered">
                      Registered
                    </option>

                    <option value="guest">
                      Guest
                    </option>
                  </select>
                </div>

                <div className="bg-[#0e0e0e] p-5">
                  <label
                    htmlFor="customer-sort"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                  >
                    Sort By
                  </label>

                  <select
                    id="customer-sort"
                    name="sort"
                    defaultValue={sortOrder}
                    className="w-full min-w-44 border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition duration-300 focus:border-white/30"
                  >
                    <option value="recent">
                      Recent Activity
                    </option>

                    <option value="oldest">
                      Oldest Customer
                    </option>

                    <option value="highest-spend">
                      Highest Spend
                    </option>

                    <option value="most-orders">
                      Most Orders
                    </option>

                    <option value="name">
                      Name A–Z
                    </option>
                  </select>
                </div>

                <div className="bg-[#0e0e0e] p-5">
                  <label
                    htmlFor="customer-page-size"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                  >
                    Per Page
                  </label>

                  <select
                    id="customer-page-size"
                    name="pageSize"
                    defaultValue={pageSize}
                    className="w-full min-w-36 border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition duration-300 focus:border-white/30"
                  >
                    {PAGE_SIZE_OPTIONS.map(
                      (size) => (
                        <option
                          key={size}
                          value={size}
                        >
                          {size} Customers
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-end gap-2 bg-[#0e0e0e] p-5">
                  <button
                    type="submit"
                    className="h-[46px] border border-[#f1ece4] bg-[#f1ece4] px-5 text-xs uppercase tracking-[0.2em] text-[#0b0b0b] transition duration-300 hover:bg-transparent hover:text-[#f1ece4]"
                  >
                    Apply
                  </button>

                  {filtersAreActive ? (
                    <Link
                      href="/admin/customers"
                      className="flex h-[46px] items-center border border-white/15 px-5 text-xs uppercase tracking-[0.2em] text-neutral-400 transition duration-300 hover:border-white/35 hover:text-[#f1ece4]"
                    >
                      Reset
                    </Link>
                  ) : null}
                </div>
              </form>

              <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {filteredCustomers.length}{" "}
                  {filteredCustomers.length === 1
                    ? "Result"
                    : "Results"}
                </p>

                <p className="text-xs text-neutral-600">
                  Confirmed customer revenue:{" "}
                  {formatMoney(
                    totalConfirmedRevenue
                  )}
                </p>
              </div>
            </section>

            {filteredCustomers.length === 0 ? (
              <section className="border border-white/10 bg-white/[0.025] p-10 text-center sm:p-14">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  Customer Search
                </p>

                <h2 className="font-heading text-4xl font-light sm:text-5xl">
                  No matching customers
                </h2>

                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-400">
                  No customer records match the selected
                  search and filter settings.
                </p>

                <Link
                  href="/admin/customers"
                  className="mt-7 inline-flex border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.25em] transition duration-300 hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
                >
                  Show All Customers
                </Link>
              </section>
            ) : (
              <>
                <section className="hidden overflow-x-auto border border-white/10 lg:block">
                  <div className="min-w-[1240px]">
                    <div className="grid grid-cols-[1.35fr_1.15fr_0.75fr_0.65fr_0.85fr_0.85fr_0.75fr_0.9fr] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      <span>Customer</span>
                      <span>Contact</span>
                      <span>Type</span>
                      <span>Orders</span>
                      <span>Revenue</span>
                      <span>Last Order</span>
                      <span>Status</span>
                      <span className="text-right">
                        Actions
                      </span>
                    </div>

                    {paginatedCustomers.map(
                      (customer) => {
                        const customerLocation =
                          getCustomerLocation(
                            customer
                          );

                        const customerTypeValue =
                          getCustomerType(customer);

                        const profileHref =
                          getCustomerProfileHref(
                            customer
                          );

                        return (
                          <article
                            key={customer.key}
                            className="grid grid-cols-[1.35fr_1.15fr_0.75fr_0.65fr_0.85fr_0.85fr_0.75fr_0.9fr] items-center border-b border-white/10 px-5 py-5 text-sm text-neutral-300 transition duration-300 last:border-b-0 hover:bg-white/[0.03]"
                          >
                            <div className="min-w-0 pr-4">
                              <Link
                                href={profileHref}
                                className="block truncate text-[#f1ece4] transition duration-300 hover:text-white"
                              >
                                {customer.name}
                              </Link>

                              <p className="mt-1 truncate text-xs text-neutral-600">
                                {customerLocation ||
                                  "No address"}
                              </p>
                            </div>

                            <div className="min-w-0 pr-4">
                              <p className="truncate text-xs">
                                {customer.email ||
                                  "No email"}
                              </p>

                              <p className="mt-1 truncate text-xs text-neutral-600">
                                {customer.phone ||
                                  "No phone"}
                              </p>
                            </div>

                            <div>
                              <span
                                className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getCustomerTypeClass(
                                  customerTypeValue
                                )}`}
                              >
                                {formatLabel(
                                  customerTypeValue
                                )}
                              </span>
                            </div>

                            <div>
                              <p className="text-[#f1ece4]">
                                {customer.orderCount}
                              </p>

                              <p className="mt-1 text-[11px] text-neutral-600">
                                {
                                  customer.deliveredOrderCount
                                }{" "}
                                delivered
                              </p>
                            </div>

                            <div>
                              <p className="text-[#f1ece4]">
                                {formatMoney(
                                  customer.confirmedRevenue
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-neutral-600">
                                {formatMoney(
                                  customer.totalOrderValue
                                )}{" "}
                                gross
                              </p>
                            </div>

                            <div>
                              <p className="text-xs">
                                {formatDate(
                                  customer.lastOrderAt
                                )}
                              </p>

                              <p className="mt-1 truncate text-[11px] text-neutral-600">
                                {customer.lastOrderId ||
                                  "No orders"}
                              </p>
                            </div>

                            <div>
                              {customer.lastOrderStatus ? (
                                <span
                                  className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                                    customer.lastOrderStatus
                                  )}`}
                                >
                                  {formatLabel(
                                    customer.lastOrderStatus
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-600">
                                  No order
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 text-right">
                              <Link
                                href={profileHref}
                                className="inline-flex text-[10px] uppercase tracking-[0.18em] text-[#f1ece4] transition duration-300 hover:translate-x-1"
                              >
                                View Profile →
                              </Link>

                              {customer.lastOrderId ? (
                                <Link
                                  href={`/admin/orders/${encodeURIComponent(
                                    customer.lastOrderId
                                  )}`}
                                  className="inline-flex text-[10px] uppercase tracking-[0.16em] text-neutral-600 transition duration-300 hover:text-neutral-300"
                                >
                                  Latest Order
                                </Link>
                              ) : null}
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                </section>

                <section className="space-y-4 lg:hidden">
                  {paginatedCustomers.map(
                    (customer) => {
                      const customerLocation =
                        getCustomerLocation(customer);

                      const customerTypeValue =
                        getCustomerType(customer);

                      const profileHref =
                        getCustomerProfileHref(
                          customer
                        );

                      return (
                        <article
                          key={customer.key}
                          className="overflow-hidden border border-white/10 bg-white/[0.025]"
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Customer
                              </p>

                              <Link
                                href={profileHref}
                                className="mt-2 block break-words text-sm text-[#f1ece4] transition duration-300 hover:text-white"
                              >
                                {customer.name}
                              </Link>

                              <p className="mt-1 break-words text-xs text-neutral-600">
                                {customerLocation ||
                                  "No address"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getCustomerTypeClass(
                                customerTypeValue
                              )}`}
                            >
                              {formatLabel(
                                customerTypeValue
                              )}
                            </span>
                          </div>

                          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Email
                              </p>

                              <p className="mt-2 break-all text-sm">
                                {customer.email ||
                                  "No email"}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Phone
                              </p>

                              <p className="mt-2 break-all text-sm">
                                {customer.phone ||
                                  "No phone"}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Orders
                              </p>

                              <p className="mt-2 text-sm">
                                {customer.orderCount}
                              </p>

                              <p className="mt-1 text-xs text-neutral-600">
                                {
                                  customer.deliveredOrderCount
                                }{" "}
                                delivered
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Revenue
                              </p>

                              <p className="mt-2 text-sm text-green-300">
                                {formatMoney(
                                  customer.confirmedRevenue
                                )}
                              </p>

                              <p className="mt-1 text-xs text-neutral-600">
                                {formatMoney(
                                  customer.totalOrderValue
                                )}{" "}
                                gross
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Last Order
                              </p>

                              <p className="mt-2 text-sm">
                                {formatDate(
                                  customer.lastOrderAt
                                )}
                              </p>

                              <p className="mt-1 break-all text-xs text-neutral-600">
                                {customer.lastOrderId ||
                                  "No orders"}
                              </p>
                            </div>

                            <div className="bg-[#0e0e0e] p-5">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                                Last Status
                              </p>

                              {customer.lastOrderStatus ? (
                                <span
                                  className={`mt-2 inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                                    customer.lastOrderStatus
                                  )}`}
                                >
                                  {formatLabel(
                                    customer.lastOrderStatus
                                  )}
                                </span>
                              ) : (
                                <p className="mt-2 text-sm text-neutral-600">
                                  No order
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-3 p-4 sm:grid-cols-2">
                            <Link
                              href={profileHref}
                              className="flex w-full items-center justify-center border border-[#f1ece4] bg-[#f1ece4] px-5 py-3 text-xs uppercase tracking-[0.2em] text-[#0b0b0b] transition duration-300 hover:bg-transparent hover:text-[#f1ece4]"
                            >
                              View Profile
                            </Link>

                            {customer.lastOrderId ? (
                              <Link
                                href={`/admin/orders/${encodeURIComponent(
                                  customer.lastOrderId
                                )}`}
                                className="flex w-full items-center justify-center border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-neutral-300 transition duration-300 hover:border-white/40 hover:text-[#f1ece4]"
                              >
                                Latest Order
                              </Link>
                            ) : (
                              <span className="flex w-full cursor-not-allowed items-center justify-center border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-neutral-700">
                                No Orders Yet
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    }
                  )}
                </section>

                <nav
                  aria-label="Customer pagination"
                  className="mt-5 flex flex-col justify-between gap-5 border border-white/10 bg-white/[0.025] px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Showing {firstVisibleCustomer}–
                    {lastVisibleCustomer} of{" "}
                    {filteredCustomers.length}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {safeCurrentPage > 1 ? (
                      <Link
                        href={createPageLink({
                          page: safeCurrentPage - 1,
                          search:
                            resolvedSearchParams.search ||
                            "",
                          customerType,
                          sort: sortOrder,
                          pageSize,
                        })}
                        className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300 transition duration-300 hover:border-white/30"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-700">
                        Previous
                      </span>
                    )}

                    <span className="border border-[#f1ece4] bg-[#f1ece4] px-4 py-2 text-xs text-[#0b0b0b]">
                      {safeCurrentPage} / {totalPages}
                    </span>

                    {safeCurrentPage < totalPages ? (
                      <Link
                        href={createPageLink({
                          page: safeCurrentPage + 1,
                          search:
                            resolvedSearchParams.search ||
                            "",
                          customerType,
                          sort: sortOrder,
                          pageSize,
                        })}
                        className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300 transition duration-300 hover:border-white/30"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-700">
                        Next
                      </span>
                    )}
                  </div>
                </nav>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}