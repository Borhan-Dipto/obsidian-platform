import Link from "next/link";
import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  requireCustomerAuth,
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

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
      "Keep your personal information, contact details and account preferences accurate and refined.",
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

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
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
  const firstName = normalizeText(
    customer?.firstName
  );

  if (firstName) {
    return firstName;
  }

  const fullName = formatCustomerName(customer);
  const [firstWord] = fullName.split(/\s+/);

  return firstWord || "Member";
}

function formatDate(value) {
  if (!value) {
    return "Recently joined";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently joined";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(normalizeNumber(value));
}

function formatLocation(customer) {
  const defaultAddress =
    customer?.addresses?.find?.(
      (address) =>
        address?.id ===
          customer?.defaultShippingAddressId ||
        address?._id ===
          customer?.defaultShippingAddressId ||
        address?.isDefaultShipping === true ||
        address?.isDefault === true
    ) ||
    customer?.addresses?.[0] ||
    customer?.defaultAddress ||
    customer?.address ||
    {};

  const city = normalizeText(
    customer?.city ||
      defaultAddress?.city ||
      defaultAddress?.district
  );

  const country = normalizeText(
    customer?.country ||
      defaultAddress?.country
  );

  return [city, country]
    .filter(Boolean)
    .join(", ");
}

function getInitials(name) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");

  return initials || "OM";
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
        ? `${status
            .charAt(0)
            .toUpperCase()}${status.slice(1)}`
        : "Active member",
      tone: "neutral",
    }
  );
}

function getLoyaltyDetails(customer) {
  const points = normalizeNumber(
    customer?.loyaltyPoints
  );

  const suppliedTier = normalizeText(
    customer?.loyaltyTier
  ).toLowerCase();

  const tiers = [
    {
      key: "member",
      label: "Member",
      minimum: 0,
      nextMinimum: 500,
    },
    {
      key: "obsidian",
      label: "Obsidian",
      minimum: 500,
      nextMinimum: 1500,
    },
    {
      key: "private",
      label: "Private",
      minimum: 1500,
      nextMinimum: 3000,
    },
    {
      key: "founder",
      label: "Founder",
      minimum: 3000,
      nextMinimum: null,
    },
  ];

  let currentTier =
    tiers.find(
      (tier) => tier.key === suppliedTier
    ) || tiers[0];

  if (!suppliedTier) {
    currentTier =
      [...tiers]
        .reverse()
        .find(
          (tier) => points >= tier.minimum
        ) || tiers[0];
  }

  const currentIndex = tiers.findIndex(
    (tier) =>
      tier.key === currentTier.key
  );

  const nextTier =
    currentIndex >= 0
      ? tiers[currentIndex + 1] || null
      : null;

  let progress = 100;
  let pointsRemaining = 0;

  if (nextTier) {
    const tierRange =
      nextTier.minimum -
      currentTier.minimum;

    const pointsWithinTier =
      points - currentTier.minimum;

    progress = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (pointsWithinTier / tierRange) *
            100
        )
      )
    );

    pointsRemaining = Math.max(
      0,
      nextTier.minimum - points
    );
  }

  return {
    points,
    currentTier,
    nextTier,
    progress,
    pointsRemaining,
  };
}

function calculateProfileCompletion(
  customer
) {
  const fields = [
    formatCustomerName(customer),
    normalizeText(customer?.email),
    normalizeText(
      customer?.phone ||
        customer?.phoneNumber ||
        customer?.mobile
    ),
    formatLocation(customer),
    normalizeText(customer?.dateOfBirth),
    normalizeText(customer?.gender),
    Array.isArray(customer?.addresses) &&
      customer.addresses.length > 0
      ? "complete"
      : "",
    customer?.emailVerified
      ? "verified"
      : "",
  ];

  const completedFields =
    fields.filter(Boolean).length;

  return Math.round(
    (completedFields / fields.length) * 100
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

  if (type === "loyalty") {
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
        <path d="m12 3 2.2 4.7 5.1.7-3.7 3.6.9 5.1-4.5-2.4-4.5 2.4.9-5.1-3.7-3.6 5.1-.7L12 3Z" />
        <path d="M8 19.5 6.8 22l5.2-2.2 5.2 2.2-1.2-2.5" />
      </svg>
    );
  }

  return null;
}

