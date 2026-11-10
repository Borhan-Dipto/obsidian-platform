import { createHash } from "node:crypto";
import sharp from "sharp";

import { requireAdminApiPermission } from "../../../lib/adminApiAuthorization";
import cloudinary from "../../../lib/cloudinary";
import clientPromise from "../../../lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE_BYTES = 55 * 1024 * 1024; // up to 5 × 10 MB + overhead
const MAX_FILES_PER_REQUEST = 5;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_EDGE = 4096;
const IMAGE_PROCESSING_TIMEOUT_SECONDS = 20;
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 25_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_UPLOADS_PER_ADMIN = 120;
const MAX_UPLOADS_PER_IP = 180;
const RATE_LIMIT_COLLECTION_NAME =
  "admin_media_upload_rate_limits";
const OUTPUT_FORMAT = "webp";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpeg"],
  ["image/jpg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

let rateLimitIndexPromise = null;

class UploadError extends Error {
  constructor(
    message,
    status = 400,
    code = "INVALID_IMAGE_UPLOAD"
  ) {
    super(message);

    this.name = "UploadError";
    this.status = status;
    this.code = code;
  }
}

function normalizeText(
  value,
  maximumLength = 500
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function createJsonResponse(
  body,
  status = 200,
  headers = {}
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "private, no-store, max-age=0",

      Pragma: "no-cache",

      "X-Content-Type-Options":
        "nosniff",

      ...headers,
    },
  });
}

function createErrorResponse(error) {
  return createJsonResponse(
    {
      success: false,

      code:
        error.code ||
        "IMAGE_UPLOAD_FAILED",

      message:
        error.message ||
        "Image upload failed.",
    },

    Number(error.status) || 500,

    error.headers || {}
  );
}

function hasCloudinaryConfiguration() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function isSameOriginRequest(request) {
  const fetchSite = normalizeText(
    request.headers.get(
      "sec-fetch-site"
    ),
    30
  ).toLowerCase();

  if (
    fetchSite &&
    ![
      "same-origin",
      "same-site",
      "none",
    ].includes(fetchSite)
  ) {
    return false;
  }

  const origin =
    request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return (
      new URL(request.url).origin ===
      new URL(origin).origin
    );
  } catch {
    return false;
  }
}

function isMultipartRequest(request) {
  return normalizeText(
    request.headers.get(
      "content-type"
    ),
    160
  )
    .toLowerCase()
    .startsWith(
      "multipart/form-data;"
    );
}

function startsWithBytes(
  buffer,
  signature
) {
  return (
    buffer.length >=
      signature.length &&
    signature.every(
      (byte, index) =>
        buffer[index] === byte
    )
  );
}

function readAscii(
  buffer,
  start,
  end
) {
  return buffer
    .subarray(
      start,
      Math.min(
        end,
        buffer.length
      )
    )
    .toString("ascii")
    .toLowerCase();
}

function detectImageFormat(buffer) {
  if (
    startsWithBytes(
      buffer,
      [
        0xff,
        0xd8,
        0xff,
      ]
    )
  ) {
    return "jpeg";
  }

  if (
    startsWithBytes(
      buffer,
      [
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]
    )
  ) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    readAscii(
      buffer,
      0,
      4
    ) === "riff" &&
    readAscii(
      buffer,
      8,
      12
    ) === "webp"
  ) {
    return "webp";
  }

  if (
    buffer.length >= 16 &&
    readAscii(
      buffer,
      4,
      8
    ) === "ftyp"
  ) {
    const header = readAscii(
      buffer,
      8,
      64
    );

    if (
      header.includes("avif") ||
      header.includes("avis")
    ) {
      return "avif";
    }
  }

  return "";
}

function isUploadFile(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.arrayBuffer ===
        "function" &&
      typeof value.size ===
        "number"
  );
}

function getClientIp(request) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  return normalizeText(
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
      request.headers.get(
        "x-real-ip"
      ) ||
      "unknown",
    120
  );
}

function hashIdentifier(
  scope,
  identifier
) {
  return createHash("sha256")
    .update(
      `${scope}:${identifier}`
    )
    .digest("hex");
}

async function getDatabase() {
  const client =
    await clientPromise;

  if (
    !client ||
    typeof client.db !==
      "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  return client.db(
    process.env.MONGODB_DB ||
      "obsidian"
  );
}

