import clientPromise from "../../../../lib/mongodb";
import { isAdminAuthenticated } from "../../../../lib/adminAuth";
import {
  CMS_SCHEMA_VERSION,
  createCmsDocument,
  deepMerge,
  getCmsDefault,
  isSupportedCmsKey,
  mergeCmsContent,
} from "../../../../lib/cmsDefaults";

const CMS_COLLECTION_NAME = "cms";

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

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

function serializeDocument(document) {
  if (!document) {
    return null;
  }

  return JSON.parse(JSON.stringify(document));
}

function isValidObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function removeProtectedFields(document = {}) {
  if (!isValidObject(document)) {
    return {};
  }

  const {
    _id,
    key,
    schemaVersion,
    createdAt,
    updatedAt,
    ...safeDocument
  } = document;

  return safeDocument;
}

async function getCmsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  return db.collection(CMS_COLLECTION_NAME);
}

async function resolveCmsKey(params) {
  const resolvedParams = await params;

  return normalizeKey(resolvedParams?.key);
}

async function ensureCmsDocument(collection, key) {
  const existingDocument = await collection.findOne({ key });

  if (existingDocument) {
    return mergeCmsContent(key, existingDocument);
  }

  const newDocument = createCmsDocument(key);

  if (!newDocument) {
    return null;
  }

  await collection.updateOne(
    { key },
    {
      $setOnInsert: newDocument,
    },
    {
      upsert: true,
    }
  );

  const insertedDocument = await collection.findOne({ key });

  return mergeCmsContent(
    key,
    insertedDocument || newDocument
  );
}

export async function GET(request, { params }) {
  try {
    const key = await resolveCmsKey(params);

    if (!isSupportedCmsKey(key)) {
      return createErrorResponse(
        "Unsupported CMS content key.",
        404
      );
    }

    const collection = await getCmsCollection();

    const document = await ensureCmsDocument(
      collection,
      key
    );

    if (!document) {
      return createErrorResponse(
        "CMS content could not be loaded.",
        404
      );
    }

    return Response.json({
      success: true,
      key,
      content: serializeDocument(document),
    });
  } catch (error) {
    console.error("GET CMS content error:", error);

    return createErrorResponse(
      "Failed to load CMS content."
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return createErrorResponse(
        "Unauthorized.",
        401
      );
    }

    const key = await resolveCmsKey(params);

    if (!isSupportedCmsKey(key)) {
      return createErrorResponse(
        "Unsupported CMS content key.",
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

    if (!isValidObject(requestBody)) {
      return createErrorResponse(
        "CMS content must be a valid object.",
        400
      );
    }

    const collection = await getCmsCollection();

    const storedDocument =
      (await collection.findOne({ key })) ||
      getCmsDefault(key);

    if (!storedDocument) {
      return createErrorResponse(
        "CMS content could not be prepared.",
        400
      );
    }

    const safeStoredDocument =
      removeProtectedFields(storedDocument);

    const safeIncomingDocument =
      removeProtectedFields(requestBody);

    const mergedChanges = deepMerge(
      safeStoredDocument,
      safeIncomingDocument
    );

    const normalizedDocument = mergeCmsContent(
      key,
      mergedChanges
    );

    if (!normalizedDocument) {
      return createErrorResponse(
        "CMS content could not be normalized.",
        400
      );
    }

    const {
      _id,
      createdAt,
      updatedAt,
      ...contentToSave
    } = normalizedDocument;

    const now = new Date();

    await collection.updateOne(
      { key },
      {
        $set: {
          ...contentToSave,
          key,
          schemaVersion: CMS_SCHEMA_VERSION,
          updatedAt: now,
        },

        $setOnInsert: {
          createdAt:
            storedDocument?.createdAt || now,
        },
      },
      {
        upsert: true,
      }
    );

    const updatedDocument =
      await collection.findOne({ key });

    return Response.json({
      success: true,
      message: "CMS content updated successfully.",
      key,
      content: serializeDocument(
        mergeCmsContent(
          key,
          updatedDocument || normalizedDocument
        )
      ),
    });
  } catch (error) {
    console.error("PATCH CMS content error:", error);

    return createErrorResponse(
      "Failed to update CMS content."
    );
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}