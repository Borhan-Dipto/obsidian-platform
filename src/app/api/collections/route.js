import { isAdminAuthenticated } from "../../../lib/adminAuth";
import {
  COLLECTIONS_COLLECTION_NAME,
  PRODUCTS_COLLECTION_NAME,
  buildSeriesMatchQuery,
  createCatalogSlug,
  ensureCatalogIndexes,
  findCollectionBySeries,
  getCatalogDatabase,
  getSeriesProductCounts,
  normalizeBooleanValue,
  normalizeCatalogText,
  normalizeSeriesKey,
  normalizeSeriesName,
  syncCollectionsFromProducts,
} from "../../../lib/catalog";

export const dynamic = "force-dynamic";

function createErrorResponse(message, status = 500) {
  return Response.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function serializeDocument(document) {
  if (!document) {
    return null;
  }

  return JSON.parse(JSON.stringify(document));
}

function normalizeBooleanQuery(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase() === "true"
  );
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

  if (normalizedValue.length > maximumLength) {
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

function validateCoverImage(value) {
  const coverImage =
    normalizeCatalogText(value);

  if (!coverImage) {
    return {
      error: "Collection cover image is required.",
      value: "",
    };
  }

  if (coverImage.length > 1000) {
    return {
      error:
        "Collection cover image URL must not exceed 1000 characters.",
      value: coverImage,
    };
  }

  if (coverImage.startsWith("/")) {
    return {
      error: "",
      value: coverImage,
    };
  }

  try {
    const imageUrl = new URL(coverImage);

    if (
      imageUrl.protocol !== "http:" &&
      imageUrl.protocol !== "https:"
    ) {
      return {
        error:
          "Collection cover image must use http or https.",
        value: coverImage,
      };
    }

    return {
      error: "",
      value: coverImage,
    };
  } catch {
    return {
      error:
        "Collection cover image must be a valid uploaded image URL.",
      value: coverImage,
    };
  }
}

function validateDisplayOrder(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return {
      error: "",
      value: 0,
    };
  }

  const displayOrder = Number(value);

  if (
    !Number.isFinite(displayOrder) ||
    !Number.isInteger(displayOrder)
  ) {
    return {
      error:
        "Display order must be a whole number.",
      value: 0,
    };
  }

  if (displayOrder < 0) {
    return {
      error:
        "Display order cannot be negative.",
      value: displayOrder,
    };
  }

  if (displayOrder > 1000000) {
    return {
      error: "Display order is too large.",
      value: displayOrder,
    };
  }

  return {
    error: "",
    value: displayOrder,
  };
}

function normalizeCollectionPayload(data) {
  const titleResult = validateRequiredText(
    data.title,
    "Collection title",
    140
  );

  if (titleResult.error) {
    return {
      success: false,
      message: titleResult.error,
      collection: null,
    };
  }

  const seriesResult = validateRequiredText(
    data.series,
    "Collection series",
    120
  );

  if (seriesResult.error) {
    return {
      success: false,
      message: seriesResult.error,
      collection: null,
    };
  }

  const descriptionResult =
    validateRequiredText(
      data.description,
      "Collection description",
      5000
    );

  if (descriptionResult.error) {
    return {
      success: false,
      message: descriptionResult.error,
      collection: null,
    };
  }

  const coverImageResult =
    validateCoverImage(data.coverImage);

  if (coverImageResult.error) {
    return {
      success: false,
      message: coverImageResult.error,
      collection: null,
    };
  }

  const displayOrderResult =
    validateDisplayOrder(data.displayOrder);

  if (displayOrderResult.error) {
    return {
      success: false,
      message: displayOrderResult.error,
      collection: null,
    };
  }

  const series = normalizeSeriesName(
    seriesResult.value
  );

  const slug = createCatalogSlug(
    data.slug || titleResult.value
  );

  if (!slug) {
    return {
      success: false,
      message:
        "Collection slug could not be generated.",
      collection: null,
    };
  }

  if (slug.length > 100) {
    return {
      success: false,
      message:
        "Collection slug must not exceed 100 characters.",
      collection: null,
    };
  }

  return {
    success: true,
    message: "",
    collection: {
      title: titleResult.value,
      slug,
      series,
      seriesKey: normalizeSeriesKey(series),
      description: descriptionResult.value,
      coverImage: coverImageResult.value,
      displayOrder: displayOrderResult.value,
      isActive: normalizeBooleanValue(
        data.isActive,
        true
      ),
      isFeatured: normalizeBooleanValue(
        data.isFeatured,
        false
      ),
    },
  };
}

async function attachProductCounts(
  database,
  collections
) {
  const counts =
    await getSeriesProductCounts(database);

  return collections.map((collection) => {
    const seriesKey = normalizeSeriesKey(
      collection.seriesKey ||
        collection.series
    );

    const seriesCount = counts[seriesKey] || {
      total: 0,
      active: 0,
      inactive: 0,
    };

    return {
      ...collection,
      seriesKey,
      productCount: seriesCount.total,
      activeProductCount:
        seriesCount.active,
      inactiveProductCount:
        seriesCount.inactive,
      isAutoGenerated:
        collection.isAutoGenerated === true,
    };
  });
}

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);

    const includeInactive =
      normalizeBooleanQuery(
        requestUrl.searchParams.get(
          "includeInactive"
        )
      );

    if (includeInactive) {
      const authenticated =
        await isAdminAuthenticated();

      if (!authenticated) {
        return createErrorResponse(
          "Unauthorized.",
          401
        );
      }
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(database);

    /*
     * This safely backfills collections for
     * existing active product series and keeps
     * automatic collections synchronized.
     */
    await syncCollectionsFromProducts(
      database
    );

    const query = includeInactive
      ? {}
      : {
          isActive: true,
        };

    const collections = await database
      .collection(
        COLLECTIONS_COLLECTION_NAME
      )
      .find(query)
      .sort({
        displayOrder: 1,
        createdAt: -1,
      })
      .toArray();

    const collectionsWithCounts =
      await attachProductCounts(
        database,
        collections
      );

    return Response.json({
      success: true,
      collections: serializeDocument(
        collectionsWithCounts
      ),
    });
  } catch (error) {
    console.error(
      "GET collections error:",
      error
    );

    return createErrorResponse(
      "Failed to fetch collections."
    );
  }
}

