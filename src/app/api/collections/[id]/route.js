import { ObjectId } from "mongodb";

import {
  requireAdminApiPermission,
} from "../../../../lib/adminApiAuthorization";

import {
  COLLECTIONS_COLLECTION_NAME,
  PRODUCTS_COLLECTION_NAME,
  buildSeriesMatchQuery,
  createCatalogSlug,
  ensureCatalogIndexes,
  findCollectionBySeries,
  getCatalogDatabase,
  normalizeBooleanValue,
  normalizeCatalogText,
  normalizeSeriesKey,
  normalizeSeriesName,
} from "../../../../lib/catalog";

export const dynamic =
  "force-dynamic";

function createErrorResponse(
  message,
  status = 500
) {
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
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function serializeDocument(
  document
) {
  if (!document) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(document)
  );
}

function getObjectIdString(
  value
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return String(value);
}

async function resolveCollectionId(
  context
) {
  const params =
    await context.params;

  try {
    return decodeURIComponent(
      String(
        params?.id || ""
      )
    ).trim();
  } catch {
    return String(
      params?.id || ""
    ).trim();
  }
}

function createCollectionLookup(
  identifier
) {
  const normalizedIdentifier =
    normalizeCatalogText(
      identifier
    );

  const slug =
    createCatalogSlug(
      normalizedIdentifier
    );

  const seriesQuery =
    buildSeriesMatchQuery(
      normalizedIdentifier
    );

  const queryParts = [];

  if (
    ObjectId.isValid(
      normalizedIdentifier
    )
  ) {
    queryParts.push({
      _id:
        new ObjectId(
          normalizedIdentifier
        ),
    });
  }

  if (
    normalizedIdentifier
  ) {
    queryParts.push({
      slug:
        normalizedIdentifier,
    });
  }

  if (
    slug &&
    slug !==
      normalizedIdentifier
  ) {
    queryParts.push({
      slug,
    });
  }

  if (
    Array.isArray(
      seriesQuery.$or
    )
  ) {
    queryParts.push(
      ...seriesQuery.$or
    );
  } else {
    queryParts.push(
      seriesQuery
    );
  }

  return {
    $or:
      queryParts,
  };
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
      error:
        `${fieldName} is required.`,

      value: "",
    };
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    return {
      error:
        `${fieldName} must not exceed ${maximumLength} characters.`,

      value:
        normalizedValue,
    };
  }

  return {
    error: "",
    value:
      normalizedValue,
  };
}

function validateCoverImage(
  value
) {
  const coverImage =
    normalizeCatalogText(value);

  if (!coverImage) {
    return {
      error:
        "Collection cover image is required.",

      value: "",
    };
  }

  if (
    coverImage.length >
    1000
  ) {
    return {
      error:
        "Collection cover image URL must not exceed 1000 characters.",

      value:
        coverImage,
    };
  }

  if (
    coverImage.startsWith("/")
  ) {
    return {
      error: "",
      value:
        coverImage,
    };
  }

  try {
    const imageUrl =
      new URL(coverImage);

    if (
      imageUrl.protocol !==
        "http:" &&
      imageUrl.protocol !==
        "https:"
    ) {
      return {
        error:
          "Collection cover image must use http or https.",

        value:
          coverImage,
      };
    }

    return {
      error: "",
      value:
        coverImage,
    };
  } catch {
    return {
      error:
        "Collection cover image must be a valid uploaded image URL.",

      value:
        coverImage,
    };
  }
}

function validateDisplayOrder(
  value
) {
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

  const displayOrder =
    Number(value);

  if (
    !Number.isFinite(
      displayOrder
    ) ||
    !Number.isInteger(
      displayOrder
    )
  ) {
    return {
      error:
        "Display order must be a whole number.",

      value: 0,
    };
  }

  if (
    displayOrder < 0
  ) {
    return {
      error:
        "Display order cannot be negative.",

      value:
        displayOrder,
    };
  }

  if (
    displayOrder >
    1000000
  ) {
    return {
      error:
        "Display order is too large.",

      value:
        displayOrder,
    };
  }

  return {
    error: "",
    value:
      displayOrder,
  };
}

