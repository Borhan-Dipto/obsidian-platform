"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const statusOptions = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const pageSizeOptions = [10, 20, 50];

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
  if (!value) {
    return "N/A";
  }

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

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

  return "border-white/15 bg-white/[0.05] text-neutral-300";
}

function getPaymentStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

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

  return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
}

function getOrderTotal(order) {
  const total = Number(order.total ?? order.grandTotal);

  return Number.isFinite(total) ? total : 0;
}

function getOrderTimestamp(order) {
  const date = new Date(order.createdAt || 0);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
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
  const existingStatus =
    order.paymentStatus ||
    order.payment?.status ||
    order.transactionStatus;

  if (existingStatus) {
    return existingStatus;
  }

  const method = String(getPaymentMethod(order)).toLowerCase();

  if (
    method.includes("cash") ||
    method.includes("cod") ||
    method.includes("delivery")
  ) {
    return "pending";
  }

  return "unknown";
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

function getItemQuantity(order) {
  if (!Array.isArray(order.items)) {
    return 0;
  }

  return order.items.reduce((total, item) => {
    const quantity = Number(item.quantity);

    return total + (Number.isFinite(quantity) ? quantity : 1);
  }, 0);
}

function matchesSearch(order, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  const customer = order.customer || {};

  const searchableText = [
    order.orderId,
    customer.fullName,
    customer.phone,
    customer.email,
    customer.address,
    customer.area,
    customer.city,
    order.status,
    getPaymentMethod(order),
    getPaymentStatus(order),
    getCouponCode(order),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(searchTerm);
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ];
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "");

  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

function createCsvContent(orders) {
  const headers = [
    "Order ID",
    "Customer Name",
    "Phone",
    "Email",
    "Items",
    "Order Total",
    "Order Status",
    "Payment Method",
    "Payment Status",
    "Coupon",
    "Created At",
  ];

  const rows = orders.map((order) => [
    order.orderId || "",
    order.customer?.fullName || "",
    order.customer?.phone || "",
    order.customer?.email || "",
    getItemQuantity(order),
    getOrderTotal(order),
    formatLabel(order.status || "pending"),
    formatLabel(getPaymentMethod(order)),
    formatLabel(getPaymentStatus(order)),
    getCouponCode(order) || "",
    formatDateTime(order.createdAt),
  ]);

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

export default function OrdersManagementTable({ orders = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (counts, order) => {
        const status = String(order.status || "pending").toLowerCase();

        counts.all += 1;
        counts[status] = (counts[status] || 0) + 1;

        return counts;
      },
      {
        all: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        packed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const orderStatus = String(
          order.status || "pending"
        ).toLowerCase();

        const statusMatches =
          statusFilter === "all" || orderStatus === statusFilter;

        return statusMatches && matchesSearch(order, normalizedSearch);
      })
      .sort((firstOrder, secondOrder) => {
        const firstTimestamp = getOrderTimestamp(firstOrder);
        const secondTimestamp = getOrderTimestamp(secondOrder);

        if (sortOrder === "oldest") {
          return firstTimestamp - secondTimestamp;
        }

        if (sortOrder === "highest") {
          return getOrderTotal(secondOrder) - getOrderTotal(firstOrder);
        }

        if (sortOrder === "lowest") {
          return getOrderTotal(firstOrder) - getOrderTotal(secondOrder);
        }

        return secondTimestamp - firstTimestamp;
      });
  }, [orders, search, statusFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, pageSize, safeCurrentPage]);

  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages);

  const firstVisibleOrder =
    filteredOrders.length === 0
      ? 0
      : (safeCurrentPage - 1) * pageSize + 1;

  const lastVisibleOrder = Math.min(
    safeCurrentPage * pageSize,
    filteredOrders.length
  );

  const filtersAreActive =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    sortOrder !== "newest";

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(status) {
    setStatusFilter(status);
    setCurrentPage(1);
  }

  function handleSortChange(event) {
    setSortOrder(event.target.value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  }

  function exportOrders() {
    if (filteredOrders.length === 0) {
      return;
    }

    const csvContent = createCsvContent(filteredOrders);
    const csvBlob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const downloadUrl = URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");
    const currentDate = new Date().toISOString().slice(0, 10);

    downloadLink.href = downloadUrl;
    downloadLink.download = `obsidian-orders-${currentDate}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(downloadUrl);
  }

  function printOrders() {
    window.print();
  }

  return (
    <section className="space-y-5">
      <div className="border border-white/10 bg-white/[0.025] print:hidden">
        <div className="grid gap-px bg-white/10 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="bg-[#0e0e0e] p-5">
            <label
              htmlFor="order-search"
              className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
            >
              Search Orders
            </label>

            <input
              id="order-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Order ID, customer, phone, email or coupon"
              className="w-full border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition placeholder:text-neutral-600 focus:border-white/30"
            />
          </div>

          <div className="bg-[#0e0e0e] p-5">
            <label
              htmlFor="order-sort"
              className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
            >
              Sort By
            </label>

            <select
              id="order-sort"
              value={sortOrder}
              onChange={handleSortChange}
              className="w-full min-w-48 border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/30"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Total</option>
              <option value="lowest">Lowest Total</option>
            </select>
          </div>

          <div className="bg-[#0e0e0e] p-5">
            <label
              htmlFor="order-page-size"
              className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-500"
            >
              Per Page
            </label>

            <select
              id="order-page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full min-w-32 border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-[#f1ece4] outline-none transition focus:border-white/30"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} Orders
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 bg-[#0e0e0e] p-5">
            <button
              type="button"
              onClick={exportOrders}
              disabled={filteredOrders.length === 0}
              className="h-[46px] border border-white/15 px-4 text-xs uppercase tracking-[0.18em] text-neutral-300 transition hover:border-white/40 hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={printOrders}
              disabled={filteredOrders.length === 0}
              className="h-[46px] border border-white/15 px-4 text-xs uppercase tracking-[0.18em] text-neutral-300 transition hover:border-white/40 hover:text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Print
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {statusOptions.map((status) => {
                const isActive = statusFilter === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`shrink-0 border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
                      isActive
                        ? "border-[#f1ece4] bg-[#f1ece4] text-[#0b0b0b]"
                        : "border-white/10 text-neutral-400 hover:border-white/30 hover:text-[#f1ece4]"
                    }`}
                  >
                    {formatLabel(status)} ({statusCounts[status] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "Result" : "Results"}
            </p>

            {filtersAreActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="w-fit text-xs uppercase tracking-[0.18em] text-neutral-400 underline decoration-white/20 underline-offset-4 transition hover:text-[#f1ece4]"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border border-white/10 bg-white/[0.025] p-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-neutral-500">
            Order Search
          </p>

          <h2 className="font-heading text-4xl font-light">
            No matching orders
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-400">
            No orders match your current search and filter settings.
          </p>

          {filtersAreActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-7 border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Show All Orders
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-white/10 lg:block">
            <div className="min-w-[1180px]">
              <div className="grid grid-cols-[1.15fr_1.35fr_0.9fr_0.8fr_0.95fr_0.9fr_0.8fr_0.75fr_0.45fr] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                <span>Order ID</span>
                <span>Customer</span>
                <span>Phone</span>
                <span>Total</span>
                <span>Order Status</span>
                <span>Payment</span>
                <span>Payment Status</span>
                <span>Date</span>
                <span className="text-right">Action</span>
              </div>

              {paginatedOrders.map((order, index) => {
                const orderKey =
                  order._id ||
                  order.orderId ||
                  `${order.createdAt || "order"}-${index}`;

                const couponCode = getCouponCode(order);
                const paymentMethod = getPaymentMethod(order);
                const paymentStatus = getPaymentStatus(order);

                return (
                  <article
                    key={orderKey}
                    className="grid grid-cols-[1.15fr_1.35fr_0.9fr_0.8fr_0.95fr_0.9fr_0.8fr_0.75fr_0.45fr] items-center border-b border-white/10 px-5 py-5 text-sm text-neutral-300 transition last:border-b-0 hover:bg-white/[0.035]"
                  >
                    <div className="min-w-0">
                      <p className="break-all text-[#f1ece4]">
                        {order.orderId || "N/A"}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-600">
                        {getItemQuantity(order)}{" "}
                        {getItemQuantity(order) === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="min-w-0 pr-4">
                      <p className="truncate">
                        {order.customer?.fullName || "Unknown"}
                      </p>

                      <p className="mt-1 truncate text-xs text-neutral-600">
                        {order.customer?.email || "No email"}
                      </p>
                    </div>

                    <p className="break-all">
                      {order.customer?.phone || "N/A"}
                    </p>

                    <div>
                      <p className="text-[#f1ece4]">
                        {formatMoney(getOrderTotal(order))}
                      </p>

                      {couponCode ? (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-green-300">
                          Coupon: {couponCode}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <span
                        className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {formatLabel(order.status || "pending")}
                      </span>
                    </div>

                    <p className="pr-3 text-xs leading-5">
                      {formatLabel(paymentMethod)}
                    </p>

                    <div>
                      <span
                        className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getPaymentStatusClass(
                          paymentStatus
                        )}`}
                      >
                        {formatLabel(paymentStatus)}
                      </span>
                    </div>

                    <p className="text-xs">
                      {formatDate(order.createdAt)}
                    </p>

                    <div className="text-right">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(
                          order.orderId
                        )}`}
                        className="inline-flex text-[11px] uppercase tracking-[0.18em] text-neutral-500 transition hover:text-[#f1ece4]"
                      >
                        View →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 lg:hidden">
            {paginatedOrders.map((order, index) => {
              const orderKey =
                order._id ||
                order.orderId ||
                `${order.createdAt || "order"}-${index}`;

              const couponCode = getCouponCode(order);
              const paymentMethod = getPaymentMethod(order);
              const paymentStatus = getPaymentStatus(order);

              return (
                <article
                  key={orderKey}
                  className="border border-white/10 bg-white/[0.025]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Order ID
                      </p>

                      <p className="mt-2 break-all text-sm text-[#f1ece4]">
                        {order.orderId || "N/A"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {formatLabel(order.status || "pending")}
                    </span>
                  </div>

                  <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Customer
                      </p>

                      <p className="mt-2 text-sm">
                        {order.customer?.fullName || "Unknown"}
                      </p>

                      <p className="mt-1 break-all text-xs text-neutral-600">
                        {order.customer?.email || "No email"}
                      </p>
                    </div>

                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Phone
                      </p>

                      <p className="mt-2 break-all text-sm">
                        {order.customer?.phone || "N/A"}
                      </p>
                    </div>

                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Total
                      </p>

                      <p className="mt-2 text-sm text-[#f1ece4]">
                        {formatMoney(getOrderTotal(order))}
                      </p>

                      {couponCode ? (
                        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-green-300">
                          Coupon: {couponCode}
                        </p>
                      ) : null}
                    </div>

                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Items
                      </p>

                      <p className="mt-2 text-sm">
                        {getItemQuantity(order)}
                      </p>
                    </div>

                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Payment Method
                      </p>

                      <p className="mt-2 text-sm">
                        {formatLabel(paymentMethod)}
                      </p>
                    </div>

                    <div className="bg-[#0e0e0e] p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Payment Status
                      </p>

                      <span
                        className={`mt-2 inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${getPaymentStatusClass(
                          paymentStatus
                        )}`}
                      >
                        {formatLabel(paymentStatus)}
                      </span>
                    </div>

                    <div className="bg-[#0e0e0e] p-5 sm:col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                        Order Date
                      </p>

                      <p className="mt-2 text-sm">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(
                        order.orderId
                      )}`}
                      className="flex w-full items-center justify-center border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.22em] text-neutral-300 transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
                    >
                      View Order Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-col justify-between gap-5 border border-white/10 bg-white/[0.025] px-5 py-4 sm:flex-row sm:items-center sm:px-6 print:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Showing {firstVisibleOrder}–{lastVisibleOrder} of{" "}
              {filteredOrders.length}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safeCurrentPage === 1}
                className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Previous
              </button>

              {pageNumbers.map((pageNumber, index) => {
                const previousPageNumber = pageNumbers[index - 1];

                const showEllipsis =
                  previousPageNumber &&
                  pageNumber - previousPageNumber > 1;

                return (
                  <div
                    key={pageNumber}
                    className="flex items-center gap-2"
                  >
                    {showEllipsis ? (
                      <span className="px-1 text-neutral-600">
                        …
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-label={`Go to page ${pageNumber}`}
                      aria-current={
                        safeCurrentPage === pageNumber
                          ? "page"
                          : undefined
                      }
                      className={`h-9 min-w-9 border px-3 text-xs transition ${
                        safeCurrentPage === pageNumber
                          ? "border-[#f1ece4] bg-[#f1ece4] text-[#0b0b0b]"
                          : "border-white/10 text-neutral-400 hover:border-white/30 hover:text-[#f1ece4]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={safeCurrentPage === totalPages}
                className="border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}