import "server-only";

import {
  PRODUCTS_COLLECTION_NAME,
  createCatalogSlug,
  getPublicProductQuery,
  normalizeCatalogText,
  normalizeSeriesName,
} from "./catalog";
import {
  DEFAULT_SETTINGS,
  SETTINGS_COLLECTION_NAME,
  normalizeSettings,
} from "./settings";

export const ORDERS_COLLECTION_NAME = "orders";
export const COUPONS_COLLECTION_NAME = "coupons";

export const ORDER_LIMITS = Object.freeze({
  maximumCartLines: 50,
  maximumQuantityPerLine: 20,
  maximumTotalQuantity: 100,
  maximumCouponCodeLength: 50,
  maximumSizeLength: 40,
  maximumProductIdLength: 100,
});

const SUPPORTED_PAYMENT_METHODS = Object.freeze({
  cash_on_delivery: {
    settingsKey: "cashOnDelivery",
    label: "Cash on Delivery",
  },
  bkash: {
    settingsKey: "bkash",
    label: "bKash",
  },
  nagad: {
    settingsKey: "nagad",
    label: "Nagad",
  },
  rocket: {
    settingsKey: "rocket",
    label: "Rocket",
  },
});

const SUPPORTED_COUPON_TYPES = new Set([
  "percentage",
  "fixed",
  "free_shipping",
]);

export class OrderPricingError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "INVALID_ORDER",
      details = null,
    } = {}
  ) {
    super(message);

    this.name = "OrderPricingError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function createDatabaseOptions(session) {
  return session
    ? {
        session,
      }
    : {};
}

function throwPricingError(
  message,
  status = 400,
  code = "INVALID_ORDER",
  details = null
) {
  throw new OrderPricingError(message, {
    status,
    code,
    details,
  });
}

export function normalizeOrderMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(amount * 100) / 100
  );
}

export function normalizeCouponCode(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeOrderSize(value) {
  return normalizeCatalogText(value).slice(
    0,
    ORDER_LIMITS.maximumSizeLength
  );
}

function normalizePaymentMethod(value) {
  const normalizedValue = normalizeCatalogText(
    value,
    "cash_on_delivery"
  )
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalizedValue === "cod" ||
    normalizedValue === "cash"
  ) {
    return "cash_on_delivery";
  }

  return normalizedValue;
}

export function normalizeDeliveryArea(value) {
  const deliveryArea = normalizeCatalogText(value);

  if (
    deliveryArea !== "inside_dhaka" &&
    deliveryArea !== "outside_dhaka"
  ) {
    throwPricingError(
      "Please select a valid delivery area.",
      400,
      "INVALID_DELIVERY_AREA"
    );
  }

  return deliveryArea;
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity)
  ) {
    throwPricingError(
      "Product quantity must be a whole number.",
      400,
      "INVALID_QUANTITY"
    );
  }

  if (quantity < 1) {
    throwPricingError(
      "Product quantity must be at least one.",
      400,
      "INVALID_QUANTITY"
    );
  }

  if (
    quantity >
    ORDER_LIMITS.maximumQuantityPerLine
  ) {
    throwPricingError(
      `A maximum of ${ORDER_LIMITS.maximumQuantityPerLine} units of one product can be ordered at a time.`,
      400,
      "QUANTITY_LIMIT_EXCEEDED"
    );
  }

  return quantity;
}

