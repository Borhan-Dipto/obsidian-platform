import clientPromise from "./mongodb";
import {
  createCmsDocument,
  isSupportedCmsKey,
  mergeCmsContent,
} from "./cmsDefaults";

const CMS_COLLECTION_NAME = "cms";

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function serializeValue(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getCmsCollection() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  return db.collection(CMS_COLLECTION_NAME);
}

async function createMissingCmsDocument(collection, key) {
  const defaultDocument = createCmsDocument(key);

  if (!defaultDocument) {
    return null;
  }

  await collection.updateOne(
    { key },
    {
      $setOnInsert: defaultDocument,
    },
    { upsert: true }
  );

  const storedDocument = await collection.findOne({ key });

  return storedDocument || defaultDocument;
}

export async function getCmsContent(key) {
  const normalizedKey = normalizeKey(key);

  if (!isSupportedCmsKey(normalizedKey)) {
    console.error(`Unsupported CMS content key: ${normalizedKey}`);

    return null;
  }

  try {
    const collection = await getCmsCollection();

    let storedDocument = await collection.findOne({
      key: normalizedKey,
    });

    if (!storedDocument) {
      storedDocument = await createMissingCmsDocument(
        collection,
        normalizedKey
      );
    }

    const mergedContent = mergeCmsContent(
      normalizedKey,
      storedDocument || {}
    );

    if (!mergedContent) {
      return null;
    }

    return serializeValue(mergedContent);
  } catch (error) {
    console.error(
      `Failed to load CMS content for "${normalizedKey}":`,
      error
    );

    const fallbackContent = mergeCmsContent(normalizedKey, {});

    return fallbackContent
      ? serializeValue(fallbackContent)
      : null;
  }
}

export async function getMultipleCmsContent(keys = []) {
  if (!Array.isArray(keys)) {
    return {};
  }

  const normalizedKeys = [
    ...new Set(
      keys
        .map(normalizeKey)
        .filter((key) => isSupportedCmsKey(key))
    ),
  ];

  if (normalizedKeys.length === 0) {
    return {};
  }

  try {
    const collection = await getCmsCollection();

    const storedDocuments = await collection
      .find({
        key: {
          $in: normalizedKeys,
        },
      })
      .toArray();

    const storedDocumentMap = new Map(
      storedDocuments.map((document) => [
        document.key,
        document,
      ])
    );

    const missingKeys = normalizedKeys.filter(
      (key) => !storedDocumentMap.has(key)
    );

    if (missingKeys.length > 0) {
      await Promise.all(
        missingKeys.map(async (key) => {
          const createdDocument =
            await createMissingCmsDocument(collection, key);

          if (createdDocument) {
            storedDocumentMap.set(key, createdDocument);
          }
        })
      );
    }

    return normalizedKeys.reduce((result, key) => {
      const mergedContent = mergeCmsContent(
        key,
        storedDocumentMap.get(key) || {}
      );

      result[key] = mergedContent
        ? serializeValue(mergedContent)
        : null;

      return result;
    }, {});
  } catch (error) {
    console.error(
      "Failed to load multiple CMS documents:",
      error
    );

    return normalizedKeys.reduce((result, key) => {
      const fallbackContent = mergeCmsContent(key, {});

      result[key] = fallbackContent
        ? serializeValue(fallbackContent)
        : null;

      return result;
    }, {});
  }
}

export async function getHomepageContent() {
  return getCmsContent("homepage");
}

export async function getNavbarContent() {
  return getCmsContent("navbar");
}

export async function getFooterContent() {
  return getCmsContent("footer");
}

export async function getAboutContent() {
  return getCmsContent("about");
}

export async function getContactContent() {
  return getCmsContent("contact");
}

export async function getJournalContent() {
  return getCmsContent("journal");
}

export async function getCollectionsContent() {
  return getCmsContent("collections");
}

export async function getShopContent() {
  return getCmsContent("shop");
}

export async function getProductContent() {
  return getCmsContent("product");
}

export async function getSizeGuideContent() {
  return getCmsContent("size-guide");
}

export async function getTrackOrderContent() {
  return getCmsContent("track-order");
}

export async function getSuccessContent() {
  return getCmsContent("success");
}