async function ensureRateLimitIndex(
  collection
) {
  if (!rateLimitIndexPromise) {
    rateLimitIndexPromise =
      collection
        .createIndex(
          {
            expiresAt: 1,
          },
          {
            name:
              "admin_media_upload_rate_limit_ttl",

            expireAfterSeconds: 0,
          }
        )
        .catch((error) => {
          rateLimitIndexPromise =
            null;

          console.error(
            "Admin media upload rate-limit index error:",
            error
          );

          return null;
        });
  }

  await rateLimitIndexPromise;
}

async function consumeRateLimit(
  collection,
  scope,
  identifier,
  limit,
  nowMs
) {
  const windowStartedAtMs =
    Math.floor(
      nowMs /
        RATE_LIMIT_WINDOW_MS
    ) * RATE_LIMIT_WINDOW_MS;

  const windowEndsAtMs =
    windowStartedAtMs +
    RATE_LIMIT_WINDOW_MS;

  const bucketId = [
    "admin-media-upload",

    scope,

    hashIdentifier(
      scope,
      identifier
    ),

    windowStartedAtMs,
  ].join(":");

  const now =
    new Date(nowMs);

  const document =
    await collection.findOneAndUpdate(
      {
        _id: bucketId,
      },
      {
        $inc: {
          attempts: 1,
        },

        $set: {
          updatedAt: now,
        },

        $setOnInsert: {
          scope,

          windowStartedAt:
            new Date(
              windowStartedAtMs
            ),

          windowEndsAt:
            new Date(
              windowEndsAtMs
            ),

          expiresAt:
            new Date(
              windowEndsAtMs +
                RATE_LIMIT_WINDOW_MS
            ),

          createdAt: now,
        },
      },
      {
        upsert: true,

        returnDocument:
          "after",

        includeResultMetadata:
          false,
      }
    );

  return {
    allowed:
      Number(
        document?.attempts ||
          1
      ) <= limit,

    retryAfterSeconds:
      Math.max(
        1,

        Math.ceil(
          (windowEndsAtMs -
            nowMs) /
            1000
        )
      ),
  };
}

async function consumeUploadLimits(
  request,
  authorization
) {
  const database =
    await getDatabase();

  const collection =
    database.collection(
      RATE_LIMIT_COLLECTION_NAME
    );

  await ensureRateLimitIndex(
    collection
  );

  const nowMs = Date.now();

  const adminIdentifier =
    normalizeText(
      authorization
        ?.session
        ?.user
        ?.id ||
        authorization
          ?.session
          ?.user
          ?.email ||
        "unknown-admin",

      240
    ).toLowerCase();

  const adminLimit =
    await consumeRateLimit(
      collection,
      "admin",
      adminIdentifier,
      MAX_UPLOADS_PER_ADMIN,
      nowMs
    );

  if (!adminLimit.allowed) {
    return adminLimit;
  }

  return consumeRateLimit(
    collection,
    "ip",
    getClientIp(request),
    MAX_UPLOADS_PER_IP,
    nowMs
  );
}

