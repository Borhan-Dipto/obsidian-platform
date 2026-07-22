import "server-only";

import clientPromise from "./mongodb";

export const PRODUCTS_COLLECTION_NAME = "products";
export const COLLECTIONS_COLLECTION_NAME = "collections";

export const FALLBACK_COLLECTION_IMAGE =
  "/images/collection-artifact.jpeg";

const MAX_PRODUCT_PRICE = 10000000;
const MAX_PRODUCT_STOCK = 1000000;

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

export function normalizeCatalogText(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const normalizedValue = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedValue || fallback;
}

export function normalizeOptionalCatalogText(
  value
) {
  return normalizeCatalogText(value, "");
}

export function normalizeSeriesName(value) {
  return normalizeCatalogText(value, "");
}

export function normalizeSeriesKey(value) {
  return normalizeSeriesName(value)
    .toLocaleLowerCase("en");
}

export function createCatalogSlug(value) {
  return normalizeCatalogText(value)
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function escapeCatalogRegExp(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function createFlexibleSeriesRegExp(series) {
  const normalizedSeries =
    normalizeSeriesName(series);

  if (!normalizedSeries) {
    return null;
  }

  const flexibleSeries = normalizedSeries
    .split(/\s+/)
    .map(escapeCatalogRegExp)
    .join("\\s+");

  return new RegExp(
    `^\\s*${flexibleSeries}\\s*$`,
    "i"
  );
}

export function buildSeriesMatchQuery(series) {
  const seriesName =
    normalizeSeriesName(series);

  const seriesKey =
    normalizeSeriesKey(seriesName);

  const seriesRegExp =
    createFlexibleSeriesRegExp(seriesName);

  const queryParts = [];

  if (seriesKey) {
    queryParts.push({
      seriesKey,
    });
  }

  if (seriesRegExp) {
    queryParts.push({
      series: seriesRegExp,
    });
  }

  if (queryParts.length === 0) {
    return {
      seriesKey: "__invalid-series__",
    };
  }

  if (queryParts.length === 1) {
    return queryParts[0];
  }

  return {
    $or: queryParts,
  };
}

export function getPublicProductQuery(
  additionalQuery = {}
) {
  return {
    ...additionalQuery,

    isActive: {
      $ne: false,
    },
  };
}

export function normalizeBooleanValue(
  value,
  fallback = false
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value
      .trim()
      .toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "on",
        "active",
        "published",
      ].includes(normalizedValue)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "off",
        "inactive",
        "draft",
      ].includes(normalizedValue)
    ) {
      return false;
    }
  }

  return fallback;
}

function validateRequiredText(
  value,
  fieldName,
  maximumLength
) {
  const normalizedValue =
    normalizeCatalogText(value);

  if (!normalizedValue) {
    return {
      error: `${fieldName} is required.`,
      value: "",
    };
  }

  if (
    normalizedValue.length > maximumLength
  ) {
    return {
      error: `${fieldName} must not exceed ${maximumLength} characters.`,
      value: normalizedValue,
    };
  }

  return {
    error: "",
    value: normalizedValue,
  };
}

function validateProductImage(value) {
  const image = normalizeCatalogText(value);

  if (!image) {
    return {
      error: "Product image is required.",
      value: "",
    };
  }

  if (image.length > 1000) {
    return {
      error:
        "Product image URL must not exceed 1000 characters.",
      value: image,
    };
  }

  if (image.startsWith("/")) {
    return {
      error: "",
      value: image,
    };
  }

  try {
    const imageUrl = new URL(image);

    if (
      imageUrl.protocol !== "http:" &&
      imageUrl.protocol !== "https:"
    ) {
      return {
        error:
          "Product image must use http or https.",
        value: image,
      };
    }

    return {
      error: "",
      value: image,
    };
  } catch {
    return {
      error:
        "Product image must be a valid uploaded image URL.",
      value: image,
    };
  }
}

