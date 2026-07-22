import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import {
  PRODUCTS_COLLECTION_NAME,
  createCatalogSlug,
  deactivateEmptyAutoCollection,
  ensureCatalogIndexes,
  ensureCollectionForProduct,
  getCatalogDatabase,
  normalizeProductPayload,
  normalizeSeriesKey,
  resolveCanonicalSeries,
} from "../../../../lib/catalog";

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

async function resolveProductId(context) {
  const params = await context.params;

  try {
    return decodeURIComponent(
      String(params?.id || "")
    ).trim();
  } catch {
    return String(params?.id || "").trim();
  }
}

function createProductLookup(productId) {
  const normalizedProductId =
    createCatalogSlug(productId);

  const possibleIds = [
    productId,
    normalizedProductId,
  ].filter(
    (value, index, values) =>
      Boolean(value) &&
      values.indexOf(value) === index
  );

  if (possibleIds.length === 1) {
    return {
      id: possibleIds[0],
    };
  }

  return {
    id: {
      $in: possibleIds,
    },
  };
}

async function getExistingProduct(
  database,
  productId
) {
  if (!productId) {
    return null;
  }

  return database
    .collection(PRODUCTS_COLLECTION_NAME)
    .findOne(createProductLookup(productId));
}

async function restoreProduct(
  database,
  existingProduct
) {
  if (!existingProduct?._id) {
    return;
  }

  await database
    .collection(PRODUCTS_COLLECTION_NAME)
    .replaceOne(
      {
        _id: existingProduct._id,
      },
      existingProduct,
      {
        upsert: true,
      }
    );
}

async function safelyDeactivateSeries(
  database,
  series
) {
  try {
    return await deactivateEmptyAutoCollection(
      database,
      series
    );
  } catch (error) {
    console.error(
      "Automatic collection cleanup error:",
      error
    );

    throw error;
  }
}

export async function GET(request, context) {
  try {
    const productId =
      await resolveProductId(context);

    if (!productId) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(database);

    const product = await getExistingProduct(
      database,
      productId
    );

    if (!product) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    if (product.isActive === false) {
      const authenticated =
        await isAdminAuthenticated();

      if (!authenticated) {
        return createErrorResponse(
          "Product not found.",
          404
        );
      }
    }

    return Response.json({
      success: true,
      product: serializeDocument(product),
    });
  } catch (error) {
    console.error(
      "GET product error:",
      error
    );

    return createErrorResponse(
      "Failed to fetch product."
    );
  }
}