function normalizeCollectionUpdate(
  updates,
  existingCollection
) {
  const mergedCollection = {
    title:
      hasOwn(
        updates,
        "title"
      )
        ? updates.title
        : existingCollection.title,

    slug:
      hasOwn(
        updates,
        "slug"
      )
        ? updates.slug
        : existingCollection.slug,

    series:
      hasOwn(
        updates,
        "series"
      )
        ? updates.series
        : existingCollection.series,

    description:
      hasOwn(
        updates,
        "description"
      )
        ? updates.description
        : existingCollection.description,

    coverImage:
      hasOwn(
        updates,
        "coverImage"
      )
        ? updates.coverImage
        : existingCollection.coverImage,

    displayOrder:
      hasOwn(
        updates,
        "displayOrder"
      )
        ? updates.displayOrder
        : existingCollection.displayOrder,

    isActive:
      hasOwn(
        updates,
        "isActive"
      )
        ? updates.isActive
        : existingCollection.isActive,

    isFeatured:
      hasOwn(
        updates,
        "isFeatured"
      )
        ? updates.isFeatured
        : existingCollection.isFeatured,
  };

  const titleResult =
    validateRequiredText(
      mergedCollection.title,
      "Collection title",
      140
    );

  if (titleResult.error) {
    return {
      success: false,

      message:
        titleResult.error,

      collection: null,
    };
  }

  const seriesResult =
    validateRequiredText(
      mergedCollection.series,
      "Collection series",
      120
    );

  if (seriesResult.error) {
    return {
      success: false,

      message:
        seriesResult.error,

      collection: null,
    };
  }

  const descriptionResult =
    validateRequiredText(
      mergedCollection.description,
      "Collection description",
      5000
    );

  if (
    descriptionResult.error
  ) {
    return {
      success: false,

      message:
        descriptionResult.error,

      collection: null,
    };
  }

  const coverImageResult =
    validateCoverImage(
      mergedCollection.coverImage
    );

  if (
    coverImageResult.error
  ) {
    return {
      success: false,

      message:
        coverImageResult.error,

      collection: null,
    };
  }

  const displayOrderResult =
    validateDisplayOrder(
      mergedCollection.displayOrder
    );

  if (
    displayOrderResult.error
  ) {
    return {
      success: false,

      message:
        displayOrderResult.error,

      collection: null,
    };
  }

  const series =
    normalizeSeriesName(
      seriesResult.value
    );

  const slug =
    createCatalogSlug(
      mergedCollection.slug ||
        titleResult.value
    );

  if (!slug) {
    return {
      success: false,

      message:
        "Collection slug could not be generated.",

      collection: null,
    };
  }

  if (
    slug.length > 100
  ) {
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
      title:
        titleResult.value,

      slug,
      series,

      seriesKey:
        normalizeSeriesKey(
          series
        ),

      description:
        descriptionResult.value,

      coverImage:
        coverImageResult.value,

      displayOrder:
        displayOrderResult.value,

      isActive:
        normalizeBooleanValue(
          mergedCollection.isActive,
          true
        ),

      isFeatured:
        normalizeBooleanValue(
          mergedCollection.isFeatured,
          false
        ),
    },
  };
}

async function getCollectionProductCounts(
  database,
  collection
) {
  const seriesQuery =
    buildSeriesMatchQuery(
      collection.series
    );

  const productStore =
    database.collection(
      PRODUCTS_COLLECTION_NAME
    );

  const [
    totalProductCount,
    activeProductCount,
  ] = await Promise.all([
    productStore.countDocuments(
      seriesQuery
    ),

    productStore.countDocuments({
      ...seriesQuery,

      isActive: {
        $ne: false,
      },
    }),
  ]);

  return {
    productCount:
      totalProductCount,

    activeProductCount,

    inactiveProductCount:
      totalProductCount -
      activeProductCount,
  };
}