function validateProductPrice(value) {
  if (
    value === "" ||
    value === undefined ||
    value === null
  ) {
    return {
      error: "Product price is required.",
      value: 0,
    };
  }

  const price = Number(value);

  if (!Number.isFinite(price)) {
    return {
      error:
        "Product price must be a valid number.",
      value: 0,
    };
  }

  if (price < 0) {
    return {
      error:
        "Product price cannot be negative.",
      value: price,
    };
  }

  if (price > MAX_PRODUCT_PRICE) {
    return {
      error: "Product price is too large.",
      value: price,
    };
  }

  return {
    error: "",
    value: Math.round(price * 100) / 100,
  };
}

function validateProductStock(value) {
  if (
    value === "" ||
    value === undefined ||
    value === null
  ) {
    return {
      error: "Product stock is required.",
      value: 0,
    };
  }

  const stock = Number(value);

  if (
    !Number.isFinite(stock) ||
    !Number.isInteger(stock)
  ) {
    return {
      error:
        "Product stock must be a whole number.",
      value: 0,
    };
  }

  if (stock < 0) {
    return {
      error:
        "Product stock cannot be negative.",
      value: stock,
    };
  }

  if (stock > MAX_PRODUCT_STOCK) {
    return {
      error: "Product stock is too large.",
      value: stock,
    };
  }

  return {
    error: "",
    value: stock,
  };
}

export function normalizeProductPayload(
  incomingProduct = {},
  existingProduct = null
) {
  const incoming = isPlainObject(
    incomingProduct
  )
    ? incomingProduct
    : {};

  const existing = isPlainObject(
    existingProduct
  )
    ? existingProduct
    : {};

  const mergedProduct = {
    ...existing,
    ...incoming,
  };

  const nameResult = validateRequiredText(
    mergedProduct.name,
    "Product name",
    140
  );

  if (nameResult.error) {
    return {
      success: false,
      message: nameResult.error,
      product: null,
    };
  }

  const seriesResult = validateRequiredText(
    mergedProduct.series,
    "Product series",
    120
  );

  if (seriesResult.error) {
    return {
      success: false,
      message: seriesResult.error,
      product: null,
    };
  }

  const colorResult = validateRequiredText(
    mergedProduct.color,
    "Product color",
    100
  );

  if (colorResult.error) {
    return {
      success: false,
      message: colorResult.error,
      product: null,
    };
  }

  const descriptionResult =
    validateRequiredText(
      mergedProduct.description,
      "Product description",
      5000
    );

  if (descriptionResult.error) {
    return {
      success: false,
      message: descriptionResult.error,
      product: null,
    };
  }

  const imageResult = validateProductImage(
    mergedProduct.image
  );

  if (imageResult.error) {
    return {
      success: false,
      message: imageResult.error,
      product: null,
    };
  }

  const priceResult = validateProductPrice(
    mergedProduct.price
  );

  if (priceResult.error) {
    return {
      success: false,
      message: priceResult.error,
      product: null,
    };
  }

  const stockResult = validateProductStock(
    mergedProduct.stock
  );

  if (stockResult.error) {
    return {
      success: false,
      message: stockResult.error,
      product: null,
    };
  }

  const suppliedId = hasOwn(incoming, "id")
    ? incoming.id
    : existing.id;

  const productId = createCatalogSlug(
    suppliedId || nameResult.value
  );

  if (!productId) {
    return {
      success: false,
      message:
        "Product ID could not be generated.",
      product: null,
    };
  }

  if (productId.length > 100) {
    return {
      success: false,
      message:
        "Product ID must not exceed 100 characters.",
      product: null,
    };
  }

  const series =
    normalizeSeriesName(seriesResult.value);

  const isActive = hasOwn(
    mergedProduct,
    "isActive"
  )
    ? normalizeBooleanValue(
        mergedProduct.isActive,
        true
      )
    : true;

  return {
    success: true,
    message: "",
    product: {
      id: productId,
      name: nameResult.value,
      series,
      seriesKey: normalizeSeriesKey(series),
      color: colorResult.value,
      price: priceResult.value,
      stock: stockResult.value,
      image: imageResult.value,
      description: descriptionResult.value,
      isActive,
    },
  };
}