export function normalizeRequestedOrderItems(items) {
  if (!Array.isArray(items)) {
    throwPricingError(
      "Order items must be provided as a list.",
      400,
      "INVALID_ITEMS"
    );
  }

  if (items.length === 0) {
    throwPricingError(
      "Your cart is empty.",
      400,
      "EMPTY_CART"
    );
  }

  if (
    items.length >
    ORDER_LIMITS.maximumCartLines
  ) {
    throwPricingError(
      `An order cannot contain more than ${ORDER_LIMITS.maximumCartLines} cart lines.`,
      400,
      "CART_LINE_LIMIT_EXCEEDED"
    );
  }

  const mergedItems = new Map();

  for (const rawItem of items) {
    if (!isPlainObject(rawItem)) {
      throwPricingError(
        "One of the order items is invalid.",
        400,
        "INVALID_ITEM"
      );
    }

    const productId = createCatalogSlug(
      rawItem.id
    );

    if (!productId) {
      throwPricingError(
        "One of the order items has an invalid product ID.",
        400,
        "INVALID_PRODUCT_ID"
      );
    }

    if (
      productId.length >
      ORDER_LIMITS.maximumProductIdLength
    ) {
      throwPricingError(
        "One of the product IDs is too long.",
        400,
        "INVALID_PRODUCT_ID"
      );
    }

    const size = normalizeOrderSize(
      rawItem.size
    );

    const quantity = normalizeQuantity(
      rawItem.quantity
    );

    const mergeKey = `${productId}\u0000${size.toLocaleLowerCase(
      "en"
    )}`;

    const existingItem = mergedItems.get(
      mergeKey
    );

    if (existingItem) {
      const mergedQuantity =
        existingItem.quantity + quantity;

      if (
        mergedQuantity >
        ORDER_LIMITS.maximumQuantityPerLine
      ) {
        throwPricingError(
          `A maximum of ${ORDER_LIMITS.maximumQuantityPerLine} units of one product and size can be ordered at a time.`,
          400,
          "QUANTITY_LIMIT_EXCEEDED"
        );
      }

      existingItem.quantity =
        mergedQuantity;

      continue;
    }

    mergedItems.set(mergeKey, {
      id: productId,
      size,
      quantity,
    });
  }

  const normalizedItems = Array.from(
    mergedItems.values()
  );

  const totalQuantity =
    normalizedItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  if (
    totalQuantity >
    ORDER_LIMITS.maximumTotalQuantity
  ) {
    throwPricingError(
      `An order cannot contain more than ${ORDER_LIMITS.maximumTotalQuantity} total units.`,
      400,
      "TOTAL_QUANTITY_LIMIT_EXCEEDED"
    );
  }

  return normalizedItems;
}

function getProductPrice(product) {
  const price = Number(product?.price);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throwPricingError(
      `${
        normalizeCatalogText(
          product?.name,
          "A selected product"
        )
      } has an invalid price.`,
      409,
      "INVALID_PRODUCT_PRICE"
    );
  }

  return normalizeOrderMoney(price);
}

function getProductImage(product) {
  const primaryImage = normalizeCatalogText(
    product?.image
  );

  if (primaryImage) {
    return primaryImage;
  }

  if (Array.isArray(product?.images)) {
    const fallbackImage =
      product.images.find((image) =>
        Boolean(
          normalizeCatalogText(image)
        )
      );

    if (fallbackImage) {
      return normalizeCatalogText(
        fallbackImage
      );
    }
  }

  return "";
}

function addConfiguredSize(
  sizeMap,
  value
) {
  const size = normalizeOrderSize(value);

  if (!size) {
    return;
  }

  const sizeKey =
    size.toLocaleLowerCase("en");

  if (!sizeMap.has(sizeKey)) {
    sizeMap.set(sizeKey, size);
  }
}

