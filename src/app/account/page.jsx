import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  requireCustomerAuth,
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

const ACTIVE_ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
]);

const COMPLETED_ORDER_STATUSES = new Set([
  "delivered",
  "completed",
]);

const CANCELLED_ORDER_STATUSES = new Set([
  "cancelled",
  "canceled",
  "returned",
  "refunded",
]);

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    dotClass: "bg-[#c69a4b]",
    textClass: "text-[#8d682d]",
    backgroundClass: "bg-[#f5ead4]",
    borderClass: "border-[#ddc79e]",
  },
  confirmed: {
    label: "Confirmed",
    dotClass: "bg-[#55738d]",
    textClass: "text-[#3f617d]",
    backgroundClass: "bg-[#e4ebef]",
    borderClass: "border-[#bdccd5]",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-[#5e6090]",
    textClass: "text-[#4c4e7b]",
    backgroundClass: "bg-[#e8e7f0]",
    borderClass: "border-[#c8c6d9]",
  },
  packed: {
    label: "Packed",
    dotClass: "bg-[#755a87]",
    textClass: "text-[#654a76]",
    backgroundClass: "bg-[#ede6ef]",
    borderClass: "border-[#d0bfd5]",
  },
  shipped: {
    label: "Shipped",
    dotClass: "bg-[#3f7b82]",
    textClass: "text-[#326970]",
    backgroundClass: "bg-[#dfedef]",
    borderClass: "border-[#b7d2d5]",
  },
  out_for_delivery: {
    label: "Out for delivery",
    dotClass: "bg-[#36758e]",
    textClass: "text-[#2f6479]",
    backgroundClass: "bg-[#dfebf0]",
    borderClass: "border-[#b6ccd5]",
  },
  delivered: {
    label: "Delivered",
    dotClass: "bg-[#4d7658]",
    textClass: "text-[#42664b]",
    backgroundClass: "bg-[#e3ece5]",
    borderClass: "border-[#bfd0c2]",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-[#4d7658]",
    textClass: "text-[#42664b]",
    backgroundClass: "bg-[#e3ece5]",
    borderClass: "border-[#bfd0c2]",
  },
  cancelled: {
    label: "Cancelled",
    dotClass: "bg-[#9a534d]",
    textClass: "text-[#84443f]",
    backgroundClass: "bg-[#f2e3e1]",
    borderClass: "border-[#d9b9b5]",
  },
  canceled: {
    label: "Cancelled",
    dotClass: "bg-[#9a534d]",
    textClass: "text-[#84443f]",
    backgroundClass: "bg-[#f2e3e1]",
    borderClass: "border-[#d9b9b5]",
  },
  returned: {
    label: "Returned",
    dotClass: "bg-[#766e62]",
    textClass: "text-[#625b51]",
    backgroundClass: "bg-[#eae6df]",
    borderClass: "border-[#d1c8bb]",
  },
  refunded: {
    label: "Refunded",
    dotClass: "bg-[#766e62]",
    textClass: "text-[#625b51]",
    backgroundClass: "bg-[#eae6df]",
    borderClass: "border-[#d1c8bb]",
  },
};

const ACCOUNT_ACTIONS = [
  {
    number: "01",
    eyebrow: "Purchases",
    title: "Your Orders",
    description:
      "Review every OBSIDIAN purchase, follow fulfilment progress and return to your complete order history.",
    href: "/account/orders",
    actionLabel: "View orders",
    icon: "orders",
  },
  {
    number: "02",
    eyebrow: "Curated",
    title: "Saved Pieces",
    description:
      "Return to the pieces, silhouettes and textures you have intentionally saved for another moment.",
    href: "/wishlist",
    actionLabel: "Open wishlist",
    icon: "wishlist",
  },
  {
    number: "03",
    eyebrow: "Personal",
    title: "Your Profile",
    description:
      "Keep your name, contact details and account security information accurate and up to date.",
    href: "/account/profile",
    actionLabel: "Manage profile",
    icon: "profile",
  },
  {
    number: "04",
    eyebrow: "Delivery",
    title: "Address Book",
    description:
      "Organise delivery and billing addresses for a faster, more precise checkout experience.",
    href: "/account/addresses",
    actionLabel: "Manage addresses",
    icon: "address",
  },
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function formatCustomerName(customer) {
  const directName = normalizeText(
    customer?.name ||
      customer?.fullName ||
      customer?.displayName
  );

  if (directName) {
    return directName;
  }

  const combinedName = [
    normalizeText(customer?.firstName),
    normalizeText(customer?.lastName),
  ]
    .filter(Boolean)
    .join(" ");

  return combinedName || "Obsidian Member";
}

function formatFirstName(customer) {
  const firstName = normalizeText(customer?.firstName);

  if (firstName) {
    return firstName;
  }

  const fullName = formatCustomerName(customer);
  const [firstWord] = fullName.split(/\s+/);

  return firstWord || "Member";
}

function formatDate(value, fallback = "Recently joined") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value, fallback = "Not available") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(normalizeNumber(value))}`;
}

function formatPaymentMethod(value) {
  const method = normalizeText(value).toLowerCase();

  if (!method) {
    return "Not specified";
  }

  if (method === "cash_on_delivery") {
    return "Cash on delivery";
  }

  return method
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        `${word.charAt(0).toUpperCase()}${word.slice(1)}`
    )
    .join(" ");
}

function getDefaultAddress(customer) {
  const addresses = Array.isArray(customer?.addresses)
    ? customer.addresses
    : [];

  const defaultAddressId = normalizeText(
    customer?.defaultShippingAddressId ||
      customer?.defaultAddressId
  );

  return (
    addresses.find((address) => {
      const addressId = normalizeText(
        address?.id || address?._id
      );

      return (
        (defaultAddressId &&
          addressId === defaultAddressId) ||
        address?.isDefaultShipping === true ||
        address?.isDefault === true
      );
    }) ||
    addresses[0] ||
    customer?.defaultAddress ||
    customer?.address ||
    null
  );
}

function formatAddressLine(address) {
  if (!address) {
    return "";
  }

  return [
    normalizeText(
      address?.addressLine1 ||
        address?.address ||
        address?.street
    ),
    normalizeText(address?.addressLine2),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatAddressLocation(address) {
  if (!address) {
    return "";
  }

  return [
    normalizeText(address?.area),
    normalizeText(address?.city || address?.district),
    normalizeText(address?.postalCode || address?.postcode),
    normalizeText(address?.country),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatCustomerLocation(customer) {
  const address = getDefaultAddress(customer);

  return (
    formatAddressLocation(address) ||
    [
      normalizeText(customer?.city),
      normalizeText(customer?.country),
    ]
      .filter(Boolean)
      .join(", ")
  );
}

function getAccountStatus(customer) {
  const status = normalizeText(
    customer?.accountStatus ||
      customer?.status ||
      "active"
  ).toLowerCase();

  const statusMap = {
    active: {
      label: "Active member",
      tone: "success",
    },
    pending: {
      label: "Pending review",
      tone: "warning",
    },
    suspended: {
      label: "Suspended",
      tone: "danger",
    },
    blocked: {
      label: "Restricted",
      tone: "danger",
    },
    inactive: {
      label: "Inactive",
      tone: "neutral",
    },
  };

  return (
    statusMap[status] || {
      label: status
        ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
        : "Active member",
      tone: "neutral",
    }
  );
}

function calculateProfileCompletion(customer) {
  const defaultAddress = getDefaultAddress(customer);

  const requiredDetails = [
    formatCustomerName(customer),
    normalizeText(customer?.email),
    normalizeText(
      customer?.phone ||
        customer?.phoneNumber ||
        customer?.mobile
    ),
    defaultAddress ? "address-saved" : "",
  ];

  const completedDetails =
    requiredDetails.filter(Boolean).length;

  return Math.round(
    (completedDetails / requiredDetails.length) * 100
  );
}

function normalizeOrderStatus(value) {
  return normalizeText(value || "pending").toLowerCase();
}

function getStatusDetails(value) {
  const status = normalizeOrderStatus(value);

  return (
    STATUS_CONFIG[status] || {
      label: status
        .split("_")
        .filter(Boolean)
        .map(
          (word) =>
            `${word.charAt(0).toUpperCase()}${word.slice(1)}`
        )
        .join(" "),
      dotClass: "bg-[#766e62]",
      textClass: "text-[#625b51]",
      backgroundClass: "bg-[#eae6df]",
      borderClass: "border-[#d1c8bb]",
    }
  );
}

function createOrderSummary(orders) {
  return orders.reduce(
    (summary, order) => {
      const status = normalizeOrderStatus(order?.status);
      const total = normalizeNumber(
        order?.pricing?.total ?? order?.total
      );

      summary.totalOrders += 1;

      if (ACTIVE_ORDER_STATUSES.has(status)) {
        summary.activeOrders += 1;
      }

      if (COMPLETED_ORDER_STATUSES.has(status)) {
        summary.completedOrders += 1;
        summary.totalSpent += total;
      }

      if (CANCELLED_ORDER_STATUSES.has(status)) {
        summary.cancelledOrders += 1;
      }

      return summary;
    },
    {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
    }
  );
}

async function loadOrderOverview() {
  const emptyOverview = {
    orders: [],
    summary: {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
    },
    available: false,
  };

  try {
    const requestHeaders = await headers();

    const forwardedHost =
      requestHeaders.get("x-forwarded-host");
    const host =
      forwardedHost || requestHeaders.get("host");

    if (!host) {
      return emptyOverview;
    }

    const forwardedProtocol =
      requestHeaders.get("x-forwarded-proto");

    const protocol =
      forwardedProtocol ||
      (host.includes("localhost") ? "http" : "https");

    const cookieHeader =
      requestHeaders.get("cookie") || "";

    const response = await fetch(
      `${protocol}://${host}/api/account/orders`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      return emptyOverview;
    }

    const data = await response.json();

    if (!data?.success) {
      return emptyOverview;
    }

    const orders = Array.isArray(data.orders)
      ? data.orders
      : [];

    const fallbackSummary = createOrderSummary(orders);

    return {
      orders,
      summary: {
        totalOrders: normalizeNumber(
          data?.summary?.totalOrders ??
            fallbackSummary.totalOrders
        ),
        activeOrders: normalizeNumber(
          data?.summary?.activeOrders ??
            fallbackSummary.activeOrders
        ),
        completedOrders: normalizeNumber(
          data?.summary?.completedOrders ??
            fallbackSummary.completedOrders
        ),
        cancelledOrders: normalizeNumber(
          data?.summary?.cancelledOrders ??
            fallbackSummary.cancelledOrders
        ),
        totalSpent: normalizeNumber(
          data?.summary?.totalSpent ??
            fallbackSummary.totalSpent
        ),
      },
      available: true,
    };
  } catch {
    return emptyOverview;
  }
}

function ArrowIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function AccountIcon({
  type,
  className = "h-5 w-5",
}) {
  if (type === "orders") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 7.5h15v12h-15z" />
        <path d="M8 7.5V5.8C8 4.25 9.35 3 11 3h2c1.65 0 3 1.25 3 2.8v1.7" />
        <path d="M4.5 11h15" />
        <path d="M10 14.5h4" />
      </svg>
    );
  }

  if (type === "wishlist") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.3S4 15.8 4 9.6C4 6.6 6.1 4.5 8.9 4.5c1.5 0 2.7.7 3.1 1.7.4-1 1.6-1.7 3.1-1.7C17.9 4.5 20 6.6 20 9.6c0 6.2-8 10.7-8 10.7Z" />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
      </svg>
    );
  }

  if (type === "address") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }

  if (type === "security") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 19 6v5c0 4.8-2.8 8.2-7 10-4.2-1.8-7-5.2-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  return null;
}

function DetailRow({
  label,
  value,
  href,
  verified = false,
}) {
  const content = value || "Not provided";

  return (
    <div className="flex flex-col gap-2 border-b border-black/10 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/40">
        {label}
      </span>

      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        {href && value ? (
          <a
            href={href}
            className="max-w-full break-words text-sm font-medium text-[#171512] transition-colors duration-300 hover:text-black/55"
          >
            {content}
          </a>
        ) : (
          <span
            className={`max-w-full break-words text-sm font-medium ${
              value
                ? "text-[#171512]"
                : "italic text-black/35"
            }`}
          >
            {content}
          </span>
        )}

        {verified ? (
          <span
            title="Verified"
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#425a47] text-white"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="h-2.5 w-2.5"
            >
              <path
                d="M3.2 8.1 6.3 11 12.8 4.7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatisticCard({
  label,
  value,
  detail,
  index,
}) {
  return (
    <div className="group relative overflow-hidden border border-black/10 bg-[#f4f0e8] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-black/20 hover:bg-[#f7f3ec] hover:shadow-[0_20px_55px_rgba(25,22,17,0.08)] sm:p-6">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-black/[0.04] transition-transform duration-700 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/38">
            {label}
          </p>

          <p className="mt-5 break-words font-serif text-[2.1rem] leading-none tracking-[-0.04em] text-[#171512] sm:text-[2.45rem]">
            {value}
          </p>
        </div>

        <span className="font-serif text-2xl italic text-black/12">
          {index}
        </span>
      </div>

      <p className="relative mt-4 text-xs leading-6 text-black/45">
        {detail}
      </p>
    </div>
  );
}

function ActionCard({
  eyebrow,
  title,
  description,
  href,
  number,
  actionLabel,
  icon,
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[285px] flex-col justify-between overflow-hidden border border-black/10 bg-[#f4f0e8] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-black/25 hover:bg-[#eee8dc] hover:shadow-[0_26px_75px_rgba(25,22,17,0.11)] sm:p-8"
    >
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-black/[0.05] transition-transform duration-700 group-hover:scale-125" />

      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border border-black/[0.05] transition-transform duration-700 group-hover:scale-110" />

      <div className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-black transition-transform duration-700 group-hover:scale-x-100" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center border border-black/10 text-black/55 transition-all duration-500 group-hover:border-black/25 group-hover:bg-[#171512] group-hover:text-white">
          <AccountIcon type={icon} />
        </div>

        <span className="font-serif text-3xl italic text-black/15 transition-colors duration-500 group-hover:text-black/30">
          {number}
        </span>
      </div>

      <div className="relative mt-14">
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/38">
          {eyebrow}
        </p>

        <h3 className="mt-4 font-serif text-[2rem] font-medium leading-none tracking-[-0.035em] text-[#171512] sm:text-[2.3rem]">
          {title}
        </h3>

        <p className="mt-4 max-w-[31rem] text-sm leading-7 text-black/50">
          {description}
        </p>

        <div className="mt-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-black">
          <span>{actionLabel}</span>

          <span className="h-px w-8 bg-black transition-all duration-500 group-hover:w-14" />

          <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function SecurityItem({
  label,
  value,
  complete,
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/10 py-4 last:border-b-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {label}
        </p>

        <p className="mt-2 text-sm text-white/75">
          {value}
        </p>
      </div>

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          complete
            ? "border-[#cbbd9c]/30 bg-[#cbbd9c]/10 text-[#d9ccaa]"
            : "border-white/10 text-white/30"
        }`}
      >
        {complete ? (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="h-3 w-3"
          >
            <path
              d="M3.2 8.1 6.3 11 12.8 4.7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>
    </div>
  );
}

function RecentOrderCard({ order }) {
  const status = getStatusDetails(order?.status);

  const items = Array.isArray(order?.items)
    ? order.items
    : [];

  const primaryItem = items[0];

  const totalPieces = items.reduce(
    (total, item) =>
      total + normalizeNumber(item?.quantity),
    0
  );

  const orderReference =
    normalizeText(order?.orderId) ||
    normalizeText(order?._id) ||
    "Order";

  return (
    <article className="group grid overflow-hidden border border-black/10 bg-[#f4f0e8] transition-all duration-500 hover:border-black/20 hover:shadow-[0_22px_60px_rgba(25,22,17,0.08)] md:grid-cols-[148px_minmax(0,1fr)_190px]">
      <div className="relative flex h-64 items-center justify-center overflow-hidden border-b border-black/10 bg-[#e5ded2] p-4 sm:h-72 md:h-auto md:min-h-[210px] md:border-b-0 md:border-r md:p-3">
        {primaryItem?.image ? (
          <img
            src={primaryItem.image}
            alt={
              normalizeText(primaryItem?.name) ||
              "Ordered OBSIDIAN product"
            }
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-4xl text-black/15">
              O
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${status.backgroundClass} ${status.borderClass} ${status.textClass}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
            />

            {status.label}
          </span>

          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/35">
            {formatShortDate(order?.createdAt)}
          </span>
        </div>

        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35">
          Order reference
        </p>

        <h3 className="mt-2 truncate font-serif text-2xl tracking-[-0.025em]">
          {orderReference}
        </h3>

        <p className="mt-3 truncate text-sm text-black/52">
          {normalizeText(primaryItem?.name) ||
            "OBSIDIAN Piece"}

          {items.length > 1
            ? ` and ${items.length - 1} more`
            : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/42">
          <span>
            {totalPieces || items.length || 1}{" "}
            {(totalPieces || items.length || 1) === 1
              ? "piece"
              : "pieces"}
          </span>

          <span>
            {formatPaymentMethod(order?.paymentMethod)}
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-black/10 p-5 sm:p-6 md:border-l md:border-t-0">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/35">
            Order total
          </p>

          <p className="mt-3 font-serif text-2xl tracking-[-0.03em]">
            {formatCurrency(
              order?.pricing?.total ?? order?.total
            )}
          </p>
        </div>

        <Link
          href={`/account/orders/${encodeURIComponent(
            orderReference
          )}`}
          className="group/link mt-6 inline-flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-black"
        >
          View details

          <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

function AddressSummaryCard({
  address,
  addressCount,
}) {
  const recipientName = normalizeText(
    address?.fullName ||
      address?.name ||
      address?.recipientName
  );

  const phone = normalizeText(
    address?.phone ||
      address?.phoneNumber ||
      address?.mobile
  );

  const addressLine = formatAddressLine(address);
  const location = formatAddressLocation(address);

  return (
    <div className="relative overflow-hidden border border-black/10 bg-[#ddd3c4] p-6 sm:p-8">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-black/[0.06]" />

      <div className="relative flex items-start justify-between gap-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
            Default delivery
          </p>

          <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
            {address ? "Primary address" : "No address saved"}
          </h2>
        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-black/10 text-black/60">
          <AccountIcon type="address" />
        </span>
      </div>

      {address ? (
        <div className="relative mt-8">
          {recipientName ? (
            <p className="font-medium text-[#171512]">
              {recipientName}
            </p>
          ) : null}

          <div className="mt-3 space-y-1 text-sm leading-6 text-black/55">
            {addressLine ? <p>{addressLine}</p> : null}
            {location ? <p>{location}</p> : null}
            {phone ? <p>{phone}</p> : null}
          </div>

          <p className="mt-7 text-[9px] font-semibold uppercase tracking-[0.2em] text-black/38">
            {addressCount} saved{" "}
            {addressCount === 1 ? "address" : "addresses"}
          </p>
        </div>
      ) : (
        <p className="relative mt-7 text-sm leading-7 text-black/52">
          Add a delivery address now so your next checkout
          can be faster and more precise.
        </p>
      )}

      <Link
        href="/account/addresses"
        className="group relative mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[#171512] px-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:bg-black/75"
      >
        {address ? "Manage addresses" : "Add an address"}

        <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default async function AccountPage() {
  const customer = await requireCustomerAuth();

  const orderOverviewPromise = loadOrderOverview();

  async function signOutAction() {
    "use server";

    await clearCustomerSession();
    redirect("/account/login");
  }

  const orderOverview = await orderOverviewPromise;

  const customerName = formatCustomerName(customer);
  const firstName = formatFirstName(customer);

  const email = normalizeText(customer?.email);

  const phone = normalizeText(
    customer?.phone ||
      customer?.phoneNumber ||
      customer?.mobile
  );

  const location = formatCustomerLocation(customer);

  const joinedDate = formatDate(
    customer?.createdAt || customer?.registeredAt
  );

  const lastLoginDate = formatShortDate(
    customer?.lastLoginAt
  );

  const passwordChangedDate = formatShortDate(
    customer?.passwordChangedAt
  );

  const accountStatus = getAccountStatus(customer);

  const wishlistCount = Array.isArray(customer?.wishlist)
    ? customer.wishlist.length
    : normalizeNumber(customer?.wishlistCount);

  const addresses = Array.isArray(customer?.addresses)
    ? customer.addresses
    : [];

  const defaultAddress = getDefaultAddress(customer);

  const addressCount =
    addresses.length ||
    normalizeNumber(customer?.addressCount) ||
    (defaultAddress ? 1 : 0);

  const profileCompletion =
    calculateProfileCompletion(customer);

  const emailVerified = Boolean(customer?.emailVerified);
  const phoneVerified = Boolean(customer?.phoneVerified);

  const recentOrders = [...orderOverview.orders]
    .sort((firstOrder, secondOrder) => {
      const firstDate = new Date(
        firstOrder?.createdAt || 0
      ).getTime();

      const secondDate = new Date(
        secondOrder?.createdAt || 0
      ).getTime();

      return secondDate - firstDate;
    })
    .slice(0, 3);

  const totalOrders =
    orderOverview.summary.totalOrders ||
    normalizeNumber(customer?.totalOrders);

  const completedOrders =
    orderOverview.summary.completedOrders ||
    normalizeNumber(customer?.completedOrders);

  const activeOrders =
    orderOverview.summary.activeOrders;

  const totalSpent =
    orderOverview.summary.totalSpent ||
    normalizeNumber(customer?.totalSpent);

  return (
    <main className="min-h-screen overflow-hidden bg-[#e9e3d8] text-[#171512]">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#151411] text-[#f5f0e7]">
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_24%,rgba(211,195,164,0.18),transparent_28%),radial-gradient(circle_at_12%_88%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_48%)]" />

          <div className="absolute -right-52 -top-56 h-[44rem] w-[44rem] animate-[spin_60s_linear_infinite] rounded-full border border-white/[0.045]" />

          <div className="absolute -right-16 -top-16 h-[27rem] w-[27rem] animate-[spin_45s_linear_infinite_reverse] rounded-full border border-white/[0.05]" />

          <div className="absolute right-28 top-24 h-36 w-36 rotate-45 border border-[#d4c6a5]/[0.06]" />

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4c6a5]/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1480px] px-5 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-8 lg:px-12 xl:px-16">
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="Go to OBSIDIAN homepage"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-white/20 transition-colors duration-500 group-hover:border-white/45">
                <span className="h-3.5 w-3.5 rotate-45 border border-white/70 transition-transform duration-700 group-hover:rotate-[225deg]" />
              </span>

              <span className="text-sm font-semibold uppercase tracking-[0.34em]">
                OBSIDIAN
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/shop"
                className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 transition-colors duration-300 hover:text-white sm:inline"
              >
                Continue shopping
              </Link>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="group relative inline-flex min-h-10 items-center justify-center overflow-hidden border border-white/20 px-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:border-white hover:text-black sm:px-5"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 group-hover:translate-x-0" />

                  <span className="relative">Sign out</span>
                </button>
              </form>
            </div>
          </header>

          <div className="grid gap-12 pb-4 pt-14 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end lg:gap-16 lg:pt-20">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#cdbf9e]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d6c9aa]">
                  Private member account
                </p>
              </div>

              <h1 className="mt-7 max-w-[920px] font-serif text-[3.5rem] font-medium leading-[0.88] tracking-[-0.055em] sm:text-[5.4rem] lg:text-[7rem]">
                Welcome back,
                <span className="block italic text-[#d4c6a5]">
                  {firstName}.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-sm leading-7 text-white/52 sm:text-base sm:leading-8">
                Your private OBSIDIAN space for orders,
                saved pieces, delivery details and account
                security.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="group inline-flex min-h-12 items-center justify-center gap-4 bg-[#eee5d3] px-6 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#171512] transition-all duration-300 hover:bg-white"
                >
                  Enter the collection

                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/account/orders"
                  className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 text-[9px] font-semibold uppercase tracking-[0.24em] text-white transition-all duration-300 hover:border-white/50 hover:bg-white/[0.05]"
                >
                  Review orders
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#d6c9aa]">
                Member identity
              </p>

              <p className="mt-5 break-words font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                {customerName}
              </p>

              <p className="mt-2 break-words text-xs text-white/42">
                {email || "Email not provided"}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    accountStatus.tone === "success"
                      ? "bg-[#b6c49d]"
                      : accountStatus.tone === "warning"
                        ? "bg-[#d1b274]"
                        : accountStatus.tone === "danger"
                          ? "bg-[#c47b72]"
                          : "bg-white/35"
                  }`}
                />

                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  {accountStatus.label}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-px bg-white/10">
                <div className="bg-[#151411] py-4 pr-4">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/30">
                    Member since
                  </p>

                  <p className="mt-2 text-xs text-[#d8ccae]">
                    {joinedDate}
                  </p>
                </div>

                <div className="bg-[#151411] py-4 pl-4">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/30">
                    Active orders
                  </p>

                  <p className="mt-2 text-xs text-[#d8ccae]">
                    {activeOrders}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="border-b border-black/10 bg-[#e2dacd]">
        <div className="mx-auto flex max-w-[1480px] gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12 xl:px-16">
          {[
            {
              label: "Overview",
              href: "/account",
            },
            {
              label: "Orders",
              href: "/account/orders",
            },
            {
              label: "Profile",
              href: "/account/profile",
            },
            {
              label: "Addresses",
              href: "/account/addresses",
            },
            {
              label: "Wishlist",
              href: "/wishlist",
            },
          ].map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 border px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                index === 0
                  ? "border-[#171512] bg-[#171512] text-white"
                  : "border-transparent text-black/45 hover:border-black/15 hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            index="01"
            label="Total orders"
            value={String(totalOrders)}
            detail={`${completedOrders} completed ${
              completedOrders === 1 ? "order" : "orders"
            }`}
          />

          <StatisticCard
            index="02"
            label="Total spent"
            value={formatCurrency(totalSpent)}
            detail="Value of completed OBSIDIAN orders"
          />

          <StatisticCard
            index="03"
            label="Saved pieces"
            value={String(wishlistCount)}
            detail="Items currently held in your wishlist"
          />

          <StatisticCard
            index="04"
            label="Saved addresses"
            value={String(addressCount)}
            detail="Delivery and billing locations available"
          />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-12">
          <aside className="space-y-6">
            <div className="border border-black/10 bg-[#f4f0e8] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
                    Member profile
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                    Your details
                  </h2>
                </div>

                <span className="flex h-10 w-10 items-center justify-center border border-black/10 text-black/55">
                  <AccountIcon type="profile" />
                </span>
              </div>

              <div className="mt-7">
                <DetailRow
                  label="Full name"
                  value={customerName}
                />

                <DetailRow
                  label="Email address"
                  value={email}
                  href={
                    email ? `mailto:${email}` : undefined
                  }
                  verified={emailVerified}
                />

                <DetailRow
                  label="Phone"
                  value={phone}
                  href={
                    phone ? `tel:${phone}` : undefined
                  }
                  verified={phoneVerified}
                />

                <DetailRow
                  label="Location"
                  value={location}
                />
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/40">
                    Profile completion
                  </span>

                  <span className="font-serif text-lg italic text-black/65">
                    {profileCompletion}%
                  </span>
                </div>

                <div className="mt-3 h-1 overflow-hidden bg-black/10">
                  <div
                    className="h-full bg-[#171512] transition-all duration-1000"
                    style={{
                      width: `${profileCompletion}%`,
                    }}
                  />
                </div>
              </div>

              <Link
                href="/account/profile"
                className="group mt-8 flex min-h-12 w-full items-center justify-center gap-3 bg-[#171512] px-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white transition-all duration-300 hover:bg-black/75"
              >
                Manage profile

                <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <AddressSummaryCard
              address={defaultAddress}
              addressCount={addressCount}
            />

            <div className="relative overflow-hidden bg-[#171512] p-6 text-white sm:p-8">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/[0.05]" />

              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]">
                    Account security
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                    Secure access
                  </h2>
                </div>

                <span className="flex h-10 w-10 items-center justify-center border border-white/15 text-[#d4c6a5]">
                  <AccountIcon type="security" />
                </span>
              </div>

              <div className="relative mt-6">
                <SecurityItem
                  label="Email status"
                  value={
                    emailVerified
                      ? "Verified"
                      : "Verification pending"
                  }
                  complete={emailVerified}
                />

                <SecurityItem
                  label="Phone status"
                  value={
                    phoneVerified
                      ? "Verified"
                      : phone
                        ? "Verification pending"
                        : "Not provided"
                  }
                  complete={phoneVerified}
                />

                <SecurityItem
                  label="Last sign in"
                  value={lastLoginDate}
                  complete={Boolean(customer?.lastLoginAt)}
                />

                <SecurityItem
                  label="Password updated"
                  value={passwordChangedDate}
                  complete={Boolean(
                    customer?.passwordChangedAt
                  )}
                />
              </div>

              <Link
                href="/account/profile#security"
                className="relative mt-7 flex min-h-12 w-full items-center justify-center border border-white/20 px-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                Security settings
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
                  Account overview
                </p>

                <h2 className="mt-3 max-w-3xl font-serif text-[2.8rem] leading-none tracking-[-0.04em] sm:text-[4rem]">
                  Everything within
                  <span className="block italic text-black/40">
                    your OBSIDIAN world.
                  </span>
                </h2>
              </div>

              <p className="max-w-sm text-sm leading-7 text-black/48">
                Review purchases, return to saved pieces
                and keep your delivery and personal
                information ready for a seamless checkout.
              </p>
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
                    Recent purchases
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                    Latest orders
                  </h2>
                </div>

                <Link
                  href="/account/orders"
                  className="group inline-flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-black"
                >
                  Complete order history

                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <RecentOrderCard
                      key={
                        order?._id ||
                        order?.orderId ||
                        `${order?.createdAt}-${order?.total}`
                      }
                      order={order}
                    />
                  ))
                ) : (
                  <div className="relative overflow-hidden border border-black/10 bg-[#f4f0e8] px-6 py-12 text-center sm:px-10 sm:py-16">
                    <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-black/[0.04]" />

                    <p className="relative text-[9px] font-semibold uppercase tracking-[0.28em] text-black/35">
                      {orderOverview.available
                        ? "No purchases yet"
                        : "Order overview"}
                    </p>

                    <h3 className="relative mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                      {orderOverview.available
                        ? "Your first piece awaits."
                        : "Your orders remain available in the archive."}
                    </h3>

                    <p className="relative mx-auto mt-4 max-w-lg text-sm leading-7 text-black/50">
                      {orderOverview.available
                        ? "Once you place an order, its progress and essential details will appear here."
                        : "Open your complete order history to review purchases and delivery progress."}
                    </p>

                    <Link
                      href={
                        orderOverview.available
                          ? "/shop"
                          : "/account/orders"
                      }
                      className="relative mt-7 inline-flex min-h-12 items-center justify-center bg-[#171512] px-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:bg-black/75"
                    >
                      {orderOverview.available
                        ? "Explore the collection"
                        : "Open order history"}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 border-t border-black/10 pt-10">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/40">
                  Account destinations
                </p>

                <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                  Manage your account
                </h2>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                {ACCOUNT_ACTIONS.map((action) => (
                  <ActionCard
                    key={action.href}
                    {...action}
                  />
                ))}
              </div>
            </div>

            <div className="relative mt-8 overflow-hidden bg-[#171512] px-6 py-10 text-[#f5f0e7] sm:px-10 sm:py-12">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_75%_50%,rgba(211,195,164,0.20),transparent_42%)]"
              />

              <div className="absolute -right-32 top-1/2 h-72 w-72 -translate-y-1/2 rotate-45 border border-white/[0.04]" />

              <div className="relative">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#cdbf9e]">
                  Continue the collection
                </p>

                <h2 className="mt-4 max-w-3xl font-serif text-[2.5rem] leading-[0.95] tracking-[-0.04em] sm:text-[3.8rem]">
                  Built under pressure.
                  <span className="block italic text-[#d5c8a8]">
                    Chosen with intention.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-white/50">
                  Discover pieces shaped by precision,
                  restraint and the permanent character of
                  obsidian.
                </p>

                <Link
                  href="/shop"
                  className="group mt-9 inline-flex min-h-12 w-fit items-center justify-center gap-4 border border-white/20 px-6 text-[9px] font-semibold uppercase tracking-[0.24em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                >
                  Enter the shop

                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#e2dacd]">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black/40">
            OBSIDIAN private account
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/contact"
              className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Assistance
            </Link>

            <Link
              href="/track-order"
              className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Track order
            </Link>

            <Link
              href="/shop"
              className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Shop
            </Link>

            <Link
              href="/"
              className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/50 transition-colors hover:text-black"
            >
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}