export async function getCatalogDatabase() {
  const client = await clientPromise;

  return client.db(
    process.env.MONGODB_DB || "obsidian"
  );
}

export async function ensureCatalogIndexes(
  database
) {
  const db =
    database || (await getCatalogDatabase());

  const indexOperations = [
    db
      .collection(PRODUCTS_COLLECTION_NAME)
      .createIndex(
        {
          id: 1,
        },
        {
          unique: true,
          name: "unique_product_id",
        }
      ),

    db
      .collection(PRODUCTS_COLLECTION_NAME)
      .createIndex(
        {
          seriesKey: 1,
          isActive: 1,
        },
        {
          name: "product_series_status",
        }
      ),

    db
      .collection(COLLECTIONS_COLLECTION_NAME)
      .createIndex(
        {
          seriesKey: 1,
        },
        {
          name: "collection_series_key",
        }
      ),

    db
      .collection(COLLECTIONS_COLLECTION_NAME)
      .createIndex(
        {
          slug: 1,
        },
        {
          name: "collection_slug",
        }
      ),
  ];

  const results = await Promise.allSettled(
    indexOperations
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "Catalog index creation warning:",
        result.reason
      );
    }
  }
}

export async function findCollectionBySeries(
  database,
  series
) {
  const seriesName =
    normalizeSeriesName(series);

  if (!seriesName) {
    return null;
  }

  return database
    .collection(COLLECTIONS_COLLECTION_NAME)
    .findOne(buildSeriesMatchQuery(seriesName));
}

export async function resolveCanonicalSeries(
  database,
  series
) {
  const normalizedSeries =
    normalizeSeriesName(series);

  if (!normalizedSeries) {
    return "";
  }

  const existingCollection =
    await findCollectionBySeries(
      database,
      normalizedSeries
    );

  return normalizeSeriesName(
    existingCollection?.series,
    normalizedSeries
  );
}