async function attachProductCounts(
  database,
  collection
) {
  const counts =
    await getCollectionProductCounts(
      database,
      collection
    );

  return {
    ...collection,

    seriesKey:
      normalizeSeriesKey(
        collection.seriesKey ||
          collection.series
      ),

    isAutoGenerated:
      collection
        .isAutoGenerated ===
      true,

    ...counts,
  };
}

export async function GET(
  request,
  context
) {
  try {
    const identifier =
      await resolveCollectionId(
        context
      );

    if (!identifier) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(
      database
    );

    const collection =
      await database
        .collection(
          COLLECTIONS_COLLECTION_NAME
        )
        .findOne(
          createCollectionLookup(
            identifier
          )
        );

    if (!collection) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    if (
      collection.isActive ===
      false
    ) {
      const authorization =
        await requireAdminApiPermission(
          request,
          {
            collections: [
              "read_private",
            ],
          },
          {
            path:
              "/api/collections/[id]",

            forbiddenMessage:
              "You do not have permission to view private collections.",
          }
        );

      /*
       * Do not reveal the existence of
       * inactive collections to public,
       * unauthenticated visitors.
       */
      if (
        !authorization.authorized
      ) {
        if (
          authorization.response
            ?.status === 401
        ) {
          return createErrorResponse(
            "Collection not found.",
            404
          );
        }

        return authorization.response;
      }
    }

    const collectionWithCounts =
      await attachProductCounts(
        database,
        collection
      );

    return Response.json({
      success: true,

      collection:
        serializeDocument(
          collectionWithCounts
        ),
    });
  } catch (error) {
    console.error(
      "GET collection error:",
      error
    );

    return createErrorResponse(
      "Failed to fetch collection."
    );
  }
}