export async function PATCH(
  request,
  context
) {
  let database = null;
  let existingProduct = null;
  let savedProduct = null;

  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createErrorResponse(
        "Unauthorized.",
        401
      );
    }

    const productId =
      await resolveProductId(context);

    if (!productId) {
      return createErrorResponse(
        "Product not found.",
        404
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
        "Product data must be a valid object.",
        400
      );
    }

    database = await getCatalogDatabase();

    await ensureCatalogIndexes(database);

    const productStore =
      database.collection(
        PRODUCTS_COLLECTION_NAME
      );

    existingProduct =
      await getExistingProduct(
        database,
        productId
      );

    if (!existingProduct) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    const normalizedResult =
      normalizeProductPayload(
        requestBody,
        existingProduct
      );

    if (!normalizedResult.success) {
      return createErrorResponse(
        normalizedResult.message,
        400
      );
    }

    const canonicalSeries =
      await resolveCanonicalSeries(
        database,
        normalizedResult.product.series
      );

    const finalSeries =
      canonicalSeries ||
      normalizedResult.product.series;

    const normalizedProduct = {
      ...normalizedResult.product,

      series: finalSeries,

      seriesKey:
        normalizeSeriesKey(finalSeries),
    };

    if (
      normalizedProduct.id !==
      existingProduct.id
    ) {
      const duplicateProduct =
        await productStore.findOne(
          {
            _id: {
              $ne: existingProduct._id,
            },

            id: normalizedProduct.id,
          },
          {
            projection: {
              _id: 1,
            },
          }
        );

      if (duplicateProduct) {
        return createErrorResponse(
          "Another product already uses this ID.",
          409
        );
      }
    }

    const previousSeries =
      existingProduct.series;

    const previousSeriesKey =
      normalizeSeriesKey(
        existingProduct.seriesKey ||
          previousSeries
      );

    const nextSeriesKey =
      normalizeSeriesKey(
        normalizedProduct.series
      );

    const now = new Date();

    const productToSave = {
      ...normalizedProduct,
      createdAt:
        existingProduct.createdAt || now,
      updatedAt: now,
    };

    await productStore.updateOne(
      {
        _id: existingProduct._id,
      },
      {
        $set: productToSave,
      }
    );

    savedProduct =
      await productStore.findOne({
        _id: existingProduct._id,
      });

    if (!savedProduct) {
      throw new Error(
        "The updated product could not be loaded."
      );
    }

    try {
      if (savedProduct.isActive !== false) {
        await ensureCollectionForProduct(
          database,
          savedProduct
        );
      }

      const seriesChanged =
        previousSeriesKey !== nextSeriesKey;

      const becameInactive =
        existingProduct.isActive !== false &&
        savedProduct.isActive === false;

      if (
        seriesChanged ||
        becameInactive
      ) {
        await safelyDeactivateSeries(
          database,
          previousSeries
        );
      }

      if (
        savedProduct.isActive === false
      ) {
        await safelyDeactivateSeries(
          database,
          savedProduct.series
        );
      }
    } catch (synchronizationError) {
      await restoreProduct(
        database,
        existingProduct
      );

      if (
        savedProduct?.series &&
        normalizeSeriesKey(
          savedProduct.series
        ) !== previousSeriesKey
      ) {
        try {
          await deactivateEmptyAutoCollection(
            database,
            savedProduct.series
          );
        } catch (cleanupError) {
          console.error(
            "Rollback collection cleanup error:",
            cleanupError
          );
        }
      }

      throw synchronizationError;
    }

    return Response.json({
      success: true,

      message:
        savedProduct.isActive === false
          ? "Product saved as draft successfully."
          : "Product updated successfully.",

      product:
        serializeDocument(savedProduct),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return createErrorResponse(
        "Another product already uses this ID.",
        409
      );
    }

    console.error(
      "PATCH product error:",
      error
    );

    return createErrorResponse(
      "Failed to update product."
    );
  }
}

export async function DELETE(
  request,
  context
) {
  let database = null;
  let existingProduct = null;

  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createErrorResponse(
        "Unauthorized.",
        401
      );
    }

    const productId =
      await resolveProductId(context);

    if (!productId) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    database = await getCatalogDatabase();

    await ensureCatalogIndexes(database);

    const productStore =
      database.collection(
        PRODUCTS_COLLECTION_NAME
      );

    existingProduct =
      await getExistingProduct(
        database,
        productId
      );

    if (!existingProduct) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    const deletionResult =
      await productStore.deleteOne({
        _id: existingProduct._id,
      });

    if (
      deletionResult.deletedCount === 0
    ) {
      return createErrorResponse(
        "Product not found.",
        404
      );
    }

    try {
      await deactivateEmptyAutoCollection(
        database,
        existingProduct.series
      );
    } catch (synchronizationError) {
      try {
        await productStore.insertOne(
          existingProduct
        );
      } catch (rollbackError) {
        console.error(
          "Product deletion rollback error:",
          rollbackError
        );
      }

      throw synchronizationError;
    }

    return Response.json({
      success: true,
      message:
        "Product deleted successfully.",

      product: serializeDocument({
        id: existingProduct.id,
        name: existingProduct.name,
        series: existingProduct.series,
      }),
    });
  } catch (error) {
    console.error(
      "DELETE product error:",
      error
    );

    return createErrorResponse(
      "Failed to delete product."
    );
  }
}

export async function PUT(
  request,
  context
) {
  return PATCH(request, context);
}