async function createUniqueCollectionSlug(
  database,
  series,
  excludedCollectionId = null
) {
  const baseSlug =
    createCatalogSlug(series) || "collection";

  for (
    let suffix = 1;
    suffix <= 1000;
    suffix += 1
  ) {
    const candidateSlug =
      suffix === 1
        ? baseSlug
        : `${baseSlug}-${suffix}`;

    const query = {
      slug: candidateSlug,
    };

    if (excludedCollectionId) {
      query._id = {
        $ne: excludedCollectionId,
      };
    }

    const existingCollection = await database
      .collection(
        COLLECTIONS_COLLECTION_NAME
      )
      .findOne(query, {
        projection: {
          _id: 1,
        },
      });

    if (!existingCollection) {
      return candidateSlug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

async function getNextCollectionDisplayOrder(
  database
) {
  const lastCollection = await database
    .collection(COLLECTIONS_COLLECTION_NAME)
    .find({})
    .sort({
      displayOrder: -1,
      createdAt: -1,
    })
    .limit(1)
    .next();

  const currentOrder = Number(
    lastCollection?.displayOrder || 0
  );

  if (!Number.isFinite(currentOrder)) {
    return 0;
  }

  return Math.max(0, currentOrder + 1);
}

function createAutomaticDescription(series) {
  return `Explore the ${series}, shaped by pressure, precision, restraint, and quiet confidence.`;
}

export async function ensureCollectionForProduct(
  database,
  product
) {
  if (
    !database ||
    !isPlainObject(product) ||
    product.isActive === false
  ) {
    return null;
  }

  const series = normalizeSeriesName(
    product.series
  );

  const seriesKey =
    normalizeSeriesKey(series);

  if (!series || !seriesKey) {
    return null;
  }

  const collectionStore =
    database.collection(
      COLLECTIONS_COLLECTION_NAME
    );

  const existingCollection =
    await findCollectionBySeries(
      database,
      series
    );

  const now = new Date();

  if (existingCollection) {
    const canonicalSeries =
      normalizeSeriesName(
        existingCollection.series,
        series
      );

    const updates = {
      seriesKey:
        normalizeSeriesKey(
          canonicalSeries
        ),
      updatedAt: now,
    };

    const unsetFields = {};

    if (
      existingCollection.isAutoGenerated ===
      true
    ) {
      updates.title = canonicalSeries;
      updates.series = canonicalSeries;
      updates.description =
        normalizeCatalogText(
          existingCollection.description,
          createAutomaticDescription(
            canonicalSeries
          )
        );

      updates.coverImage =
        normalizeCatalogText(
          product.image,
          normalizeCatalogText(
            existingCollection.coverImage,
            FALLBACK_COLLECTION_IMAGE
          )
        );

      updates.sourceProductId =
        normalizeCatalogText(product.id);

      updates.isActive = true;

      if (!existingCollection.slug) {
        updates.slug =
          await createUniqueCollectionSlug(
            database,
            canonicalSeries,
            existingCollection._id
          );
      }

      unsetFields.autoEmptyAt = "";
    }

    const updateOperation = {
      $set: updates,
    };

    if (
      Object.keys(unsetFields).length > 0
    ) {
      updateOperation.$unset = unsetFields;
    }

    await collectionStore.updateOne(
      {
        _id: existingCollection._id,
      },
      updateOperation
    );

    return collectionStore.findOne({
      _id: existingCollection._id,
    });
  }

  const slug =
    await createUniqueCollectionSlug(
      database,
      series
    );

  const displayOrder =
    await getNextCollectionDisplayOrder(
      database
    );

  const newCollection = {
    title: series,
    slug,
    series,
    seriesKey,
    description:
      createAutomaticDescription(series),
    coverImage: normalizeCatalogText(
      product.image,
      FALLBACK_COLLECTION_IMAGE
    ),
    displayOrder,
    isActive: true,
    isFeatured: false,
    isAutoGenerated: true,
    sourceProductId:
      normalizeCatalogText(product.id),
    autoGeneratedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result =
      await collectionStore.insertOne(
        newCollection
      );

    return {
      ...newCollection,
      _id: result.insertedId,
    };
  } catch (error) {
    if (error?.code === 11000) {
      return findCollectionBySeries(
        database,
        series
      );
    }

    throw error;
  }
}

export async function deactivateEmptyAutoCollection(
  database,
  series
) {
  const normalizedSeries =
    normalizeSeriesName(series);

  if (!normalizedSeries) {
    return {
      changed: false,
      productCount: 0,
    };
  }

  const collection =
    await findCollectionBySeries(
      database,
      normalizedSeries
    );

  if (
    !collection ||
    collection.isAutoGenerated !== true
  ) {
    return {
      changed: false,
      productCount: null,
    };
  }

  const productCount = await database
    .collection(PRODUCTS_COLLECTION_NAME)
    .countDocuments(
      getPublicProductQuery(
        buildSeriesMatchQuery(
          normalizedSeries
        )
      )
    );

  if (productCount > 0) {
    if (collection.isActive === false) {
      await database
        .collection(
          COLLECTIONS_COLLECTION_NAME
        )
        .updateOne(
          {
            _id: collection._id,
          },
          {
            $set: {
              isActive: true,
              updatedAt: new Date(),
            },

            $unset: {
              autoEmptyAt: "",
            },
          }
        );

      return {
        changed: true,
        productCount,
      };
    }

    return {
      changed: false,
      productCount,
    };
  }

  await database
    .collection(
      COLLECTIONS_COLLECTION_NAME
    )
    .updateOne(
      {
        _id: collection._id,
      },
      {
        $set: {
          isActive: false,
          autoEmptyAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

  return {
    changed: collection.isActive !== false,
    productCount: 0,
  };
}

export async function syncCollectionsFromProducts(
  database
) {
  const db =
    database || (await getCatalogDatabase());

  await ensureCatalogIndexes(db);

  const productStore = db.collection(
    PRODUCTS_COLLECTION_NAME
  );

  const products = await productStore
    .find(
      getPublicProductQuery({
        series: {
          $type: "string",
          $ne: "",
        },
      })
    )
    .sort({
      createdAt: -1,
    })
    .toArray();

  const representativeProducts =
    new Map();

  const productNormalizationOperations =
    [];

  for (const product of products) {
    const series = normalizeSeriesName(
      product.series
    );

    const seriesKey =
      normalizeSeriesKey(series);

    if (!series || !seriesKey) {
      continue;
    }

    if (
      product.series !== series ||
      product.seriesKey !== seriesKey ||
      typeof product.isActive !== "boolean"
    ) {
      productNormalizationOperations.push({
        updateOne: {
          filter: {
            _id: product._id,
          },

          update: {
            $set: {
              series,
              seriesKey,
              isActive:
                product.isActive !== false,
              updatedAt:
                product.updatedAt ||
                new Date(),
            },
          },
        },
      });
    }

    if (
      !representativeProducts.has(
        seriesKey
      )
    ) {
      representativeProducts.set(
        seriesKey,
        {
          ...product,
          series,
          seriesKey,
          isActive: true,
        }
      );
    }
  }

  if (
    productNormalizationOperations.length > 0
  ) {
    await productStore.bulkWrite(
      productNormalizationOperations,
      {
        ordered: false,
      }
    );
  }

  let createdOrSyncedCount = 0;

  for (const product of representativeProducts.values()) {
    await ensureCollectionForProduct(
      db,
      product
    );

    createdOrSyncedCount += 1;
  }

  const autoCollections = await db
    .collection(
      COLLECTIONS_COLLECTION_NAME
    )
    .find({
      isAutoGenerated: true,
    })
    .toArray();

  let deactivatedCount = 0;

  for (const collection of autoCollections) {
    const collectionSeriesKey =
      normalizeSeriesKey(
        collection.series
      );

    if (
      collectionSeriesKey &&
      representativeProducts.has(
        collectionSeriesKey
      )
    ) {
      continue;
    }

    const result =
      await deactivateEmptyAutoCollection(
        db,
        collection.series
      );

    if (result.changed) {
      deactivatedCount += 1;
    }
  }

  return {
    productCount: products.length,
    seriesCount:
      representativeProducts.size,
    createdOrSyncedCount,
    deactivatedCount,
  };
}

export async function getSeriesProductCounts(
  database
) {
  const db =
    database || (await getCatalogDatabase());

  const products = await db
    .collection(PRODUCTS_COLLECTION_NAME)
    .find(
      {
        series: {
          $type: "string",
          $ne: "",
        },
      },
      {
        projection: {
          series: 1,
          seriesKey: 1,
          isActive: 1,
        },
      }
    )
    .toArray();

  const counts = {};

  for (const product of products) {
    const series = normalizeSeriesName(
      product.series
    );

    const seriesKey =
      normalizeSeriesKey(
        product.seriesKey || series
      );

    if (!seriesKey) {
      continue;
    }

    if (!counts[seriesKey]) {
      counts[seriesKey] = {
        series,
        total: 0,
        active: 0,
        inactive: 0,
      };
    }

    counts[seriesKey].total += 1;

    if (product.isActive === false) {
      counts[seriesKey].inactive += 1;
    } else {
      counts[seriesKey].active += 1;
    }
  }

  return counts;
}