export async function POST(request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createErrorResponse(
        "Unauthorized.",
        401
      );
    }

    let requestBody;

    try {
      requestBody = await request.json();
    } catch {
      return createErrorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    if (!isPlainObject(requestBody)) {
      return createErrorResponse(
        "Collection data must be a valid object.",
        400
      );
    }

    const normalizedResult =
      normalizeCollectionPayload(
        requestBody
      );

    if (!normalizedResult.success) {
      return createErrorResponse(
        normalizedResult.message,
        400
      );
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(database);

    const collectionStore =
      database.collection(
        COLLECTIONS_COLLECTION_NAME
      );

    const productStore =
      database.collection(
        PRODUCTS_COLLECTION_NAME
      );

    const normalizedCollection =
      normalizedResult.collection;

    const existingSeriesCollection =
      await findCollectionBySeries(
        database,
        normalizedCollection.series
      );

    const slugConflict =
      await collectionStore.findOne(
        {
          slug: normalizedCollection.slug,

          ...(existingSeriesCollection?._id
            ? {
                _id: {
                  $ne:
                    existingSeriesCollection._id,
                },
              }
            : {}),
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (slugConflict) {
      return createErrorResponse(
        "Another collection already uses this slug.",
        409
      );
    }

    const now = new Date();

    /*
     * If a product previously generated this
     * collection automatically, creating it from
     * the admin panel converts it into a manually
     * managed collection instead of duplicating it.
     */
    if (existingSeriesCollection) {
      if (
        existingSeriesCollection
          .isAutoGenerated !== true
      ) {
        return createErrorResponse(
          "A collection for this product series already exists.",
          409
        );
      }

      await collectionStore.updateOne(
        {
          _id:
            existingSeriesCollection._id,
        },
        {
          $set: {
            ...normalizedCollection,
            isAutoGenerated: false,
            customizedAt: now,
            updatedAt: now,
          },

          $unset: {
            sourceProductId: "",
            autoGeneratedAt: "",
            autoEmptyAt: "",
          },
        }
      );

      await productStore.updateMany(
        buildSeriesMatchQuery(
          existingSeriesCollection.series
        ),
        {
          $set: {
            series:
              normalizedCollection.series,
            seriesKey:
              normalizedCollection.seriesKey,
            updatedAt: now,
          },
        }
      );

      const savedCollection =
        await collectionStore.findOne({
          _id:
            existingSeriesCollection._id,
        });

      const [collectionWithCounts] =
        await attachProductCounts(
          database,
          [savedCollection]
        );

      return Response.json({
        success: true,
        message:
          "Automatic collection converted to a managed collection successfully.",
        collection: serializeDocument(
          collectionWithCounts
        ),
      });
    }

    const newCollection = {
      ...normalizedCollection,
      isAutoGenerated: false,
      createdAt: now,
      updatedAt: now,
    };

    const insertionResult =
      await collectionStore.insertOne(
        newCollection
      );

    /*
     * Normalize any legacy products already using
     * an equivalent series name.
     */
    await productStore.updateMany(
      buildSeriesMatchQuery(
        normalizedCollection.series
      ),
      {
        $set: {
          series:
            normalizedCollection.series,
          seriesKey:
            normalizedCollection.seriesKey,
          updatedAt: now,
        },
      }
    );

    const savedCollection = {
      ...newCollection,
      _id: insertionResult.insertedId,
    };

    const [collectionWithCounts] =
      await attachProductCounts(
        database,
        [savedCollection]
      );

    return Response.json(
      {
        success: true,
        message:
          "Collection created successfully.",
        collection: serializeDocument(
          collectionWithCounts
        ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return createErrorResponse(
        "A collection with this slug already exists.",
        409
      );
    }

    console.error(
      "POST collection error:",
      error
    );

    return createErrorResponse(
      "Failed to create collection."
    );
  }
}