function getProductSizeConfiguration(
  product
) {
  const configuredSizes = new Map();
  const sizeStockEntries = new Map();

  const sizeStock = isPlainObject(
    product?.sizeStock
  )
    ? product.sizeStock
    : null;

  if (sizeStock) {
    for (const [
      rawSize,
      rawStock,
    ] of Object.entries(sizeStock)) {
      const size = normalizeOrderSize(
        rawSize
      );

      if (!size) {
        continue;
      }

      const sizeKey =
        size.toLocaleLowerCase("en");

      configuredSizes.set(
        sizeKey,
        size
      );

      const stock = Number(rawStock);

      sizeStockEntries.set(
        sizeKey,
        {
          size,
          fieldName: rawSize,
          stock:
            Number.isFinite(stock)
              ? Math.max(0, stock)
              : 0,
        }
      );
    }
  }

  const sizeCollections = [
    product?.sizes,
    product?.availableSizes,
  ];

  for (const sizeCollection of sizeCollections) {
    if (!Array.isArray(sizeCollection)) {
      continue;
    }

    for (const size of sizeCollection) {
      if (isPlainObject(size)) {
        addConfiguredSize(
          configuredSizes,
          size.value ||
            size.size ||
            size.name ||
            size.label
        );
      } else {
        addConfiguredSize(
          configuredSizes,
          size
        );
      }
    }
  }

  if (Array.isArray(product?.variants)) {
    for (const variant of product.variants) {
      if (!isPlainObject(variant)) {
        continue;
      }

      addConfiguredSize(
        configuredSizes,
        variant.size ||
          variant.name ||
          variant.label ||
          variant.value
      );
    }
  }

  return {
    configuredSizes,
    sizeStockEntries,
    requiresSize:
      configuredSizes.size > 0,
  };
}

function resolveTrustedProductSize(
  product,
  requestedSize
) {
  const sizeConfiguration =
    getProductSizeConfiguration(
      product
    );

  const normalizedRequestedSize =
    normalizeOrderSize(
      requestedSize
    );

  if (
    sizeConfiguration.requiresSize &&
    !normalizedRequestedSize
  ) {
    throwPricingError(
      `Please select a size for ${
        normalizeCatalogText(
          product?.name,
          "this product"
        )
      }.`,
      400,
      "SIZE_REQUIRED"
    );
  }

  if (
    !sizeConfiguration.requiresSize
  ) {
    return {
      size: normalizedRequestedSize,
      inventoryMode: "total",
      sizeStockField: "",
      availableStock: getTotalProductStock(
        product
      ),
    };
  }

  const requestedSizeKey =
    normalizedRequestedSize.toLocaleLowerCase(
      "en"
    );

  const canonicalSize =
    sizeConfiguration.configuredSizes.get(
      requestedSizeKey
    );

  if (!canonicalSize) {
    throwPricingError(
      `The selected size is not available for ${
        normalizeCatalogText(
          product?.name,
          "this product"
        )
      }.`,
      400,
      "INVALID_SIZE"
    );
  }

  const sizeStockEntry =
    sizeConfiguration.sizeStockEntries.get(
      requestedSizeKey
    );

  if (sizeStockEntry) {
    const fieldName =
      String(
        sizeStockEntry.fieldName || ""
      );

    if (
      !fieldName ||
      fieldName.includes(".") ||
      fieldName.startsWith("$") ||
      fieldName.includes("\u0000")
    ) {
      throwPricingError(
        `${
          normalizeCatalogText(
            product?.name,
            "A selected product"
          )
        } has an invalid size-stock configuration.`,
        409,
        "INVALID_SIZE_STOCK_CONFIGURATION"
      );
    }

    return {
      size: canonicalSize,
      inventoryMode: "size",
      sizeStockField: fieldName,
      availableStock:
        sizeStockEntry.stock,
    };
  }

  return {
    size: canonicalSize,
    inventoryMode: "total",
    sizeStockField: "",
    availableStock: getTotalProductStock(
      product
    ),
  };
}

function getTotalProductStock(product) {
  const stock = Number(product?.stock);

  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(0, stock);
}

function getDeliveryCharge(
  settings,
  deliveryArea
) {
  if (
    deliveryArea ===
    "outside_dhaka"
  ) {
    return normalizeOrderMoney(
      settings?.delivery
        ?.outsideDhaka ??
        DEFAULT_SETTINGS.delivery
          .outsideDhaka
    );
  }

  return normalizeOrderMoney(
    settings?.delivery
      ?.insideDhaka ??
      DEFAULT_SETTINGS.delivery
        .insideDhaka
  );
}

function getAutomaticDeliveryDiscount(
  settings,
  subtotal,
  originalDeliveryCharge
) {
  const freeShippingOver =
    normalizeOrderMoney(
      settings?.delivery
        ?.freeShippingOver ?? 0
    );

  if (
    freeShippingOver <= 0 ||
    subtotal < freeShippingOver
  ) {
    return 0;
  }

  return originalDeliveryCharge;
}