async function sanitizeImage(
  buffer,
  detectedFormat
) {
  let metadata;

  try {
    metadata = await sharp(
      buffer,
      {
        failOn: "error",

        limitInputPixels:
          MAX_IMAGE_PIXELS,

        sequentialRead: true,
        animated: false,
      }
    ).metadata();
  } catch {
    throw new UploadError(
      "The image is corrupted, unsupported, or exceeds the permitted pixel limit.",
      415,
      "UNSAFE_IMAGE_CONTENT"
    );
  }

  const width =
    Number(metadata.width);

  const height =
    Number(metadata.height);

  const pages =
    Number(
      metadata.pages || 1
    );

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new UploadError(
      "The image dimensions could not be verified.",
      415,
      "INVALID_IMAGE_DIMENSIONS"
    );
  }

  if (
    width * height >
    MAX_IMAGE_PIXELS
  ) {
    throw new UploadError(
      "The image contains too many pixels. Maximum allowed resolution is 40 megapixels.",
      413,
      "IMAGE_PIXEL_LIMIT_EXCEEDED"
    );
  }

  if (pages > 1) {
    throw new UploadError(
      "Animated or multi-page images are not supported.",
      415,
      "ANIMATED_IMAGE_NOT_ALLOWED"
    );
  }

  try {
    const result =
      await sharp(
        buffer,
        {
          failOn: "error",

          limitInputPixels:
            MAX_IMAGE_PIXELS,

          sequentialRead: true,
          animated: false,
        }
      )
        .timeout({
          seconds:
            IMAGE_PROCESSING_TIMEOUT_SECONDS,
        })
        .rotate()
        .resize({
          width:
            MAX_IMAGE_EDGE,

          height:
            MAX_IMAGE_EDGE,

          fit: "inside",

          withoutEnlargement:
            true,
        })
        .webp({
          quality: 92,
          alphaQuality: 92,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer({
          resolveWithObject:
            true,
        });

    if (
      !Buffer.isBuffer(
        result.data
      ) ||
      result.data.length <= 0 ||
      result.data.length >
        MAX_FILE_SIZE_BYTES
    ) {
      throw new UploadError(
        "The processed image exceeds the permitted upload size.",
        413,
        "PROCESSED_IMAGE_TOO_LARGE"
      );
    }

    return {
      buffer:
        result.data,

      sourceFormat:
        detectedFormat,

      format:
        OUTPUT_FORMAT,

      width:
        Number(
          result.info.width
        ) || width,

      height:
        Number(
          result.info.height
        ) || height,

      bytes:
        result.data.length,
    };
  } catch (error) {
    if (
      error instanceof
      UploadError
    ) {
      throw error;
    }

    throw new UploadError(
      "The image could not be processed safely.",
      415,
      "IMAGE_PROCESSING_FAILED"
    );
  }
}

function uploadToCloudinary(buffer) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      let settled = false;
      let timeoutId = null;

      const settle = (
        callback,
        value
      ) => {
        if (settled) {
          return;
        }

        settled = true;

        clearTimeout(
          timeoutId
        );

        callback(value);
      };

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "obsidian-media",

            resource_type:
              "image",

            type:
              "upload",

            format:
              OUTPUT_FORMAT,

            allowed_formats: [
              OUTPUT_FORMAT,
            ],

            unique_filename:
              true,

            overwrite:
              false,

            use_filename:
              false,

            invalidate:
              false,

            tags: [
              "obsidian",
              "admin-upload",
            ],
          },
          (
            error,
            result
          ) => {
            if (error) {
              settle(
                reject,

                new UploadError(
                  "Image storage rejected the upload.",
                  502,
                  "IMAGE_STORAGE_FAILED"
                )
              );

              return;
            }

            settle(
              resolve,
              result
            );
          }
        );

      timeoutId =
        setTimeout(
          () => {
            const error =
              new UploadError(
                "Image storage timed out.",
                504,
                "IMAGE_STORAGE_TIMEOUT"
              );

            settle(
              reject,
              error
            );

            uploadStream.destroy(
              error
            );
          },

          CLOUDINARY_UPLOAD_TIMEOUT_MS
        );

      uploadStream.on(
        "error",
        () => {
          settle(
            reject,

            new UploadError(
              "Image storage connection failed.",
              502,
              "IMAGE_STORAGE_FAILED"
            )
          );
        }
      );

      uploadStream.end(
        buffer
      );
    }
  );
}

function validateCloudinaryResult(
  result
) {
  if (
    !result ||
    typeof result.secure_url !==
      "string" ||
    typeof result.public_id !==
      "string"
  ) {
    throw new UploadError(
      "Image storage returned an invalid response.",
      502,
      "INVALID_IMAGE_STORAGE_RESPONSE"
    );
  }

  const cloudName =
    normalizeText(
      process.env
        .CLOUDINARY_CLOUD_NAME,
      120
    );

  let imageUrl;

  try {
    imageUrl =
      new URL(
        result.secure_url
      );
  } catch {
    throw new UploadError(
      "Image storage returned an invalid URL.",
      502,
      "INVALID_IMAGE_STORAGE_URL"
    );
  }

  if (
    imageUrl.protocol !==
      "https:" ||
    imageUrl.hostname !==
      "res.cloudinary.com" ||
    !imageUrl.pathname.startsWith(
      `/${cloudName}/image/upload/`
    ) ||
    !result.public_id.startsWith(
      "obsidian-media/"
    )
  ) {
    throw new UploadError(
      "Image storage returned an untrusted asset reference.",
      502,
      "UNTRUSTED_IMAGE_STORAGE_RESPONSE"
    );
  }

  return {
    imageUrl:
      imageUrl.toString(),

    publicId:
      result.public_id,
  };
}

