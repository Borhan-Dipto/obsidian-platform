import { isAdminAuthenticated } from "../../../lib/adminAuth";
import cloudinary from "../../../lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE_BYTES = 12 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpeg"],
  ["image/jpg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

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

function hasCloudinaryConfiguration() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function startsWithBytes(buffer, signature) {
  if (buffer.length < signature.length) {
    return false;
  }

  return signature.every(
    (byte, index) => buffer[index] === byte
  );
}

function readAscii(buffer, start, end) {
  return buffer
    .subarray(start, Math.min(end, buffer.length))
    .toString("ascii")
    .toLowerCase();
}

function detectImageFormat(buffer) {
  if (
    startsWithBytes(buffer, [
      0xff,
      0xd8,
      0xff,
    ])
  ) {
    return "jpeg";
  }

  if (
    startsWithBytes(buffer, [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ])
  ) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    readAscii(buffer, 0, 4) === "riff" &&
    readAscii(buffer, 8, 12) === "webp"
  ) {
    return "webp";
  }

  if (
    buffer.length >= 16 &&
    readAscii(buffer, 4, 8) === "ftyp"
  ) {
    const avifHeader = readAscii(
      buffer,
      8,
      48
    );

    if (
      avifHeader.includes("avif") ||
      avifHeader.includes("avis")
    ) {
      return "avif";
    }
  }

  return "";
}

function normalizeMimeType(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isUploadFile(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.arrayBuffer === "function" &&
      typeof value.size === "number"
  );
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: "obsidian-media",
          resource_type: "image",
          type: "upload",
          allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "avif",
          ],
          unique_filename: true,
          overwrite: false,
          use_filename: false,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
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

    if (!hasCloudinaryConfiguration()) {
      console.error(
        "Cloudinary upload configuration is incomplete."
      );

      return createErrorResponse(
        "Image storage is not configured.",
        500
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") || 0
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength >
        MAX_REQUEST_SIZE_BYTES
    ) {
      return createErrorResponse(
        "The upload request is too large. Maximum image size is 10 MB.",
        413
      );
    }

    let formData;

    try {
      formData = await request.formData();
    } catch {
      return createErrorResponse(
        "Invalid upload request.",
        400
      );
    }

    const file = formData.get("file");

    if (!isUploadFile(file)) {
      return createErrorResponse(
        "No valid image file was uploaded.",
        400
      );
    }

    if (file.size <= 0) {
      return createErrorResponse(
        "The selected image is empty.",
        400
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return createErrorResponse(
        "Image size must not exceed 10 MB.",
        413
      );
    }

    const declaredMimeType =
      normalizeMimeType(file.type);

    const expectedFormat =
      ALLOWED_IMAGE_TYPES.get(
        declaredMimeType
      );

    if (!expectedFormat) {
      return createErrorResponse(
        "Only JPEG, PNG, WebP, and AVIF images are allowed.",
        415
      );
    }

    let buffer;

    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch {
      return createErrorResponse(
        "The image could not be read.",
        400
      );
    }

    if (
      buffer.length <= 0 ||
      buffer.length !== file.size
    ) {
      return createErrorResponse(
        "The uploaded image is incomplete or corrupted.",
        400
      );
    }

    const detectedFormat =
      detectImageFormat(buffer);

    if (!detectedFormat) {
      return createErrorResponse(
        "The uploaded file is not a supported image.",
        415
      );
    }

    if (detectedFormat !== expectedFormat) {
      return createErrorResponse(
        "The file content does not match its image type.",
        415
      );
    }

    const result =
      await uploadToCloudinary(buffer);

    if (
      !result ||
      typeof result.secure_url !== "string" ||
      typeof result.public_id !== "string"
    ) {
      throw new Error(
        "Cloudinary returned an invalid upload response."
      );
    }

    return Response.json(
      {
        success: true,
        message:
          "Image uploaded successfully.",
        imageUrl: result.secure_url,
        publicId: result.public_id,
        width: Number(result.width) || null,
        height: Number(result.height) || null,
        format: result.format || detectedFormat,
        bytes: Number(result.bytes) || file.size,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary upload error:",
      error
    );

    return createErrorResponse(
      "Image upload failed.",
      500
    );
  }
}