function normalizeCouponType(value) {
  const type = normalizeCatalogText(
    value
  ).toLowerCase();

  if (
    type === "percentage" ||
    type === "percent"
  ) {
    return "percentage";
  }

  if (
    type === "fixed" ||
    type === "fixed_amount" ||
    type === "fixed-amount" ||
    type === "amount"
  ) {
    return "fixed";
  }

  if (
    type === "free_shipping" ||
    type === "free-shipping" ||
    type === "free_delivery" ||
    type === "shipping"
  ) {
    return "free_shipping";
  }

  return "";
}

function getCouponUsageCount(coupon) {
  return Math.max(
    0,
    Math.floor(
      Number(
        coupon?.usageCount ??
          coupon?.usedCount ??
          0
      ) || 0
    )
  );
}

function getCouponUsageLimit(coupon) {
  return Math.max(
    0,
    Math.floor(
      Number(
        coupon?.usageLimit ??
          coupon?.maxUses ??
          0
      ) || 0
    )
  );
}

function getCouponMinimumOrder(coupon) {
  return normalizeOrderMoney(
    coupon?.minimumOrder ??
      coupon?.minimumSpend ??
      coupon?.minOrderAmount ??
      0
  );
}

function getCouponMaximumDiscount(coupon) {
  return normalizeOrderMoney(
    coupon?.maximumDiscount ??
      coupon?.maxDiscount ??
      0
  );
}

function getCouponValue(coupon) {
  return normalizeOrderMoney(
    coupon?.value ??
      coupon?.discountValue ??
      coupon?.amount ??
      0
  );
}

function getCouponDate(
  coupon,
  fieldNames,
  label
) {
  for (const fieldName of fieldNames) {
    if (
      !hasOwn(coupon, fieldName) ||
      coupon[fieldName] === null ||
      coupon[fieldName] === ""
    ) {
      continue;
    }

    const date = new Date(
      coupon[fieldName]
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      throwPricingError(
        `This coupon has an invalid ${label}.`,
        409,
        "INVALID_COUPON_CONFIGURATION"
      );
    }

    return date;
  }

  return null;
}

function isCouponActive(coupon) {
  if (
    coupon?.active === false ||
    coupon?.isActive === false
  ) {
    return false;
  }

  return (
    normalizeCatalogText(
      coupon?.status
    ).toLowerCase() !==
    "inactive"
  );
}