export async function PATCH(
  request,
  context
) {
  let database = null;
  let existingCollection =
    null;

  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          collections: [
            "update",
          ],
        },
        {
          path:
            "/api/collections/[id]",

          forbiddenMessage:
            "You do not have permission to update collections.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const identifier =
      await resolveCollectionId(
        context
      );

    if (!identifier) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return createErrorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    if (
      !isPlainObject(
        requestBody
      )
    ) {
      return createErrorResponse(
        "Collection data must be a valid object.",
        400
      );
    }

    database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(
      database
    );

    const collectionStore =
      database.collection(
        COLLECTIONS_COLLECTION_NAME
      );

    const productStore =
      database.collection(
        PRODUCTS_COLLECTION_NAME
      );

    existingCollection =
      await collectionStore.findOne(
        createCollectionLookup(
          identifier
        )
      );

    if (!existingCollection) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    const normalizedResult =
      normalizeCollectionUpdate(
        requestBody,
        existingCollection
      );

    if (
      !normalizedResult.success
    ) {
      return createErrorResponse(
        normalizedResult.message,
        400
      );
    }

    const normalizedCollection =
      normalizedResult.collection;

    const duplicateSeriesCollection =
      await findCollectionBySeries(
        database,
        normalizedCollection.series
      );

    if (
      duplicateSeriesCollection &&
      getObjectIdString(
        duplicateSeriesCollection._id
      ) !==
        getObjectIdString(
          existingCollection._id
        )
    ) {
      return createErrorResponse(
        "Another collection already uses this product series.",
        409
      );
    }

    const duplicateSlug =
      await collectionStore.findOne(
        {
          _id: {
            $ne:
              existingCollection._id,
          },

          slug:
            normalizedCollection.slug,
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (duplicateSlug) {
      return createErrorResponse(
        "Another collection already uses this slug.",
        409
      );
    }

    const previousSeries =
      normalizeSeriesName(
        existingCollection.series
      );

    const previousSeriesKey =
      normalizeSeriesKey(
        existingCollection.seriesKey ||
          previousSeries
      );

    const nextSeriesKey =
      normalizedCollection.seriesKey;

    const seriesChanged =
      previousSeriesKey !==
      nextSeriesKey;

    const now =
      new Date();

    const collectionToSave = {
      ...normalizedCollection,

      isAutoGenerated:
        false,

      customizedAt:
        existingCollection
          .customizedAt ||
        now,

      updatedAt:
        now,
    };

    await collectionStore.updateOne(
      {
        _id:
          existingCollection._id,
      },
      {
        $set:
          collectionToSave,

        $unset: {
          sourceProductId: "",
          autoGeneratedAt: "",
          autoEmptyAt: "",
        },
      }
    );

    try {
      if (seriesChanged) {
        await productStore.updateMany(
          buildSeriesMatchQuery(
            previousSeries
          ),
          {
            $set: {
              series:
                normalizedCollection
                  .series,

              seriesKey:
                normalizedCollection
                  .seriesKey,

              updatedAt:
                now,
            },
          }
        );
      } else {
        await productStore.updateMany(
          buildSeriesMatchQuery(
            normalizedCollection.series
          ),
          {
            $set: {
              series:
                normalizedCollection
                  .series,

              seriesKey:
                normalizedCollection
                  .seriesKey,
            },
          }
        );
      }
    } catch (
      productUpdateError
    ) {
      await collectionStore.replaceOne(
        {
          _id:
            existingCollection._id,
        },
        existingCollection
      );

      throw productUpdateError;
    }

    const savedCollection =
      await collectionStore.findOne(
        {
          _id:
            existingCollection._id,
        }
      );

    const collectionWithCounts =
      await attachProductCounts(
        database,
        savedCollection
      );

    return Response.json({
      success: true,

      message:
        seriesChanged
          ? "Collection and linked products updated successfully."
          : "Collection updated successfully.",

      collection:
        serializeDocument(
          collectionWithCounts
        ),
    });
  } catch (error) {
    if (
      error?.code === 11000
    ) {
      return createErrorResponse(
        "Another collection already uses this slug or series.",
        409
      );
    }

    console.error(
      "PATCH collection error:",
      error
    );

    return createErrorResponse(
      "Failed to update collection."
    );
  }
}

export async function DELETE(
  request,
  context
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          collections: [
            "delete",
          ],
        },
        {
          path:
            "/api/collections/[id]",

          forbiddenMessage:
            "You do not have permission to delete collections.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    const identifier =
      await resolveCollectionId(
        context
      );

    if (!identifier) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(
      database
    );

    const collectionStore =
      database.collection(
        COLLECTIONS_COLLECTION_NAME
      );

    const existingCollection =
      await collectionStore.findOne(
        createCollectionLookup(
          identifier
        )
      );

    if (!existingCollection) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    const counts =
      await getCollectionProductCounts(
        database,
        existingCollection
      );

    if (
      counts.productCount > 0
    ) {
      return createErrorResponse(
        `This collection still contains ${counts.productCount} ${
          counts.productCount === 1
            ? "product"
            : "products"
        }. Move, draft, or delete those products before deleting the collection.`,
        409
      );
    }

    const deletionResult =
      await collectionStore.deleteOne(
        {
          _id:
            existingCollection._id,
        }
      );

    if (
      deletionResult.deletedCount ===
      0
    ) {
      return createErrorResponse(
        "Collection not found.",
        404
      );
    }

    return Response.json({
      success: true,

      message:
        "Empty collection deleted successfully.",

      collection:
        serializeDocument({
          _id:
            existingCollection._id,

          title:
            existingCollection.title,

          series:
            existingCollection.series,
        }),
    });
  } catch (error) {
    console.error(
      "DELETE collection error:",
      error
    );

    return createErrorResponse(
      "Failed to delete collection."
    );
  }
}

export async function PUT(
  request,
  context
) {
  return PATCH(
    request,
    context
  );
}