function ArrowIcon({
  className = "h-4 w-4",
}) {
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

function DetailRow({
  label,
  value,
  href,
  verified,
}) {
  const content = value || "Not provided";

  return (
    <div className="group flex flex-col gap-2 border-b border-black/10 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/40">
        {label}
      </span>

      <div className="flex min-w-0 items-center gap-2">
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

          <p className="mt-5 font-serif text-[2.2rem] leading-none tracking-[-0.04em] text-[#171512] sm:text-[2.5rem]">
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
  status,
}) {
  const isComplete =
    status === "complete";

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
          isComplete
            ? "border-[#cbbd9c]/30 bg-[#cbbd9c]/10 text-[#d9ccaa]"
            : "border-white/10 text-white/30"
        }`}
      >
        {isComplete ? (
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

export default async function AccountPage() {
  const customer =
    await requireCustomerAuth();

  async function signOutAction() {
    "use server";

    await clearCustomerSession();
    redirect("/account/login");
  }

  const customerName =
    formatCustomerName(customer);

  const firstName =
    formatFirstName(customer);

  const initials =
    getInitials(customerName);

  const email = normalizeText(
    customer?.email
  );

  const phone = normalizeText(
    customer?.phone ||
      customer?.phoneNumber ||
      customer?.mobile
  );

  const location =
    formatLocation(customer);

  const joinedDate =
    formatDate(
      customer?.createdAt ||
        customer?.registeredAt
    );

  const lastLoginDate =
    formatShortDate(
      customer?.lastLoginAt
    );

  const passwordChangedDate =
    formatShortDate(
      customer?.passwordChangedAt
    );

  const accountStatus =
    getAccountStatus(customer);

  const totalOrders =
    normalizeNumber(
      customer?.totalOrders
    );

  const completedOrders =
    normalizeNumber(
      customer?.completedOrders
    );

  const totalSpent =
    normalizeNumber(
      customer?.totalSpent
    );

  const wishlistCount =
    Array.isArray(customer?.wishlist)
      ? customer.wishlist.length
      : normalizeNumber(
          customer?.wishlistCount
        );

  const addressCount =
    Array.isArray(customer?.addresses)
      ? customer.addresses.length
      : normalizeNumber(
          customer?.addressCount
        );

  const profileCompletion =
    calculateProfileCompletion(
      customer
    );

  const loyalty =
    getLoyaltyDetails(customer);

  const emailVerified =
    Boolean(customer?.emailVerified);

  const phoneVerified =
    Boolean(customer?.phoneVerified);

  return (
    <main className="min-h-screen overflow-hidden bg-[#e9e3d8] text-[#171512]">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#151411] text-[#f5f0e7]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
        >
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

                  <span className="relative">
                    Sign out
                  </span>
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
                Your private OBSIDIAN space
                for orders, saved pieces,
                profile details and the next
                chapter of your wardrobe.
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
              <div className="flex items-center gap-5">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#d3c6a6]/35 bg-white/[0.035] font-serif text-2xl italic text-[#e7dcc2]">
                  <span className="absolute inset-1 rounded-full border border-white/[0.06]" />

                  <span className="relative">
                    {initials}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-serif text-2xl tracking-[-0.02em] sm:text-3xl">
                    {customerName}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/42">
                    {email}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        accountStatus.tone ===
                        "success"
                          ? "bg-[#b6c49d]"
                          : accountStatus.tone ===
                              "warning"
                            ? "bg-[#d1b274]"
                            : accountStatus.tone ===
                                "danger"
                              ? "bg-[#c47b72]"
                              : "bg-white/35"
                      }`}
                    />

                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      {accountStatus.label}
                    </span>
                  </div>
                </div>
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
                    Membership
                  </p>

                  <p className="mt-2 text-xs text-[#d8ccae]">
                    {
                      loyalty.currentTier
                        .label
                    }
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
            detail={`${completedOrders} completed order${
              completedOrders === 1
                ? ""
                : "s"
            }`}
          />

          <StatisticCard
            index="02"
            label="Total spent"
            value={formatCurrency(totalSpent)}
            detail="Your lifetime OBSIDIAN purchase value"
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
                    email
                      ? `mailto:${email}`
                      : undefined
                  }
                  verified={emailVerified}
                />

                <DetailRow
                  label="Phone"
                  value={phone}
                  href={
                    phone
                      ? `tel:${phone}`
                      : undefined
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

            <div className="relative overflow-hidden bg-[#171512] p-6 text-white sm:p-8">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/[0.05]" />

              <div className="relative flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]">
                    Member security
                  </p>

                  <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                    Account access
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
                  status={
                    emailVerified
                      ? "complete"
                      : "pending"
                  }
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
                  status={
                    phoneVerified
                      ? "complete"
                      : "pending"
                  }
                />

                <SecurityItem
                  label="Last sign in"
                  value={lastLoginDate}
                  status="complete"
                />

                <SecurityItem
                  label="Password updated"
                  value={passwordChangedDate}
                  status="complete"
                />
              </div>

              <Link
                href="/account/forgot-password"
                className="relative mt-7 flex min-h-12 w-full items-center justify-center border border-white/20 px-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                Change password
              </Link>
            </div>
          </aside>

          <div>
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
                Review your purchases,
                return to saved pieces and
                keep your personal
                information ready for a more
                seamless checkout.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {ACCOUNT_ACTIONS.map(
                (action) => (
                  <ActionCard
                    key={action.href}
                    {...action}
                  />
                )
              )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative overflow-hidden bg-[#171512] px-6 py-10 text-[#f5f0e7] sm:px-10 sm:py-12">
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
                    Discover the latest
                    pieces shaped by
                    precision, restraint and
                    the permanent character
                    of obsidian.
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

              <div className="relative overflow-hidden border border-black/10 bg-[#dcd2c3] p-6 sm:p-8">
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border border-black/[0.06]" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-black/40">
                      Membership
                    </p>

                    <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
                      {
                        loyalty.currentTier
                          .label
                      }
                    </h2>
                  </div>

                  <span className="flex h-11 w-11 items-center justify-center border border-black/10 text-black/60">
                    <AccountIcon type="loyalty" />
                  </span>
                </div>

                <p className="relative mt-7 font-serif text-5xl tracking-[-0.05em]">
                  {loyalty.points}
                </p>

                <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-black/40">
                  Loyalty points
                </p>

                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/42">
                    <span>
                      {
                        loyalty.currentTier
                          .label
                      }
                    </span>

                    <span>
                      {loyalty.nextTier
                        ? loyalty.nextTier
                            .label
                        : "Highest tier"}
                    </span>
                  </div>

                  <div className="mt-3 h-1 overflow-hidden bg-black/10">
                    <div
                      className="h-full bg-[#171512] transition-all duration-1000"
                      style={{
                        width: `${loyalty.progress}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-black/48">
                  {loyalty.nextTier
                    ? `${loyalty.pointsRemaining} more points to reach ${loyalty.nextTier.label} membership.`
                    : "You have reached the highest available membership tier."}
                </p>
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