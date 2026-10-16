import {
  OBSIDIAN_SIZE_ORDER,
} from "./sizeGuide.js";

function isPlainRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

export function normalizeProductSize(
  value
) {
  const normalizedSize =
    String(value || "")
      .normalize("NFKC")
      .trim()
      .toUpperCase();

  return OBSIDIAN_SIZE_ORDER.includes(
    normalizedSize
  )
    ? normalizedSize
    : "";
}

export function createEmptySizeStock(
  initialValue = 0
) {
  const numericValue =
    Number(initialValue);

  const safeValue =
    Number.isFinite(numericValue) &&
    numericValue >= 0
      ? Math.floor(numericValue)
      : 0;

  return Object.fromEntries(
    OBSIDIAN_SIZE_ORDER.map(
      (size) => [
        size,
        safeValue,
      ]
    )
  );
}

export function hasProductSizeInventory(
  product
) {
  return isPlainRecord(
    product?.sizeStock
  );
}

export function normalizeSizeStockForForm(
  product
) {
  const normalizedStock =
    createEmptySizeStock();

  if (
    !hasProductSizeInventory(
      product
    )
  ) {
    return normalizedStock;
  }

  for (
    const [
      rawSize,
      rawStock,
    ] of Object.entries(
      product.sizeStock
    )
  ) {
    const size =
      normalizeProductSize(
        rawSize
      );

    if (!size) {
      continue;
    }

    const stock =
      Number(rawStock);

    normalizedStock[size] =
      Number.isFinite(stock) &&
      stock >= 0
        ? Math.floor(stock)
        : 0;
  }

  return normalizedStock;
}

export function getEnabledProductSizes(
  product
) {
  const configuredSizes =
    Array.isArray(product?.sizes)
      ? product.sizes
      : [];

  const normalizedSizes =
    new Set(
      configuredSizes
        .map(normalizeProductSize)
        .filter(Boolean)
    );

  if (
    normalizedSizes.size === 0 &&
    hasProductSizeInventory(
      product
    )
  ) {
    for (
      const size
      of Object.keys(
        product.sizeStock
      )
    ) {
      const normalizedSize =
        normalizeProductSize(
          size
        );

      if (normalizedSize) {
        normalizedSizes.add(
          normalizedSize
        );
      }
    }
  }

  if (
    normalizedSizes.size === 0 &&
    !hasProductSizeInventory(
      product
    )
  ) {
    return [
      ...OBSIDIAN_SIZE_ORDER,
    ];
  }

  return OBSIDIAN_SIZE_ORDER.filter(
    (size) =>
      normalizedSizes.has(size)
  );
}

export function getProductSizeStock(
  product,
  requestedSize
) {
  const size =
    normalizeProductSize(
      requestedSize
    );

  if (!size) {
    return 0;
  }

  if (
    !hasProductSizeInventory(
      product
    )
  ) {
    const legacyStock =
      Number(product?.stock);

    return (
      Number.isFinite(
        legacyStock
      ) &&
      legacyStock > 0
        ? Math.floor(
            legacyStock
          )
        : 0
    );
  }

  const matchingEntry =
    Object.entries(
      product.sizeStock
    ).find(
      ([rawSize]) =>
        normalizeProductSize(
          rawSize
        ) === size
    );

  const stock =
    Number(
      matchingEntry?.[1]
    );

  return (
    Number.isFinite(stock) &&
    stock > 0
      ? Math.floor(stock)
      : 0
  );
}

export function getProductTotalStock(
  product
) {
  if (
    !hasProductSizeInventory(
      product
    )
  ) {
    const stock =
      Number(product?.stock);

    return (
      Number.isFinite(stock) &&
      stock > 0
        ? Math.floor(stock)
        : 0
    );
  }

  return getEnabledProductSizes(
    product
  ).reduce(
    (total, size) =>
      total +
      getProductSizeStock(
        product,
        size
      ),
    0
  );
}

export {
  OBSIDIAN_SIZE_ORDER,
};
