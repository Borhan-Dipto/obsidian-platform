import clientPromise from "../../../../lib/mongodb";

import {
  requireAdminApiPermission,
} from "../../../../lib/adminApiAuthorization";

import {
  CMS_SCHEMA_VERSION,
  createCmsDocument,
  deepMerge,
  getCmsDefault,
  isSupportedCmsKey,
  mergeCmsContent,
} from "../../../../lib/cmsDefaults";

import {
  sanitizeNavbarContent,
  validateNavbarContentInput,
} from "../../../../lib/navbarCms";

import {
  sanitizeSizeGuideCmsContent,
  validateSizeGuideContentInput,
} from "../../../../lib/sizeGuide";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const CMS_COLLECTION_NAME =
  "cms";

const MAX_REQUEST_SIZE =
  500_000;

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function createResponse(
  body,
  status = 200
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "no-store",
    },
  });
}

function createErrorResponse(
  message,
  status = 500,
  details
) {
  return createResponse(
    {
      success: false,
      message,

      details:
        details ||
        undefined,
    },
    status
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

function isValidObject(value) {
  return Boolean(
    value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
  );
}

function removeProtectedFields(
  document = {}
) {
  if (
    !isValidObject(
      document
    )
  ) {
    return {};
  }

  const safeDocument = {
    ...document,
  };

  delete safeDocument._id;
  delete safeDocument.key;
  delete safeDocument.schemaVersion;
  delete safeDocument.createdAt;
  delete safeDocument.updatedAt;

  return safeDocument;
}

function normalizeConfiguredOrigin(
  value
) {
  const candidate =
    String(value || "").trim();

  if (!candidate) {
    return "";
  }

  try {
    return new URL(
      candidate.includes("://")
        ? candidate
        : `https://${candidate}`
    ).origin;
  } catch {
    return "";
  }
}

function getTrustedOrigins(
  request
) {
  const origins =
    new Set();

  try {
    origins.add(
      new URL(
        request.url
      ).origin
    );
  } catch {
    /*
     * The request URL should normally
     * always be valid.
     */
  }

  const configuredOrigins = [
    process.env
      .NEXT_PUBLIC_SITE_URL,

    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL,
  ];

  for (
    const configuredOrigin
    of configuredOrigins
  ) {
    const normalizedOrigin =
      normalizeConfiguredOrigin(
        configuredOrigin
      );

    if (normalizedOrigin) {
      origins.add(
        normalizedOrigin
      );
    }
  }

  return origins;
}

function isTrustedWriteRequest(
  request
) {
  const originHeader =
    request.headers.get(
      "origin"
    );

  if (!originHeader) {
    return true;
  }

  const normalizedOrigin =
    normalizeConfiguredOrigin(
      originHeader
    );

  if (!normalizedOrigin) {
    return false;
  }

  return getTrustedOrigins(
    request
  ).has(normalizedOrigin);
}

function isJsonRequest(request) {
  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase();

  return Boolean(
    contentType &&
      contentType.startsWith(
        "application/json"
      )
  );
}

async function readJsonBody(
  request
) {
  const contentLength =
    Number(
      request.headers.get(
        "content-length"
      ) || 0
    );

  if (
    Number.isFinite(
      contentLength
    ) &&
    contentLength >
      MAX_REQUEST_SIZE
  ) {
    return {
      success: false,
      status: 413,

      message:
        "CMS request body is too large.",
    };
  }

  const rawBody =
    await request.text();

  if (
    Buffer.byteLength(
      rawBody,
      "utf8"
    ) >
    MAX_REQUEST_SIZE
  ) {
    return {
      success: false,
      status: 413,

      message:
        "CMS request body is too large.",
    };
  }

  if (!rawBody.trim()) {
    return {
      success: false,
      status: 400,

      message:
        "CMS request body is required.",
    };
  }

  try {
    return {
      success: true,

      body:
        JSON.parse(
          rawBody
        ),
    };
  } catch {
    return {
      success: false,
      status: 400,

      message:
        "Invalid JSON request body.",
    };
  }
}

function normalizeCmsDocument(
  key,
  content = {}
) {
  if (key === "navbar") {
    return sanitizeNavbarContent(
      content,
      {
        schemaVersion:
          CMS_SCHEMA_VERSION,
      }
    );
  }

  if (key === "size-guide") {
    return sanitizeSizeGuideCmsContent(
      content,
      {
        schemaVersion:
          CMS_SCHEMA_VERSION,
      }
    );
  }

  return mergeCmsContent(
    key,
    content
  );
}

async function getCmsCollection() {
  const client =
    await clientPromise;

  const database =
    client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

  return database.collection(
    CMS_COLLECTION_NAME
  );
}

async function resolveCmsKey(
  params
) {
  const resolvedParams =
    await params;

  return normalizeKey(
    resolvedParams?.key
  );
}

async function ensureCmsDocument(
  collection,
  key
) {
  const existingDocument =
    await collection.findOne({
      key,
    });

  if (existingDocument) {
    return normalizeCmsDocument(
      key,
      existingDocument
    );
  }

  const newDocument =
    createCmsDocument(key);

  if (!newDocument) {
    return null;
  }

  const normalizedNewDocument =
    normalizeCmsDocument(
      key,
      newDocument
    );

  if (
    !normalizedNewDocument
  ) {
    return null;
  }

  const now =
    new Date();

  const documentToInsert = {
    ...normalizedNewDocument,

    key,

    schemaVersion:
      CMS_SCHEMA_VERSION,

    createdAt:
      newDocument.createdAt ||
      now,

    updatedAt:
      newDocument.updatedAt ||
      now,
  };

  await collection.updateOne(
    {
      key,
    },
    {
      $setOnInsert:
        documentToInsert,
    },
    {
      upsert: true,
    }
  );

  const insertedDocument =
    await collection.findOne({
      key,
    });

  return normalizeCmsDocument(
    key,
    insertedDocument ||
      documentToInsert
  );
}

export async function GET(
  request,
  { params }
) {
  try {
    const key =
      await resolveCmsKey(
        params
      );

    if (
      !isSupportedCmsKey(
        key
      )
    ) {
      return createErrorResponse(
        "Unsupported CMS content key.",
        404
      );
    }

    const collection =
      await getCmsCollection();

    const document =
      await ensureCmsDocument(
        collection,
        key
      );

    if (!document) {
      return createErrorResponse(
        "CMS content could not be loaded.",
        404
      );
    }

    return createResponse({
      success: true,
      key,

      content:
        serializeDocument(
          document
        ),
    });
  } catch (error) {
    console.error(
      "GET CMS content error:",
      error
    );

    return createErrorResponse(
      "Failed to load CMS content."
    );
  }
}

export async function PATCH(
  request,
  { params }
) {
  try {
    const authorization =
      await requireAdminApiPermission(
        request,
        {
          content: [
            "update",
          ],
        },
        {
          path:
            "/api/cms/[key]",

          forbiddenMessage:
            "You do not have permission to update website content.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    if (
      !isTrustedWriteRequest(
        request
      )
    ) {
      return createErrorResponse(
        "Untrusted request origin.",
        403
      );
    }

    if (
      !isJsonRequest(
        request
      )
    ) {
      return createErrorResponse(
        "Content-Type must be application/json.",
        415
      );
    }

    const key =
      await resolveCmsKey(
        params
      );

    if (
      !isSupportedCmsKey(
        key
      )
    ) {
      return createErrorResponse(
        "Unsupported CMS content key.",
        404
      );
    }

    const parsedBody =
      await readJsonBody(
        request
      );

    if (
      !parsedBody.success
    ) {
      return createErrorResponse(
        parsedBody.message,
        parsedBody.status
      );
    }

    const requestBody =
      parsedBody.body;

    if (
      !isValidObject(
        requestBody
      )
    ) {
      return createErrorResponse(
        "CMS content must be a valid object.",
        400
      );
    }

    const safeIncomingDocument =
      removeProtectedFields(
        requestBody
      );

    if (
      key === "navbar"
    ) {
      const validation =
        validateNavbarContentInput(
          safeIncomingDocument
        );

      if (
        !validation.valid
      ) {
        return createErrorResponse(
          validation.errors[0]
            ?.message ||
            "Navbar content is invalid.",
          400,
          validation.errors
        );
      }
    }

    if (
      key === "size-guide" &&
      Object.prototype
        .hasOwnProperty
        .call(
          safeIncomingDocument
            ?.content || {},
          "sizes"
        )
    ) {
      const validation =
        validateSizeGuideContentInput(
          safeIncomingDocument
        );

      if (
        !validation.valid
      ) {
        return createErrorResponse(
          validation.errors[0]
            ?.message ||
            "Size Guide content is invalid.",
          400,
          validation.errors
        );
      }
    }

    const collection =
      await getCmsCollection();

    const storedDocument =
      (
        await collection.findOne({
          key,
        })
      ) ||
      getCmsDefault(key);

    if (!storedDocument) {
      return createErrorResponse(
        "CMS content could not be prepared.",
        400
      );
    }

    const safeStoredDocument =
      removeProtectedFields(
        storedDocument
      );

    const mergedChanges =
      deepMerge(
        safeStoredDocument,
        safeIncomingDocument
      );

    const normalizedDocument =
      normalizeCmsDocument(
        key,
        mergedChanges
      );

    if (
      !normalizedDocument
    ) {
      return createErrorResponse(
        "CMS content could not be normalized.",
        400
      );
    }

    if (
      key === "size-guide"
    ) {
      const validation =
        validateSizeGuideContentInput(
          normalizedDocument
        );

      if (
        !validation.valid
      ) {
        return createErrorResponse(
          validation.errors[0]
            ?.message ||
            "Size Guide content is invalid.",
          400,
          validation.errors
        );
      }
    }

    const contentToSave = {
      ...normalizedDocument,
    };

    delete contentToSave._id;
    delete contentToSave.createdAt;
    delete contentToSave.updatedAt;

    const now =
      new Date();

    const preservedCreatedAt =
      storedDocument
        ?.createdAt ||
      now;

    if (
      key === "navbar"
    ) {
      await collection.replaceOne(
        {
          key,
        },
        {
          ...contentToSave,

          key,

          schemaVersion:
            CMS_SCHEMA_VERSION,

          createdAt:
            preservedCreatedAt,

          updatedAt:
            now,
        },
        {
          upsert: true,
        }
      );
    } else {
      await collection.updateOne(
        {
          key,
        },
        {
          $set: {
            ...contentToSave,

            key,

            schemaVersion:
              CMS_SCHEMA_VERSION,

            updatedAt:
              now,
          },

          $setOnInsert: {
            createdAt:
              preservedCreatedAt,
          },
        },
        {
          upsert: true,
        }
      );
    }

    const updatedDocument =
      await collection.findOne({
        key,
      });

    const normalizedUpdatedDocument =
      normalizeCmsDocument(
        key,
        updatedDocument ||
          normalizedDocument
      );

    return createResponse({
      success: true,

      message:
        "CMS content updated successfully.",

      key,

      content:
        serializeDocument(
          normalizedUpdatedDocument
        ),
    });
  } catch (error) {
    console.error(
      "PATCH CMS content error:",
      error
    );

    return createErrorResponse(
      "Failed to update CMS content."
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
