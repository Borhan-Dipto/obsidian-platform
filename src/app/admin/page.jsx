import Link from "next/link";
import clientPromise from "../../lib/mongodb";
import {
  hasAdminPermission,
  requireAdminPermission,
} from "../../lib/adminAuth";
import AdminLogoutButton from "../../components/admin/AdminLogoutButton";

export const dynamic = "force-dynamic";

const ACTIVE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
];

const REVENUE_EXCLUDED_STATUSES = [
  "cancelled",
  "canceled",
  "returned",
  "refunded",
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "border-[#c7a452]/30 bg-[#c7a452]/10 text-[#e2c27b]",
  },

  confirmed: {
    label: "Confirmed",
    className:
      "border-[#7797bc]/30 bg-[#7797bc]/10 text-[#a9c0dc]",
  },

  processing: {
    label: "Processing",
    className:
      "border-[#9282b1]/30 bg-[#9282b1]/10 text-[#bcaed4]",
  },

  packed: {
    label: "Packed",
    className:
      "border-[#a183b0]/30 bg-[#a183b0]/10 text-[#c7acd2]",
  },

  shipped: {
    label: "Shipped",
    className:
      "border-[#6599a5]/30 bg-[#6599a5]/10 text-[#9fc6ce]",
  },

  out_for_delivery: {
    label: "Out for delivery",
    className:
      "border-[#5f91a7]/30 bg-[#5f91a7]/10 text-[#9dc4d5]",
  },

  delivered: {
    label: "Delivered",
    className:
      "border-[#668a6a]/30 bg-[#668a6a]/10 text-[#9fbea2]",
  },

  completed: {
    label: "Completed",
    className:
      "border-[#668a6a]/30 bg-[#668a6a]/10 text-[#9fbea2]",
  },

  cancelled: {
    label: "Cancelled",
    className:
      "border-[#a75f59]/30 bg-[#a75f59]/10 text-[#d18d87]",
  },

  canceled: {
    label: "Cancelled",
    className:
      "border-[#a75f59]/30 bg-[#a75f59]/10 text-[#d18d87]",
  },

  returned: {
    label: "Returned",
    className:
      "border-white/15 bg-white/[0.04] text-white/50",
  },

  refunded: {
    label: "Refunded",
    className:
      "border-white/15 bg-white/[0.04] text-white/50",
  },
};

const ADMIN_LINKS = [
  {
    access: "orders",
    title: "Orders",
    href: "/admin/orders",
    description:
      "Review purchases, fulfilment status, payments and customer orders.",
    label: "Operations",
    icon: "orders",
  },

  {
    access: "products",
    title: "Products",
    href: "/admin/products",
    description:
      "Control products, private inventory, pricing and product information.",
    label: "Catalogue",
    icon: "products",
  },

  {
    access: "customers",
    title: "Customers",
    href: "/admin/customers",
    description:
      "Review customer accounts, order history and contact information.",
    label: "Relationships",
    icon: "customers",
  },

  {
    access: "collections",
    title: "Collections",
    href: "/admin/collections",
    description:
      "Manage collection identities, imagery and storefront presentation.",
    label: "Merchandising",
    icon: "collections",
  },

  {
    access: "coupons",
    title: "Coupons",
    href: "/admin/coupons",
    description:
      "Review promotional codes, campaign conditions and availability.",
    label: "Promotion",
    icon: "coupons",
  },

  {
    access: "content",
    title: "Content",
    href: "/admin/content/homepage",
    description:
      "Manage storefront content, brand pages, journal and footer information.",
    label: "CMS",
    icon: "content",
  },

  {
    access: "newsletter",
    title: "Newsletter",
    href: "/admin/newsletter",
    description:
      "Review subscribers and manage the OBSIDIAN audience.",
    label: "Audience",
    icon: "newsletter",
  },

  {
    access: "settings",
    title: "Settings",
    href: "/admin/settings",
    description:
      "Review permitted store configuration and notification preferences.",
    label: "Configuration",
    icon: "settings",
  },

  {
    access: "security",
    title: "Security",
    href: "/admin/security/audit-logs",
    description:
      "Review protected administrative activity and security audit records.",
    label: "Protection",
    icon: "security",
  },
];

function normalizeText(value) {
  return String(
    value ?? ""
  ).trim();
}

function normalizeNumber(value) {
  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(
      parsedValue
    )
  ) {
    return 0;
  }

  return parsedValue;
}

function normalizeStatus(value) {
  return normalizeText(
    value || "pending"
  ).toLowerCase();
}

function getOrderTotal(order) {
  return normalizeNumber(
    order?.pricing?.total ??
      order?.grandTotal ??
      order?.total ??
      order?.totalAmount
  );
}

function getOrderItemCount(order) {
  const items =
    Array.isArray(
      order?.items
    )
      ? order.items
      : [];

  return items.reduce(
    (
      total,
      item
    ) => {
      const quantity =
        normalizeNumber(
          item?.quantity
        );

      return (
        total +
        Math.max(
          1,
          quantity
        )
      );
    },
    0
  );
}

function getOrderReference(order) {
  return normalizeText(
    order?.orderId ||
      order?.trackingId ||
      order?._id ||
      "Order"
  );
}

function getCustomerName(order) {
  return (
    normalizeText(
      order?.customer
        ?.fullName ||
        order?.customer?.name ||
        order
          ?.shippingAddress
          ?.fullName ||
        order
          ?.shippingAddress
          ?.name ||
        order?.customerName
    ) ||
    "Unknown customer"
  );
}

