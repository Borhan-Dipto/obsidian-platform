import {
  requireAdminApiPermission,
} from "../../../lib/adminApiAuthorization";

import {
  PRODUCTS_COLLECTION_NAME,
  ensureCatalogIndexes,
  ensureCollectionForProduct,
  getCatalogDatabase,
  getPublicProductQuery,
  normalizeProductPayload,
  normalizeSeriesKey,
  resolveCanonicalSeries,
} from "../../../lib/catalog";

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

function normalizeBooleanQuery(
  value
) {
  return (
    String(value || "")
      .trim()
      .toLowerCase() ===
    "true"
  );
}

export async function GET(
  request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const includeInactive =
      normalizeBooleanQuery(
        requestUrl.searchParams.get(
          "includeInactive"
        )
      );

    if (includeInactive) {
      const authorization =
        await requireAdminApiPermission(
          request,
          {
            products: [
              "read_private",
            ],
          },
          {
            path:
              "/api/products",

            forbiddenMessage:
              "You do not have permission to view private products.",
          }
        );

      if (
        !authorization.authorized
      ) {
        return authorization.response;
      }
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(
      database
    );

    const query =
      includeInactive
        ? {}
        : getPublicProductQuery();

    const products =
      await database
        .collection(
          PRODUCTS_COLLECTION_NAME
        )
        .find(query)
        .sort({
          createdAt: -1,
        })
        .toArray();

    return Response.json({
      success: true,

      products:
        serializeDocument(
          products
        ),
    });
  } catch (error) {
    console.error(
      "GET products error:",
      error
    );

    return createErrorResponse(
      "Failed to fetch products."
    );
  }
}

export async function POST(
  request
) {
  let insertedProductId =
    null;

  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          products: [
            "create",
          ],
        },
        {
          path:
            "/api/products",

          forbiddenMessage:
            "You do not have permission to create products.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
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
        "Product data must be a valid object.",
        400
      );
    }

    const normalizedResult =
      normalizeProductPayload(
        requestBody
      );

    if (
      !normalizedResult.success
    ) {
      return createErrorResponse(
        normalizedResult.message,
        400
      );
    }

    const database =
      await getCatalogDatabase();

    await ensureCatalogIndexes(
      database
    );

    const productStore =
      database.collection(
        PRODUCTS_COLLECTION_NAME
      );

    const canonicalSeries =
      await resolveCanonicalSeries(
        database,
        normalizedResult
          .product.series
      );

    const now =
      new Date();

    const newProduct = {
      ...normalizedResult.product,

      series:
        canonicalSeries ||
        normalizedResult
          .product.series,

      seriesKey:
        normalizeSeriesKey(
          canonicalSeries ||
            normalizedResult
              .product.series
        ),

      createdAt: now,
      updatedAt: now,
    };

    const existingProduct =
      await productStore.findOne(
        {
          id: newProduct.id,
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (existingProduct) {
      return createErrorResponse(
        "A product with this ID already exists.",
        409
      );
    }

    const insertionResult =
      await productStore.insertOne(
        newProduct
      );

    insertedProductId =
      insertionResult.insertedId;

    try {
      await ensureCollectionForProduct(
        database,
        {
          ...newProduct,

          _id:
            insertedProductId,
        }
      );
    } catch (
      collectionError
    ) {
      await productStore.deleteOne(
        {
          _id:
            insertedProductId,
        }
      );

      insertedProductId =
        null;

      throw collectionError;
    }

    return Response.json(
      {
        success: true,

        message:
          newProduct.isActive ===
          false
            ? "Draft product created successfully."
            : "Product created successfully.",

        product:
          serializeDocument({
            ...newProduct,

            _id:
              insertionResult.insertedId,
          }),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error?.code === 11000
    ) {
      return createErrorResponse(
        "A product with this ID already exists.",
        409
      );
    }

    console.error(
      "POST product error:",
      error
    );

    return createErrorResponse(
      "Failed to create product."
    );
  }
}