export async function POST(request) {
  try {
    if (
      !isSameOriginRequest(
        request
      )
    ) {
      throw new UploadError(
        "Upload request was rejected.",
        403,
        "CROSS_ORIGIN_UPLOAD_REJECTED"
      );
    }

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
        MAX_REQUEST_SIZE_BYTES
    ) {
      throw new UploadError(
        "The upload request is too large. Maximum image size is 10 MB.",
        413,
        "UPLOAD_REQUEST_TOO_LARGE"
      );
    }

    if (
      !isMultipartRequest(
        request
      )
    ) {
      throw new UploadError(
        "Upload request must use multipart form data.",
        415,
        "INVALID_UPLOAD_CONTENT_TYPE"
      );
    }

    const authorization =
      await requireAdminApiPermission(
        request,

        {
          media: [
            "upload",
          ],
        },

        {
          path:
            "/api/upload",

          forbiddenMessage:
            "You do not have permission to upload media.",
        }
      );

    if (
      !authorization.authorized
    ) {
      return authorization.response;
    }

    if (
      !hasCloudinaryConfiguration()
    ) {
      console.error(
        "Cloudinary upload configuration is incomplete."
      );

      throw new UploadError(
        "Image storage is not configured.",
        503,
        "IMAGE_STORAGE_NOT_CONFIGURED"
      );
    }

    const rateLimit =
      await consumeUploadLimits(
        request,
        authorization
      );

    if (
      !rateLimit.allowed
    ) {
      const error =
        new UploadError(
          "Too many image uploads. Please try again later.",
          429,
          "IMAGE_UPLOAD_RATE_LIMITED"
        );

      error.headers = {
        "Retry-After":
          String(
            rateLimit.retryAfterSeconds
          ),
      };

      throw error;
    }

    let formData;

    try {
      formData =
        await request.formData();
    } catch {
      throw new UploadError(
        "Invalid upload request."
      );
    }

    const files =
      formData.getAll(
        "file"
      );

    if (
      files.length === 0 ||
      !files.every(isUploadFile)
    ) {
      throw new UploadError(
        "Upload at least one valid image file."
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      throw new UploadError(
        `Upload at most ${MAX_FILES_PER_REQUEST} images at once.`,
        400,
        "TOO_MANY_FILES"
      );
    }

    async function processSingleFile(file) {
      if (file.size <= 0) {
        throw new UploadError("The selected image is empty.");
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new UploadError(
          "Image size must not exceed 10 MB.",
          413,
          "IMAGE_FILE_TOO_LARGE"
        );
      }

      const declaredMimeType = normalizeText(file.type, 120).toLowerCase();
      const expectedFormat = ALLOWED_IMAGE_TYPES.get(declaredMimeType);

      if (!expectedFormat) {
        throw new UploadError(
          "Only JPEG, PNG, WebP, and AVIF images are allowed.",
          415,
          "UNSUPPORTED_IMAGE_TYPE"
        );
      }

      let buffer;
      try {
        buffer = Buffer.from(await file.arrayBuffer());
      } catch {
        throw new UploadError("The image could not be read.");
      }

      if (buffer.length <= 0 || buffer.length !== file.size) {
        throw new UploadError("The uploaded image is incomplete or corrupted.");
      }

      const detectedFormat = detectImageFormat(buffer);

      if (!detectedFormat) {
        throw new UploadError(
          "The uploaded file is not a supported image.",
          415,
          "INVALID_IMAGE_SIGNATURE"
        );
      }

      if (detectedFormat !== expectedFormat) {
        throw new UploadError(
          "The file content does not match its declared image type.",
          415,
          "IMAGE_TYPE_MISMATCH"
        );
      }

      const sanitizedImage = await sanitizeImage(buffer, detectedFormat);
      const cloudinaryResult = await uploadToCloudinary(sanitizedImage.buffer);
      const trustedResult = validateCloudinaryResult(cloudinaryResult);

      return {
        imageUrl: trustedResult.imageUrl,
        publicId: trustedResult.publicId,
        width: sanitizedImage.width,
        height: sanitizedImage.height,
        format: sanitizedImage.format,
        sourceFormat: sanitizedImage.sourceFormat,
        bytes: sanitizedImage.bytes,
      };
    }

    const results = await Promise.all(files.map(processSingleFile));

    // Single file: backward-compatible flat response
    if (results.length === 1) {
      return createJsonResponse(
        {
          success: true,
          message: "Image uploaded successfully.",
          ...results[0],
        },
        201
      );
    }

    // Multiple files: array response
    return createJsonResponse(
      {
        success: true,
        message: `${results.length} images uploaded successfully.`,
        images: results,
        // convenience: first image at top level for callers that only read imageUrl
        imageUrl: results[0].imageUrl,
        publicId: results[0].publicId,
      },
      201
    );
  } catch (error) {
    if (
      error instanceof
      UploadError
    ) {
      return createErrorResponse(
        error
      );
    }

    console.error(
      "Cloudinary upload error:",
      error
    );

    return createErrorResponse(
      new UploadError(
        "Image upload failed.",
        500,
        "IMAGE_UPLOAD_FAILED"
      )
    );
  }
}