function getPaymentMethod(order) {
  const method =
    normalizeText(
      order?.paymentMethod ||
        order?.payment
          ?.method ||
        order
          ?.paymentMethodLabel
    );

  if (!method) {
    return "Not specified";
  }

  return method
    .replaceAll(
      "_",
      " "
    )
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getPaymentStatus(order) {
  return normalizeStatus(
    order?.paymentStatus ||
      order?.payment
        ?.status ||
      "pending"
  );
}

function getProductStock(product) {
  const directStock =
    normalizeNumber(
      product?.stock
    );

  if (
    Array.isArray(
      product?.variants
    ) &&
    product.variants
      .length > 0
  ) {
    return product.variants.reduce(
      (
        total,
        variant
      ) =>
        total +
        Math.max(
          0,
          normalizeNumber(
            variant?.stock
          )
        ),
      0
    );
  }

  if (
    Array.isArray(
      product?.sizes
    ) &&
    product.sizes
      .length > 0
  ) {
    return product.sizes.reduce(
      (
        total,
        size
      ) =>
        total +
        Math.max(
          0,
          normalizeNumber(
            size?.stock
          )
        ),
      0
    );
  }

  return Math.max(
    0,
    directStock
  );
}

function getProductName(product) {
  return (
    normalizeText(
      product?.name ||
        product?.title ||
        product
          ?.productName
    ) ||
    "Untitled product"
  );
}

function getProductImage(product) {
  if (
    Array.isArray(
      product?.images
    ) &&
    product.images
      .length > 0
  ) {
    const firstImage =
      product.images[0];

    if (
      typeof firstImage ===
      "string"
    ) {
      return firstImage;
    }

    return normalizeText(
      firstImage?.url ||
        firstImage?.src
    );
  }

  return normalizeText(
    product?.image ||
      product?.imageUrl ||
      product?.thumbnail
  );
}

function getProductIdentifier(
  product
) {
  return normalizeText(
    product?.id ||
      product?.slug
  );
}

function formatCurrency(value) {
  return `৳${new Intl.NumberFormat(
    "en-BD",
    {
      maximumFractionDigits: 0,
    }
  ).format(
    normalizeNumber(
      value
    )
  )}`;
}

function formatCompactNumber(
  value
) {
  return new Intl.NumberFormat(
    "en",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(
    normalizeNumber(
      value
    )
  );
}

function formatDate(
  value,
  fallback = "Date unavailable"
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getMonthStart(
  date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function getPreviousMonthStart(
  date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() -
      1,
    1,
    0,
    0,
    0,
    0
  );
}

function isValidDate(value) {
  const date =
    new Date(value);

  return !Number.isNaN(
    date.getTime()
  );
}

function calculatePercentageChange(
  currentValue,
  previousValue
) {
  const current =
    normalizeNumber(
      currentValue
    );

  const previous =
    normalizeNumber(
      previousValue
    );

  if (
    previous === 0
  ) {
    return current > 0
      ? 100
      : 0;
  }

  return (
    ((current -
      previous) /
      previous) *
    100
  );
}

function formatPercentage(
  value
) {
  const normalizedValue =
    normalizeNumber(
      value
    );

  const roundedValue =
    Math.abs(
      normalizedValue
    ).toFixed(
      Math.abs(
        normalizedValue
      ) >= 10
        ? 0
        : 1
    );

  if (
    normalizedValue > 0
  ) {
    return `+${roundedValue}%`;
  }

  if (
    normalizedValue < 0
  ) {
    return `-${roundedValue}%`;
  }

  return "0%";
}

function createEmptyDashboardData() {
  return {
    available: true,

    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      averageOrderValue: 0,
      currentMonthRevenue: 0,
      previousMonthRevenue: 0,
      currentMonthOrders: 0,
      previousMonthOrders: 0,
      revenueChange: 0,
      ordersChange: 0,
      newCustomersThisMonth: 0,
    },

    statusCounts: {
      pending: 0,
      confirmed: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
    },

    recentOrders: [],
    lowStockItems: [],
    bestSellingProducts: [],
    salesTrend: [],
    paymentBreakdown: [],
  };
}

async function getDashboardData({
  canReadOrders,
  canReadProducts,
  canReadCustomers,
}) {
  const fallback =
    createEmptyDashboardData();

  if (
    !canReadOrders &&
    !canReadProducts &&
    !canReadCustomers
  ) {
    return fallback;
  }

  try {
    const client =
      await clientPromise;

    const db =
      client.db(
        process.env
          .MONGODB_DB ||
          "obsidian"
      );

    const now =
      new Date();

    const currentMonthStart =
      getMonthStart(now);

    const previousMonthStart =
      getPreviousMonthStart(
        now
      );

    const [
      orders,
      products,
      totalCustomers,
      newCustomersThisMonth,
    ] = await Promise.all([
      canReadOrders
        ? db
            .collection(
              "orders"
            )
            .find({})
            .sort({
              createdAt: -1,
            })
            .toArray()
        : Promise.resolve(
            []
          ),

      canReadProducts
        ? db
            .collection(
              "products"
            )
            .find({})
            .toArray()
        : Promise.resolve(
            []
          ),

      canReadCustomers
        ? db
            .collection(
              "customers"
            )
            .countDocuments()
            .catch(
              () => 0
            )
        : Promise.resolve(
            0
          ),

      canReadCustomers
        ? db
            .collection(
              "customers"
            )
            .countDocuments({
              createdAt: {
                $gte:
                  currentMonthStart,
              },
            })
            .catch(
              () => 0
            )
        : Promise.resolve(
            0
          ),
    ]);

    const validRevenueOrders =
      orders.filter(
        (order) => {
          const status =
            normalizeStatus(
              order?.status
            );

          return !REVENUE_EXCLUDED_STATUSES.includes(
            status
          );
        }
      );

    const totalRevenue =
      validRevenueOrders.reduce(
        (
          total,
          order
        ) =>
          total +
          getOrderTotal(
            order
          ),
        0
      );

    const currentMonthOrders =
      orders.filter(
        (order) => {
          if (
            !isValidDate(
              order?.createdAt
            )
          ) {
            return false;
          }

          return (
            new Date(
              order.createdAt
            ) >=
            currentMonthStart
          );
        }
      );

    const previousMonthOrders =
      orders.filter(
        (order) => {
          if (
            !isValidDate(
              order?.createdAt
            )
          ) {
            return false;
          }

          const createdAt =
            new Date(
              order.createdAt
            );

          return (
            createdAt >=
              previousMonthStart &&
            createdAt <
              currentMonthStart
          );
        }
      );

    const currentMonthRevenue =
      currentMonthOrders
        .filter(
          (order) =>
            !REVENUE_EXCLUDED_STATUSES.includes(
              normalizeStatus(
                order?.status
              )
            )
        )
        .reduce(
          (
            total,
            order
          ) =>
            total +
            getOrderTotal(
              order
            ),
          0
        );

    const previousMonthRevenue =
      previousMonthOrders
        .filter(
          (order) =>
            !REVENUE_EXCLUDED_STATUSES.includes(
              normalizeStatus(
                order?.status
              )
            )
        )
        .reduce(
          (
            total,
            order
          ) =>
            total +
            getOrderTotal(
              order
            ),
          0
        );

    const statusCounts = {
      ...fallback.statusCounts,
    };

    orders.forEach(
      (order) => {
        const status =
          normalizeStatus(
            order?.status
          );

        if (
          status ===
          "canceled"
        ) {
          statusCounts.cancelled +=
            1;

          return;
        }

        if (
          statusCounts[
            status
          ] !==
          undefined
        ) {
          statusCounts[
            status
          ] += 1;
        }
      }
    );

    const productInventory =
      products.map(
        (product) => ({
          ...product,

          calculatedStock:
            getProductStock(
              product
            ),
        })
      );

    const lowStockItems =
      productInventory
        .filter(
          (product) =>
            product
              .calculatedStock >
              0 &&
            product
              .calculatedStock <
              10
        )
        .sort(
          (
            firstProduct,
            secondProduct
          ) =>
            firstProduct
              .calculatedStock -
            secondProduct
              .calculatedStock
        )
        .slice(
          0,
          6
        );

    const outOfStockProducts =
      productInventory.filter(
        (product) =>
          product
            .calculatedStock <=
          0
      ).length;

    const productSalesMap =
      new Map();

    validRevenueOrders.forEach(
      (order) => {
        const items =
          Array.isArray(
            order?.items
          )
            ? order.items
            : [];

        items.forEach(
          (item) => {
            const productId =
              normalizeText(
                item
                  ?.productId ||
                  item?._id ||
                  item?.slug ||
                  item?.name
              );

            const productName =
              normalizeText(
                item?.name ||
                  item
                    ?.productName ||
                  item?.title
              ) ||
              "Untitled product";

            const quantity =
              Math.max(
                1,
                normalizeNumber(
                  item?.quantity
                )
              );

            const unitPrice =
              normalizeNumber(
                item?.price ??
                  item
                    ?.salePrice ??
                  item
                    ?.unitPrice
              );

            const mapKey =
              productId ||
              productName;

            const existingProduct =
              productSalesMap.get(
                mapKey
              ) || {
                id:
                  productId,

                name:
                  productName,

                quantity: 0,
                revenue: 0,
              };

            existingProduct.quantity +=
              quantity;

            existingProduct.revenue +=
              unitPrice *
              quantity;

            productSalesMap.set(
              mapKey,
              existingProduct
            );
          }
        );
      }
    );

    const bestSellingProducts =
      Array.from(
        productSalesMap.values()
      )
        .sort(
          (
            firstProduct,
            secondProduct
          ) =>
            secondProduct
              .quantity -
            firstProduct
              .quantity
        )
        .slice(
          0,
          5
        );

    const salesTrend =
      Array.from(
        {
          length: 7,
        },
        (
          _,
          index
        ) => {
          const date =
            new Date(
              now
            );

          date.setHours(
            0,
            0,
            0,
            0
          );

          date.setDate(
            now.getDate() -
              (6 -
                index)
          );

          const nextDate =
            new Date(
              date
            );

          nextDate.setDate(
            date.getDate() +
              1
          );

          const dayOrders =
            validRevenueOrders.filter(
              (
                order
              ) => {
                if (
                  !isValidDate(
                    order
                      ?.createdAt
                  )
                ) {
                  return false;
                }

                const createdAt =
                  new Date(
                    order.createdAt
                  );

                return (
                  createdAt >=
                    date &&
                  createdAt <
                    nextDate
                );
              }
            );

          return {
            label:
              new Intl.DateTimeFormat(
                "en-GB",
                {
                  weekday:
                    "short",
                }
              ).format(
                date
              ),

            date:
              date.toISOString(),

            revenue:
              dayOrders.reduce(
                (
                  total,
                  order
                ) =>
                  total +
                  getOrderTotal(
                    order
                  ),
                0
              ),

            orders:
              dayOrders.length,
          };
        }
      );

    const paymentMap =
      new Map();

    orders.forEach(
      (order) => {
        const method =
          getPaymentMethod(
            order
          );

        const existing =
          paymentMap.get(
            method
          ) || {
            method,
            orders: 0,
            revenue: 0,
          };

        existing.orders +=
          1;

        if (
          !REVENUE_EXCLUDED_STATUSES.includes(
            normalizeStatus(
              order?.status
            )
          )
        ) {
          existing.revenue +=
            getOrderTotal(
              order
            );
        }

        paymentMap.set(
          method,
          existing
        );
      }
    );

    const paymentBreakdown =
      Array.from(
        paymentMap.values()
      )
        .sort(
          (
            firstMethod,
            secondMethod
          ) =>
            secondMethod
              .orders -
            firstMethod
              .orders
        )
        .slice(
          0,
          4
        );

    const activeOrders =
      orders.filter(
        (order) =>
          ACTIVE_ORDER_STATUSES.includes(
            normalizeStatus(
              order?.status
            )
          )
      ).length;

    const completedOrders =
      orders.filter(
        (order) =>
          [
            "delivered",
            "completed",
          ].includes(
            normalizeStatus(
              order?.status
            )
          )
      ).length;

    const cancelledOrders =
      orders.filter(
        (order) =>
          [
            "cancelled",
            "canceled",
          ].includes(
            normalizeStatus(
              order?.status
            )
          )
      ).length;

    return {
      available: true,

      stats: {
        totalRevenue,
        totalOrders:
          orders.length,

        totalProducts:
          products.length,

        totalCustomers,

        activeOrders,
        completedOrders,
        cancelledOrders,

        lowStockProducts:
          lowStockItems.length,

        outOfStockProducts,

        averageOrderValue:
          validRevenueOrders
            .length > 0
            ? totalRevenue /
              validRevenueOrders.length
            : 0,

        currentMonthRevenue,
        previousMonthRevenue,

        currentMonthOrders:
          currentMonthOrders.length,

        previousMonthOrders:
          previousMonthOrders.length,

        revenueChange:
          calculatePercentageChange(
            currentMonthRevenue,
            previousMonthRevenue
          ),

        ordersChange:
          calculatePercentageChange(
            currentMonthOrders.length,
            previousMonthOrders.length
          ),

        newCustomersThisMonth,
      },

      statusCounts,

      recentOrders:
        orders.slice(
          0,
          6
        ),

      lowStockItems:
        lowStockItems.map(
          (product) => ({
            id:
              getProductIdentifier(
                product
              ),

            name:
              getProductName(
                product
              ),

            stock:
              product
                .calculatedStock,

            image:
              getProductImage(
                product
              ),
          })
        ),

      bestSellingProducts,
      salesTrend,
      paymentBreakdown,
    };
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return {
      ...fallback,
      available: false,
    };
  }
}

function getStatusConfig(
  status
) {
  const normalizedStatus =
    normalizeStatus(
      status
    );

  return (
    STATUS_CONFIG[
      normalizedStatus
    ] || {
      label:
        normalizedStatus
          .replaceAll(
            "_",
            " "
          )
          .split(" ")
          .filter(
            Boolean
          )
          .map(
            (word) =>
              word
                .charAt(0)
                .toUpperCase() +
              word.slice(1)
          )
          .join(" "),

      className:
        "border-white/15 bg-white/[0.04] text-white/50",
    }
  );
}

function DashboardIcon({
  type,
  className = "h-5 w-5",
}) {
  const commonProps = {
    viewBox:
      "0 0 24 24",

    fill: "none",
    stroke:
      "currentColor",

    strokeWidth:
      "1.4",

    strokeLinecap:
      "round",

    strokeLinejoin:
      "round",

    className,
    "aria-hidden": true,
  };

  if (
    type === "orders"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M4 7.5h16v12H4z" />
        <path d="M8 7.5V5.8C8 4.25 9.35 3 11 3h2c1.65 0 3 1.25 3 2.8v1.7" />
        <path d="M4 11h16" />
        <path d="M10 15h4" />
      </svg>
    );
  }

  if (
    type === "products"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </svg>
    );
  }

  if (
    type === "customers"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <circle
          cx="17"
          cy="9"
          r="2.2"
        />

        <path d="M3.5 20c.6-4 2.5-6 5.5-6s4.9 2 5.5 6" />
        <path d="M14 15c2.8.2 4.6 1.8 5 5" />
      </svg>
    );
  }

  if (
    type ===
    "collections"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
        />
      </svg>
    );
  }

  if (
    type === "coupons"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M3 8.5A2.5 2.5 0 0 0 5.5 11 2.5 2.5 0 0 0 3 13.5V18h18v-4.5a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 21 8.5V4H3v4.5Z" />
        <path d="m9 16 6-10" />
        <circle
          cx="9"
          cy="8"
          r=".8"
        />
        <circle
          cx="15"
          cy="14"
          r=".8"
        />
      </svg>
    );
  }

  if (
    type === "content"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M5 3h14v18H5z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    );
  }

  if (
    type ===
    "newsletter"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M3 5h18v14H3z" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  if (
    type ===
    "settings"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <circle
          cx="12"
          cy="12"
          r="3"
        />

        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.1A1.7 1.7 0 0 0 8.4 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 14.9a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.3 13.5H2v-4h.3A1.7 1.7 0 0 0 3.9 8.4a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.36 3.6l.06.06A1.7 1.7 0 0 0 8.3 4a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 9.7 2.3V2h4v.3A1.7 1.7 0 0 0 14.8 3.9a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.2 8.3a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  if (
    type === "security"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-5" />
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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        className
      }
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MetricCard({
  number,
  label,
  value,
  description,
  change,
  positive,
}) {
  return (
    <article className="group relative overflow-hidden border border-white/10 bg-white/[0.025] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045] sm:p-7">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-white/[0.04] transition-transform duration-700 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/35">
            {label}
          </p>

          <p className="mt-6 break-words font-heading text-4xl font-light tracking-[-0.04em] text-[#f1ece4] sm:text-5xl">
            {value}
          </p>
        </div>

        <span className="font-heading text-2xl italic text-white/10">
          {number}
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <p className="max-w-[15rem] text-xs leading-6 text-white/35">
          {description}
        </p>

        {change !==
        undefined ? (
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] ${
              positive
                ? "text-[#9fbea2]"
                : change ===
                    0
                  ? "text-white/35"
                  : "text-[#d18d87]"
            }`}
          >
            {formatPercentage(
              change
            )}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function AdminActionCard({
  number,
  title,
  href,
  description,
  label,
  icon,
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden border border-white/10 bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05] sm:p-7"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/[0.04] transition-transform duration-700 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-5">
        <span className="flex h-11 w-11 items-center justify-center border border-white/10 text-white/50 transition-all duration-500 group-hover:border-[#d1c3a2]/30 group-hover:bg-[#d1c3a2] group-hover:text-[#11100e]">
          <DashboardIcon
            type={icon}
          />
        </span>

        <span className="font-heading text-2xl italic text-white/10">
          {number}
        </span>
      </div>

      <div className="relative mt-12">
        <p className="text-[8px] font-semibold uppercase tracking-[0.27em] text-[#cdbf9e]/60">
          {label}
        </p>

        <h3 className="mt-3 font-heading text-3xl font-light tracking-[-0.03em]">
          {title}
        </h3>

        <p className="mt-4 text-xs leading-6 text-white/38">
          {description}
        </p>

        <div className="mt-7 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/50 transition-colors group-hover:text-white">
          Open workspace

          <span className="h-px w-7 bg-current transition-all duration-500 group-hover:w-12" />

          <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function SalesChart({
  data,
}) {
  const maximumRevenue =
    Math.max(
      ...data.map(
        (item) =>
          normalizeNumber(
            item.revenue
          )
      ),
      1
    );

  const totalRevenue =
    data.reduce(
      (
        total,
        item
      ) =>
        total +
        normalizeNumber(
          item.revenue
        ),
      0
    );

  const totalOrders =
    data.reduce(
      (
        total,
        item
      ) =>
        total +
        normalizeNumber(
          item.orders
        ),
      0
    );

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]/65">
            Seven-day performance
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light tracking-[-0.03em] sm:text-4xl">
            Sales movement
          </h2>
        </div>

        <div className="flex gap-8">
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">
              Revenue
            </p>

            <p className="mt-2 font-heading text-xl text-[#ddd0af]">
              {formatCurrency(
                totalRevenue
              )}
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">
              Orders
            </p>

            <p className="mt-2 font-heading text-xl text-white/75">
              {totalOrders}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-9 flex h-[250px] items-end gap-3 sm:gap-5">
        {data.map(
          (item) => {
            const height =
              Math.max(
                4,
                (normalizeNumber(
                  item.revenue
                ) /
                  maximumRevenue) *
                  100
              );

            return (
              <div
                key={
                  item.date
                }
                className="group flex h-full min-w-0 flex-1 flex-col justify-end"
              >
                <div className="flex h-full items-end">
                  <div
                    className="relative w-full min-w-0 bg-gradient-to-t from-[#8e8064] to-[#d5c7a5] transition-all duration-500 group-hover:brightness-110"
                    style={{
                      height: `${height}%`,
                    }}
                  >
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 hidden -translate-x-1/2 whitespace-nowrap border border-white/10 bg-[#11100e] px-3 py-2 text-center shadow-2xl group-hover:block">
                      <p className="text-[9px] text-[#ddd0af]">
                        {formatCurrency(
                          item.revenue
                        )}
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/35">
                        {
                          item.orders
                        }{" "}
                        orders
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/35">
                    {
                      item.label
                    }
                  </p>

                  <p className="mt-1 hidden text-[8px] text-white/20 sm:block">
                    {
                      item.orders
                    }
                  </p>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function OrderPipeline({
  statusCounts,
  totalOrders,
}) {
  const pipeline = [
    {
      key: "pending",
      label: "Pending",
      value:
        statusCounts.pending,
    },

    {
      key: "confirmed",
      label: "Confirmed",
      value:
        statusCounts.confirmed,
    },

    {
      key: "processing",
      label: "Processing",
      value:
        statusCounts.processing,
    },

    {
      key: "packed",
      label: "Packed",
      value:
        statusCounts.packed,
    },

    {
      key: "shipped",
      label: "Shipped",
      value:
        statusCounts.shipped,
    },

    {
      key:
        "out_for_delivery",
      label:
        "Out for delivery",

      value:
        statusCounts
          .out_for_delivery,
    },

    {
      key: "delivered",
      label: "Delivered",

      value:
        statusCounts.delivered +
        statusCounts.completed,
    },

    {
      key: "cancelled",
      label: "Cancelled",

      value:
        statusCounts.cancelled,
    },
  ];

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="flex items-end justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]/65">
            Fulfilment status
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light tracking-[-0.03em]">
            Order pipeline
          </h2>
        </div>

        <span className="font-heading text-3xl font-light text-white/20">
          {totalOrders}
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {pipeline.map(
          (item) => {
            const percentage =
              totalOrders >
              0
                ? (item.value /
                    totalOrders) *
                  100
                : 0;

            return (
              <div
                key={
                  item.key
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {
                      item.label
                    }
                  </span>

                  <span className="font-heading text-lg text-white/65">
                    {
                      item.value
                    }
                  </span>
                </div>

                <div className="mt-2 h-1 overflow-hidden bg-white/[0.06]">
                  <div
                    className="h-full bg-[#cdbf9e]"
                    style={{
                      width: `${Math.max(
                        item.value >
                          0
                          ? 3
                          : 0,
                        percentage
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </div>

      <Link
        href="/admin/orders"
        className="group mt-8 inline-flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white"
      >
        Manage orders

        <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function RecentOrders({
  orders,
}) {
  return (
    <section className="border border-white/10">
      <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]/65">
            Live operations
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light tracking-[-0.03em] sm:text-4xl">
            Recent orders
          </h2>
        </div>

        <Link
          href="/admin/orders"
          className="group inline-flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white"
        >
          View all orders

          <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {orders.length ===
      0 ? (
        <div className="px-6 py-14 text-center sm:px-8">
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">
            No recent orders found
          </p>

          <p className="mt-4 font-heading text-2xl font-light text-white/60">
            New orders will appear here.
          </p>
        </div>
      ) : (
        <div>
          {orders.map(
            (order) => {
              const status =
                getStatusConfig(
                  order?.status
                );

              const reference =
                getOrderReference(
                  order
                );

              const paymentStatus =
                getPaymentStatus(
                  order
                );

              return (
                <Link
                  key={
                    normalizeText(
                      order?._id
                    ) ||
                    reference
                  }
                  href={`/admin/orders/${encodeURIComponent(
                    reference
                  )}`}
                  className="group grid gap-5 border-b border-white/10 px-6 py-6 transition-colors last:border-b-0 hover:bg-white/[0.035] sm:px-8 lg:grid-cols-[1.1fr_1.2fr_0.8fr_0.7fr_0.7fr]"
                >
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
                      Order
                    </p>

                    <p className="mt-2 truncate text-sm font-medium text-white/80">
                      {
                        reference
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-white/30">
                      {formatDate(
                        order
                          ?.createdAt
                      )}

                      {formatTime(
                        order
                          ?.createdAt
                      )
                        ? ` · ${formatTime(
                            order.createdAt
                          )}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
                      Customer
                    </p>

                    <p className="mt-2 truncate text-sm text-white/65">
                      {getCustomerName(
                        order
                      )}
                    </p>

                    <p className="mt-1 text-[10px] text-white/30">
                      {getOrderItemCount(
                        order
                      )}{" "}
                      items
                    </p>
                  </div>

                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.15em] ${status.className}`}
                    >
                      {
                        status.label
                      }
                    </span>
                  </div>

                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
                      Payment
                    </p>

                    <p className="mt-2 text-xs capitalize text-white/55">
                      {
                        paymentStatus
                      }
                    </p>

                    <p className="mt-1 truncate text-[9px] text-white/28">
                      {getPaymentMethod(
                        order
                      )}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4 lg:block lg:text-right">
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
                        Total
                      </p>

                      <p className="mt-2 font-heading text-xl text-[#d8ccae]">
                        {formatCurrency(
                          getOrderTotal(
                            order
                          )
                        )}
                      </p>
                    </div>

                    <ArrowIcon className="h-4 w-4 text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white lg:ml-auto lg:mt-3" />
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function InventoryPanel({
  lowStockItems,
  outOfStockProducts,
}) {
  return (
    <section className="border border-white/10 bg-white/[0.02]">
      <div className="flex items-end justify-between gap-5 border-b border-white/10 p-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#cdbf9e]/60">
            Inventory control
          </p>

          <h2 className="mt-3 font-heading text-3xl font-light">
            Stock alerts
          </h2>
        </div>

        {outOfStockProducts >
        0 ? (
          <span className="border border-[#a75f59]/30 bg-[#a75f59]/10 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.15em] text-[#d18d87]">
            {
              outOfStockProducts
            }{" "}
            sold out
          </span>
        ) : null}
      </div>

      {lowStockItems.length ===
      0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-[9px] uppercase tracking-[0.23em] text-white/30">
            Inventory healthy
          </p>

          <p className="mt-3 text-sm leading-6 text-white/45">
            No low-stock products require attention.
          </p>
        </div>
      ) : (
        <div>
          {lowStockItems.map(
            (product) => (
              <Link
                key={
                  product.id ||
                  product.name
                }
                href={
                  product.id
                    ? `/admin/products/${encodeURIComponent(
                        product.id
                      )}`
                    : "/admin/products"
                }
                className="group flex items-center gap-4 border-b border-white/10 p-5 transition-colors last:border-b-0 hover:bg-white/[0.035]"
              >
                <div className="h-14 w-12 shrink-0 overflow-hidden bg-white/[0.04]">
                  {product.image ? (
                    <img
                      src={
                        product.image
                      }
                      alt={
                        product.name
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-heading text-xl italic text-white/15">
                      O
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/65">
                    {
                      product.name
                    }
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-white/25">
                    Product inventory
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-heading text-2xl text-[#d8b676]">
                    {
                      product.stock
                    }
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/25">
                    remaining
                  </p>
                </div>
              </Link>
            )
          )}
        </div>
      )}

      <Link
        href="/admin/products"
        className="group flex items-center justify-between border-t border-white/10 px-6 py-5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
      >
        Manage inventory

        <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </section>
  );
}

function BestSellingPanel({
  products,
  canOpenProducts,
}) {
  const maximumQuantity =
    Math.max(
      ...products.map(
        (product) =>
          normalizeNumber(
            product.quantity
          )
      ),
      1
    );

  return (
    <section className="border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 p-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#cdbf9e]/60">
          Order performance
        </p>

        <h2 className="mt-3 font-heading text-3xl font-light">
          Best sellers
        </h2>
      </div>

      {products.length ===
      0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-[9px] uppercase tracking-[0.23em] text-white/30">
            No sales data yet
          </p>

          <p className="mt-3 text-sm leading-6 text-white/45">
            Product performance will appear after orders are placed.
          </p>
        </div>
      ) : (
        <div className="p-6">
          <div className="space-y-6">
            {products.map(
              (
                product,
                index
              ) => {
                const percentage =
                  (normalizeNumber(
                    product.quantity
                  ) /
                    maximumQuantity) *
                  100;

                return (
                  <div
                    key={
                      product.id ||
                      `${product.name}-${index}`
                    }
                  >
                    <div className="flex items-center justify-between gap-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/65">
                          {
                            product.name
                          }
                        </p>

                        <p className="mt-1 text-[8px] uppercase tracking-[0.17em] text-white/25">
                          {formatCurrency(
                            product.revenue
                          )}{" "}
                          revenue
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-heading text-xl text-[#d8ccae]">
                          {
                            product.quantity
                          }
                        </p>

                        <p className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                          sold
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1 overflow-hidden bg-white/[0.06]">
                      <div
                        className="h-full bg-[#cdbf9e]"
                        style={{
                          width: `${Math.max(
                            4,
                            percentage
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {canOpenProducts ? (
        <Link
          href="/admin/products"
          className="group flex items-center justify-between border-t border-white/10 px-6 py-5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
        >
          View products

          <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </section>
  );
}

function PaymentPanel({
  methods,
}) {
  const totalPaymentOrders =
    methods.reduce(
      (
        total,
        method
      ) =>
        total +
        method.orders,
      0
    );

  return (
    <section className="border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#cdbf9e]/60">
        Checkout activity
      </p>

      <h2 className="mt-3 font-heading text-3xl font-light">
        Payment methods
      </h2>

      {methods.length ===
      0 ? (
        <p className="mt-8 text-sm leading-6 text-white/40">
          Payment activity will appear after customers place orders.
        </p>
      ) : (
        <div className="mt-7 space-y-4">
          {methods.map(
            (method) => {
              const percentage =
                totalPaymentOrders >
                0
                  ? (method.orders /
                      totalPaymentOrders) *
                    100
                  : 0;

              return (
                <div
                  key={
                    method.method
                  }
                  className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/60">
                        {
                          method.method
                        }
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/25">
                        {
                          method.orders
                        }{" "}
                        orders
                      </p>
                    </div>

                    <p className="font-heading text-lg text-[#d8ccae]">
                      {formatPercentage(
                        percentage
                      )}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function EmptyMetricsPanel() {
  return (
    <section className="border border-white/10 bg-white/[0.02] px-6 py-12 text-center sm:px-8">
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]/65">
        Role-based dashboard
      </p>

      <h2 className="mt-4 font-heading text-3xl font-light text-white/75">
        No operational metrics assigned
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/38">
        This role can access its authorised workspaces without receiving
        orders, customer or private inventory analytics.
      </p>
    </section>
  );
}

export default async function AdminPage() {
  await requireAdminPermission(
    {
      dashboard: [
        "read",
      ],
    },
    {
      path: "/admin",
    }
  );

  const [
    canReadOrders,
    canReadCustomers,
    canReadProducts,
    canReadCollections,
    canReadCoupons,
    canReadContent,
    canReadNewsletter,
    canReadSettings,
    canReadNotifications,
    canReadSecurityAudit,
  ] = await Promise.all([
    hasAdminPermission({
      orders: ["read"],
    }),

    hasAdminPermission({
      customers: ["read"],
    }),

    hasAdminPermission({
      products: [
        "read_private",
      ],
    }),

    hasAdminPermission({
      collections: [
        "read_private",
      ],
    }),

    hasAdminPermission({
      coupons: ["read"],
    }),

    hasAdminPermission({
      content: ["read"],
    }),

    hasAdminPermission({
      newsletter: [
        "read",
      ],
    }),

    hasAdminPermission({
      settings: ["read"],
    }),

    hasAdminPermission({
      notifications: [
        "read",
      ],
    }),

    hasAdminPermission({
      security: [
        "read_audit",
      ],
    }),
  ]);

  const workspaceAccess = {
    orders:
      canReadOrders,

    customers:
      canReadCustomers,

    products:
      canReadProducts,

    collections:
      canReadCollections,

    coupons:
      canReadCoupons,

    content:
      canReadContent,

    newsletter:
      canReadNewsletter,

    settings:
      canReadSettings ||
      canReadNotifications,

    security:
      canReadSecurityAudit,
  };

  const visibleAdminLinks =
    ADMIN_LINKS
      .filter(
        (item) =>
          workspaceAccess[
            item.access
          ] === true
      )
      .map(
        (
          item,
          index
        ) => ({
          ...item,

          number:
            String(
              index + 1
            ).padStart(
              2,
              "0"
            ),
        })
      );

  const dashboard =
    await getDashboardData({
      canReadOrders,
      canReadProducts,
      canReadCustomers,
    });

  const {
    stats,
  } = dashboard;

  const dashboardMetrics =
    [];

  if (
    canReadOrders
  ) {
    dashboardMetrics.push(
      {
        label:
          "Total revenue",

        value:
          formatCurrency(
            stats.totalRevenue
          ),

        description: `${formatCurrency(
          stats.currentMonthRevenue
        )} recorded this month`,

        change:
          stats.revenueChange,

        positive:
          stats.revenueChange >=
          0,
      },

      {
        label:
          "Total orders",

        value:
          formatCompactNumber(
            stats.totalOrders
          ),

        description: `${stats.activeOrders} orders currently active`,

        change:
          stats.ordersChange,

        positive:
          stats.ordersChange >=
          0,
      },

      {
        label:
          "Average order",

        value:
          formatCurrency(
            stats.averageOrderValue
          ),

        description:
          "Average value across revenue-generating orders",
      },

      {
        label:
          "Completed",

        value:
          formatCompactNumber(
            stats.completedOrders
          ),

        description: `${stats.cancelledOrders} orders cancelled`,
      }
    );
  }

  if (
    canReadProducts
  ) {
    dashboardMetrics.push({
      label: "Products",

      value:
        formatCompactNumber(
          stats.totalProducts
        ),

      description: `${stats.lowStockProducts} low stock · ${stats.outOfStockProducts} sold out`,
    });
  }

  if (
    canReadCustomers
  ) {
    dashboardMetrics.push({
      label: "Customers",

      value:
        formatCompactNumber(
          stats.totalCustomers
        ),

      description: `${stats.newCustomersThisMonth} new customers this month`,
    });
  }

  const numberedMetrics =
    dashboardMetrics.map(
      (
        metric,
        index
      ) => ({
        ...metric,

        number:
          String(
            index + 1
          ).padStart(
            2,
            "0"
          ),
      })
    );

  const footerLinks =
    visibleAdminLinks.slice(
      0,
      4
    );

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0a] text-[#f1ece4]">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(205,191,158,0.16),transparent_28%),radial-gradient(circle_at_15%_88%,rgba(255,255,255,0.04),transparent_25%)]" />

          <div className="absolute -right-64 -top-72 h-[48rem] w-[48rem] rounded-full border border-white/[0.035]" />

          <div className="absolute -right-12 -top-12 h-[25rem] w-[25rem] rotate-45 border border-white/[0.035]" />

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#cdbf9e]/25 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1540px] px-5 pb-14 pt-6 sm:px-8 sm:pb-18 lg:px-12 xl:px-16">
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <Link
              href="/admin"
              className="group inline-flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-white/15 transition-colors group-hover:border-white/40">
                <span className="h-3.5 w-3.5 rotate-45 border border-white/65 transition-transform duration-700 group-hover:rotate-[225deg]" />
              </span>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-[0.32em]">
                  OBSIDIAN
                </span>

                <span className="mt-1 block text-[7px] font-semibold uppercase tracking-[0.24em] text-white/25">
                  Administration
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden min-h-10 items-center border border-white/15 px-5 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/55 transition-all hover:border-white/40 hover:text-white sm:inline-flex"
              >
                View storefront
              </Link>

              <AdminLogoutButton />
            </div>
          </header>

          <div className="grid gap-10 pb-2 pt-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-16 lg:pt-20">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#cdbf9e]" />

                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#cdbf9e]">
                  Permission-aware workspace
                </p>
              </div>

              <h1 className="mt-7 max-w-4xl font-heading text-[3.7rem] font-light leading-[0.87] tracking-[-0.055em] sm:text-[5.5rem] lg:text-[7rem]">
                Command

                <span className="block italic text-[#cdbf9e]">
                  centre.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-sm leading-7 text-white/45 sm:text-base sm:leading-8">
                Review authorised business information and open only the
                OBSIDIAN workspaces assigned to your administrative role.
              </p>
            </div>

            <div className="border-t border-white/10 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {canReadOrders ? (
                <>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#cdbf9e]/65">
                    Current month
                  </p>

                  <p className="mt-4 font-heading text-4xl font-light tracking-[-0.04em] text-[#e0d4b6]">
                    {formatCurrency(
                      stats.currentMonthRevenue
                    )}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    Revenue generated across{" "}
                    {stats.currentMonthOrders}{" "}
                    order
                    {stats.currentMonthOrders ===
                    1
                      ? ""
                      : "s"}
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#cdbf9e]/65">
                    Authorised scope
                  </p>

                  <p className="mt-4 font-heading text-4xl font-light tracking-[-0.04em] text-[#e0d4b6]">
                    {
                      visibleAdminLinks.length
                    }
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    Administrative workspace
                    {visibleAdminLinks.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    available to this role.
                  </p>
                </>
              )}

              <div className="mt-7 grid grid-cols-2 gap-px bg-white/10">
                <div className="bg-[#0b0b0a] py-4 pr-4">
                  <p className="text-[7px] uppercase tracking-[0.2em] text-white/25">
                    Workspaces
                  </p>

                  <p className="mt-2 font-heading text-xl text-white/65">
                    {
                      visibleAdminLinks.length
                    }
                  </p>
                </div>

                <div className="bg-[#0b0b0a] py-4 pl-4">
                  <p className="text-[7px] uppercase tracking-[0.2em] text-white/25">
                    Access mode
                  </p>

                  <p className="mt-2 font-heading text-xl text-[#d8b676]">
                    Scoped
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!dashboard.available ? (
        <div className="border-b border-[#a75f59]/20 bg-[#a75f59]/10 px-5 py-4 text-center text-xs text-[#d49b96]">
          Authorised dashboard data could not be loaded. Safe fallback
          values are being displayed.
        </div>
      ) : null}

      <div className="mx-auto max-w-[1540px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16">
        {numberedMetrics.length >
        0 ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {numberedMetrics.map(
              (metric) => (
                <MetricCard
                  key={
                    metric.label
                  }
                  {...metric}
                />
              )
            )}
          </section>
        ) : (
          <EmptyMetricsPanel />
        )}

        {canReadOrders ? (
          <section className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)]">
            <SalesChart
              data={
                dashboard.salesTrend
              }
            />

            <OrderPipeline
              statusCounts={
                dashboard.statusCounts
              }
              totalOrders={
                stats.totalOrders
              }
            />
          </section>
        ) : null}

        <section className="mt-16">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#cdbf9e]/65">
                Administrative workspace
              </p>

              <h2 className="mt-3 max-w-3xl font-heading text-[2.8rem] font-light leading-none tracking-[-0.04em] sm:text-[4rem]">
                Your authorised

                <span className="block italic text-white/25">
                  operational layers.
                </span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/38">
              Only workspaces permitted by the active role are displayed
              below. Hidden workspaces remain inaccessible at both page
              and API level.
            </p>
          </div>

          {visibleAdminLinks.length >
          0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleAdminLinks.map(
                (item) => (
                  <AdminActionCard
                    key={
                      item.href
                    }
                    {...item}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-8 border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm text-white/45">
                No additional administrative workspace is assigned to
                this role.
              </p>
            </div>
          )}
        </section>

        {canReadOrders ? (
          <section className="mt-16">
            <RecentOrders
              orders={
                dashboard.recentOrders
              }
            />
          </section>
        ) : null}

        {canReadOrders ||
        canReadProducts ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {canReadProducts ? (
              <InventoryPanel
                lowStockItems={
                  dashboard.lowStockItems
                }
                outOfStockProducts={
                  stats.outOfStockProducts
                }
              />
            ) : null}

            {canReadOrders ? (
              <BestSellingPanel
                products={
                  dashboard.bestSellingProducts
                }
                canOpenProducts={
                  canReadProducts
                }
              />
            ) : null}

            {canReadOrders ? (
              <PaymentPanel
                methods={
                  dashboard.paymentBreakdown
                }
              />
            ) : null}
          </section>
        ) : null}
      </div>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
          <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-white/25">
            OBSIDIAN administration system
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map(
              (item) => (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
                >
                  {
                    item.title
                  }
                </Link>
              )
            )}

            <Link
              href="/"
              className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
            >
              Storefront
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}