function escapeRegularExpression(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

async function findCoupon(
  database,
  couponCode,
  session
) {
  return database
    .collection(
      COUPONS_COLLECTION_NAME
    )
    .findOne(
      {
        $or: [
          {
            normalizedCode:
              couponCode,
          },
          {
            code: couponCode,
          },
          {
            code: {
              $regex: `^${escapeRegularExpression(
                couponCode
              )}$`,
              $options: "i",
            },
          },
        ],
      },
      createDatabaseOptions(session)
    );
}

function calculateCouponDiscount({
  coupon,
  subtotal,
  availableDeliveryCharge,
}) {
  const couponType =
    normalizeCouponType(
      coupon?.type ||
        coupon?.discountType
    );

  if (
    !SUPPORTED_COUPON_TYPES.has(
      couponType
    )
  ) {
    throwPricingError(
      "This coupon type is not supported.",
      400,
      "UNSUPPORTED_COUPON_TYPE"
    );
  }

  const couponValue =
    getCouponValue(coupon);

  const maximumDiscount =
    getCouponMaximumDiscount(coupon);

  let productDiscount = 0;
  let deliveryDiscount = 0;

  if (
    couponType === "percentage"
  ) {
    if (
      couponValue <= 0 ||
      couponValue > 100
    ) {
      throwPricingError(
        "This coupon has an invalid percentage value.",
        409,
        "INVALID_COUPON_CONFIGURATION"
      );
    }

    productDiscount =
      subtotal *
      (couponValue / 100);

    if (
      maximumDiscount > 0
    ) {
      productDiscount = Math.min(
        productDiscount,
        maximumDiscount
      );
    }
  } else if (
    couponType === "fixed"
  ) {
    if (couponValue <= 0) {
      throwPricingError(
        "This coupon has an invalid discount value.",
        409,
        "INVALID_COUPON_CONFIGURATION"
      );
    }

    productDiscount = Math.min(
      couponValue,
      subtotal
    );
  } else if (
    couponType === "free_shipping"
  ) {
    if (
      availableDeliveryCharge <= 0
    ) {
      throwPricingError(
        "This order already qualifies for free delivery.",
        400,
        "DELIVERY_ALREADY_FREE"
      );
    }

    deliveryDiscount =
      availableDeliveryCharge;
  }

  productDiscount =
    normalizeOrderMoney(
      Math.min(
        subtotal,
        productDiscount
      )
    );

  deliveryDiscount =
    normalizeOrderMoney(
      Math.min(
        availableDeliveryCharge,
        deliveryDiscount
      )
    );

  const totalDiscount =
    normalizeOrderMoney(
      productDiscount +
        deliveryDiscount
    );

  if (totalDiscount <= 0) {
    throwPricingError(
      "This coupon cannot be applied to this order.",
      400,
      "COUPON_HAS_NO_DISCOUNT"
    );
  }

  return {
    couponType,
    couponValue,
    maximumDiscount,
    productDiscount,
    deliveryDiscount,
    totalDiscount,
  };
}

async function validateCouponForQuote({
  database,
  couponCode,
  subtotal,
  availableDeliveryCharge,
  now,
  session,
}) {
  if (!couponCode) {
    return {
      couponRecord: null,
      appliedCoupon: null,
      discount: {
        productDiscount: 0,
        deliveryDiscount: 0,
        totalDiscount: 0,
      },
    };
  }

  if (
    couponCode.length >
    ORDER_LIMITS.maximumCouponCodeLength
  ) {
    throwPricingError(
      "Coupon code is too long.",
      400,
      "INVALID_COUPON_CODE"
    );
  }

  if (
    !/^[A-Z0-9][A-Z0-9._-]{1,49}$/.test(
      couponCode
    )
  ) {
    throwPricingError(
      "Coupon code contains unsupported characters.",
      400,
      "INVALID_COUPON_CODE"
    );
  }

  const coupon = await findCoupon(
    database,
    couponCode,
    session
  );

  if (!coupon) {
    throwPricingError(
      "Coupon code was not found.",
      404,
      "COUPON_NOT_FOUND"
    );
  }

  if (!isCouponActive(coupon)) {
    throwPricingError(
      "This coupon is currently inactive.",
      400,
      "COUPON_INACTIVE"
    );
  }

  const startsAt = getCouponDate(
    coupon,
    ["startsAt", "startDate"],
    "start date"
  );

  const expiresAt = getCouponDate(
    coupon,
    [
      "expiresAt",
      "expiryDate",
      "endsAt",
    ],
    "expiry date"
  );

  if (
    startsAt &&
    now < startsAt
  ) {
    throwPricingError(
      "This coupon is not active yet.",
      400,
      "COUPON_NOT_STARTED"
    );
  }

  if (
    expiresAt &&
    now > expiresAt
  ) {
    throwPricingError(
      "This coupon has expired.",
      400,
      "COUPON_EXPIRED"
    );
  }

  const usageLimit =
    getCouponUsageLimit(coupon);

  const usageCount =
    getCouponUsageCount(coupon);

  if (
    usageLimit > 0 &&
    usageCount >= usageLimit
  ) {
    throwPricingError(
      "This coupon has reached its usage limit.",
      400,
      "COUPON_USAGE_LIMIT_REACHED"
    );
  }

  const minimumOrder =
    getCouponMinimumOrder(coupon);

  if (subtotal < minimumOrder) {
    throwPricingError(
      `A minimum order of ৳${minimumOrder.toLocaleString(
        "en-BD"
      )} is required for this coupon.`,
      400,
      "COUPON_MINIMUM_NOT_MET"
    );
  }

  const discount =
    calculateCouponDiscount({
      coupon,
      subtotal,
      availableDeliveryCharge,
    });

  const canonicalCode =
    normalizeCouponCode(
      coupon.code ||
        coupon.normalizedCode ||
        couponCode
    );

  return {
    couponRecord: coupon,

    appliedCoupon: {
      code: canonicalCode,
      name: normalizeCatalogText(
        coupon.name
      ),
      type: discount.couponType,
      value: discount.couponValue,
      minimumOrder,
      maximumDiscount:
        discount.maximumDiscount,
      productDiscount:
        discount.productDiscount,
      deliveryDiscount:
        discount.deliveryDiscount,
      totalDiscount:
        discount.totalDiscount,
    },

    discount: {
      productDiscount:
        discount.productDiscount,
      deliveryDiscount:
        discount.deliveryDiscount,
      totalDiscount:
        discount.totalDiscount,
    },
  };
}

export async function loadOrderSettings(
  database,
  session = null
) {
  const settingsCollection =
    database.collection(
      SETTINGS_COLLECTION_NAME
    );

  const options =
    createDatabaseOptions(session);

  const settingsDocument =
    (await settingsCollection.findOne(
      {
        type: "store",
      },
      options
    )) ||
    (await settingsCollection.findOne(
      {
        key: {
          $in: [
            "store-settings",
            "store_settings",
            "settings",
          ],
        },
      },
      options
    ));

  return normalizeSettings(
    settingsDocument ||
      DEFAULT_SETTINGS
  );
}

export function getEnabledPaymentMethods(
  settings
) {
  return Object.entries(
    SUPPORTED_PAYMENT_METHODS
  )
    .filter(
      ([, configuration]) =>
        settings?.payment?.[
          configuration.settingsKey
        ] === true
    )
    .map(
      ([
        value,
        configuration,
      ]) => ({
        value,
        label: configuration.label,
      })
    );
}

function resolvePaymentMethod(
  settings,
  requestedPaymentMethod
) {
  const paymentMethod =
    normalizePaymentMethod(
      requestedPaymentMethod
    );

  const configuration =
    SUPPORTED_PAYMENT_METHODS[
      paymentMethod
    ];

  if (!configuration) {
    throwPricingError(
      "Please select a supported payment method.",
      400,
      "UNSUPPORTED_PAYMENT_METHOD"
    );
  }

  if (
    settings?.payment?.[
      configuration.settingsKey
    ] !== true
  ) {
    throwPricingError(
      `${configuration.label} is not currently available.`,
      400,
      "PAYMENT_METHOD_DISABLED"
    );
  }

  return {
    value: paymentMethod,
    label: configuration.label,
  };
}

async function loadTrustedProducts({
  database,
  requestedItems,
  session,
}) {
  const productIds = Array.from(
    new Set(
      requestedItems.map(
        (item) => item.id
      )
    )
  );

  const products = await database
    .collection(
      PRODUCTS_COLLECTION_NAME
    )
    .find(
      getPublicProductQuery({
        id: {
          $in: productIds,
        },
      }),
      createDatabaseOptions(session)
    )
    .toArray();

  const productMap = new Map(
    products.map((product) => [
      String(product.id),
      product,
    ])
  );

  const missingProductIds =
    productIds.filter(
      (productId) =>
        !productMap.has(productId)
    );

  if (
    missingProductIds.length > 0
  ) {
    throwPricingError(
      "One or more selected products are unavailable.",
      404,
      "PRODUCT_UNAVAILABLE",
      {
        productIds:
          missingProductIds,
      }
    );
  }

  return productMap;
}

function buildTrustedItems(
  requestedItems,
  productMap
) {
  return requestedItems.map(
    (requestedItem) => {
      const product =
        productMap.get(
          requestedItem.id
        );

      const sizeResolution =
        resolveTrustedProductSize(
          product,
          requestedItem.size
        );

      if (
        sizeResolution.availableStock <
        requestedItem.quantity
      ) {
        throwPricingError(
          `${normalizeCatalogText(
            product?.name,
            "This product"
          )} does not have enough stock${
            sizeResolution.size
              ? ` in size ${sizeResolution.size}`
              : ""
          }.`,
          409,
          "INSUFFICIENT_STOCK",
          {
            productId:
              requestedItem.id,
            size:
              sizeResolution.size,
            availableStock:
              sizeResolution.availableStock,
          }
        );
      }

      const price =
        getProductPrice(product);

      const quantity =
        requestedItem.quantity;

      return {
        id: String(product.id),

        name: normalizeCatalogText(
          product.name,
          "OBSIDIAN Product"
        ),

        series:
          normalizeSeriesName(
            product.series
          ),

        color:
          normalizeCatalogText(
            product.color
          ),

        size:
          sizeResolution.size,

        quantity,
        price,

        lineTotal:
          normalizeOrderMoney(
            price * quantity
          ),

        image:
          getProductImage(product),

        inventory: {
          mode:
            sizeResolution.inventoryMode,

          sizeStockField:
            sizeResolution.sizeStockField,

          decrementTotalStock:
            Number.isFinite(
              Number(product.stock)
            ),
        },
      };
    }
  );
}

export async function buildTrustedOrderQuote({
  database,
  items,
  deliveryArea,
  couponCode = "",
  paymentMethod = "",
  validatePayment = true,
  now = new Date(),
  session = null,
}) {
  if (!database) {
    throwPricingError(
      "Database connection is unavailable.",
      500,
      "DATABASE_UNAVAILABLE"
    );
  }

  const requestedItems =
    normalizeRequestedOrderItems(
      items
    );

  const normalizedDeliveryArea =
    normalizeDeliveryArea(
      deliveryArea
    );

  const normalizedCouponCode =
    normalizeCouponCode(
      couponCode
    );

  const [
    settings,
    productMap,
  ] = await Promise.all([
    loadOrderSettings(
      database,
      session
    ),

    loadTrustedProducts({
      database,
      requestedItems,
      session,
    }),
  ]);

  const trustedItems =
    buildTrustedItems(
      requestedItems,
      productMap
    );

  const subtotal =
    normalizeOrderMoney(
      trustedItems.reduce(
        (total, item) =>
          total + item.lineTotal,
        0
      )
    );

  if (subtotal <= 0) {
    throwPricingError(
      "The order subtotal is invalid.",
      409,
      "INVALID_SUBTOTAL"
    );
  }

  const originalDeliveryCharge =
    getDeliveryCharge(
      settings,
      normalizedDeliveryArea
    );

  const automaticDeliveryDiscount =
    getAutomaticDeliveryDiscount(
      settings,
      subtotal,
      originalDeliveryCharge
    );

  const deliveryChargeBeforeCoupon =
    normalizeOrderMoney(
      originalDeliveryCharge -
        automaticDeliveryDiscount
    );

  const couponResult =
    await validateCouponForQuote({
      database,
      couponCode:
        normalizedCouponCode,
      subtotal,
      availableDeliveryCharge:
        deliveryChargeBeforeCoupon,
      now,
      session,
    });

  const productDiscount =
    normalizeOrderMoney(
      couponResult.discount
        .productDiscount
    );

  const couponDeliveryDiscount =
    normalizeOrderMoney(
      couponResult.discount
        .deliveryDiscount
    );

  const deliveryDiscount =
    normalizeOrderMoney(
      automaticDeliveryDiscount +
        couponDeliveryDiscount
    );

  const totalDiscount =
    normalizeOrderMoney(
      productDiscount +
        deliveryDiscount
    );

  const payableDeliveryCharge =
    normalizeOrderMoney(
      originalDeliveryCharge -
        deliveryDiscount
    );

  const total = normalizeOrderMoney(
    subtotal +
      originalDeliveryCharge -
      totalDiscount
  );

  const resolvedPaymentMethod =
    validatePayment
      ? resolvePaymentMethod(
          settings,
          paymentMethod ||
            "cash_on_delivery"
        )
      : null;

  return {
    items: trustedItems,
    settings,

    deliveryArea:
      normalizedDeliveryArea,

    paymentMethod:
      resolvedPaymentMethod,

    couponRecord:
      couponResult.couponRecord,

    appliedCoupon:
      couponResult.appliedCoupon,

    pricing: {
      currency:
        settings.store?.currency ||
        DEFAULT_SETTINGS.store
          .currency,

      subtotal,

      originalDeliveryCharge,

      automaticDeliveryDiscount,

      couponDeliveryDiscount,

      deliveryDiscount,

      productDiscount,

      totalDiscount,

      payableDeliveryCharge,

      total,
    },
  };
}

export function createPublicOrderQuote(
  quote
) {
  return {
    items: Array.isArray(quote?.items)
      ? quote.items.map(
          (item) => {
            const publicItem = {
              ...item,
            };

            delete publicItem.inventory;

            return publicItem;
          }
        )
      : [],

    deliveryArea:
      quote?.deliveryArea || "",

    paymentMethod:
      quote?.paymentMethod
        ? {
            ...quote.paymentMethod,
          }
        : null,

    coupon:
      quote?.appliedCoupon
        ? {
            ...quote.appliedCoupon,
          }
        : null,

    pricing: {
      ...(quote?.pricing || {}),
    },
  };
}

export function createStockReservationOperation(
  item,
  now = new Date()
) {
  if (
    !item ||
    !item.id ||
    !item.inventory
  ) {
    throwPricingError(
      "Stock reservation data is invalid.",
      500,
      "INVALID_STOCK_RESERVATION"
    );
  }

  const quantity =
    normalizeQuantity(
      item.quantity
    );

  const filter = {
    id: item.id,

    isActive: {
      $ne: false,
    },
  };

  const increment = {};
  const set = {
    updatedAt: now,
  };

  if (
    item.inventory.mode === "size"
  ) {
    const sizeStockField =
      item.inventory.sizeStockField;

    if (
      !sizeStockField ||
      sizeStockField.includes(".") ||
      sizeStockField.startsWith("$") ||
      sizeStockField.includes("\u0000")
    ) {
      throwPricingError(
        "Size stock reservation data is invalid.",
        500,
        "INVALID_STOCK_RESERVATION"
      );
    }

    const fieldPath =
      `sizeStock.${sizeStockField}`;

    filter[fieldPath] = {
      $gte: quantity,
    };

    increment[fieldPath] =
      -quantity;

    if (
      item.inventory
        .decrementTotalStock
    ) {
      filter.stock = {
        $gte: quantity,
      };

      increment.stock =
        -quantity;
    }
  } else {
    filter.stock = {
      $gte: quantity,
    };

    increment.stock =
      -quantity;
  }

  return {
    updateOne: {
      filter,

      update: {
        $inc: increment,
        $set: set,
      },
    },
  };
}

export function createCouponUsageOperation(
  coupon,
  now = new Date()
) {
  if (!coupon?._id) {
    return null;
  }

  const usageLimit =
    getCouponUsageLimit(coupon);

  const filter = {
    _id: coupon._id,

    active: {
      $ne: false,
    },

    isActive: {
      $ne: false,
    },

    status: {
      $ne: "inactive",
    },
  };

  if (usageLimit > 0) {
    filter.$expr = {
      $lt: [
        {
          $ifNull: [
            "$usageCount",
            {
              $ifNull: [
                "$usedCount",
                0,
              ],
            },
          ],
        },
        usageLimit,
      ],
    };
  }

  return {
    filter,

    update: [
      {
        $set: {
          usageCount: {
            $add: [
              {
                $ifNull: [
                  "$usageCount",
                  {
                    $ifNull: [
                      "$usedCount",
                      0,
                    ],
                  },
                ],
              },
              1,
            ],
          },

          updatedAt: now,
        },
      },
    ],
  };
}