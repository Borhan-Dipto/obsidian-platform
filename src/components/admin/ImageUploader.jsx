/* eslint-disable @next/next/no-img-element -- Local blob previews need their original browser-managed dimensions. */
"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const DEFAULT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";

function formatFileSize(bytes) {
  const size = Number(
    bytes || 0
  );

  if (size < 1024) {
    return `${size} B`;
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

async function readJsonResponse(
  response
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function ImageUploader({
  value = "",
  onChange,
  label = "Product Image",
  helperText =
    "JPEG, PNG, WebP or AVIF. Maximum file size: 10 MB.",
  previewAlt =
    "Uploaded image preview",
  previewClassName =
    "max-h-80 w-full object-contain",
  required = false,
  disabled = false,
  maxSizeMB = 10,
  acceptedTypes =
    DEFAULT_ACCEPTED_TYPES,
  accept = DEFAULT_ACCEPT,
  allowRemove = true,
  multiple = false,
  maxFiles = 5,
  onUploadingChange,
  onError,
}) {
  const generatedId =
    useId();

  const inputId =
    `image-upload-${generatedId.replace(
      /:/g,
      ""
    )}`;

  const fileInputRef =
    useRef(null);

  const objectUrlRef =
    useRef("");

  const abortControllerRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState(value || "");

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      if (
        abortControllerRef.current
      ) {
        abortControllerRef.current.abort();
      }

      if (
        objectUrlRef.current
      ) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );

        objectUrlRef.current =
          "";
      }
    };
  }, []);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        () => {
          if (
            objectUrlRef.current
          ) {
            URL.revokeObjectURL(
              objectUrlRef.current
            );

            objectUrlRef.current =
              "";
          }

          setPreviewUrl(
            value || ""
          );
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, [value]);

  function updateUploadingState(
    nextState
  ) {
    if (
      mountedRef.current
    ) {
      setIsUploading(
        nextState
      );
    }

    if (
      typeof onUploadingChange ===
      "function"
    ) {
      onUploadingChange(
        nextState
      );
    }
  }

  function reportError(
    message
  ) {
    const errorMessage =
      String(
        message || ""
      ).trim() ||
      "Image upload failed.";

    if (
      mountedRef.current
    ) {
      setStatus({
        type: "error",
        message:
          errorMessage,
      });
    }

    if (
      typeof onError ===
      "function"
    ) {
      onError(
        errorMessage
      );
    }
  }

  function clearTemporaryPreview() {
    if (
      objectUrlRef.current
    ) {
      URL.revokeObjectURL(
        objectUrlRef.current
      );

      objectUrlRef.current =
        "";
    }
  }

  function validateFile(
    file
  ) {
    if (!file) {
      return "Please select an image.";
    }

    if (
      !acceptedTypes.includes(
        file.type
      )
    ) {
      return "Unsupported image format. Use JPEG, PNG, WebP or AVIF.";
    }

    const maximumBytes =
      Number(
        maxSizeMB
      ) *
      1024 *
      1024;

    if (
      !Number.isFinite(
        maximumBytes
      ) ||
      maximumBytes <= 0
    ) {
      return "Invalid upload size configuration.";
    }

    if (
      file.size >
      maximumBytes
    ) {
      return `The selected image is ${formatFileSize(
        file.size
      )}. Maximum allowed size is ${maxSizeMB} MB.`;
    }

    return "";
  }

  async function uploadImage(
    file
  ) {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    const validationError =
      validateFile(file);

    if (
      validationError
    ) {
      reportError(
        validationError
      );

      return;
    }

    if (
      abortControllerRef.current
    ) {
      abortControllerRef.current.abort();
    }

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    clearTemporaryPreview();

    const localPreviewUrl =
      URL.createObjectURL(
        file
      );

    objectUrlRef.current =
      localPreviewUrl;

    setPreviewUrl(
      localPreviewUrl
    );

    setStatus({
      type: "info",

      message:
        `Uploading ${file.name}...`,
    });

    updateUploadingState(
      true
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            body: formData,

            signal:
              controller.signal,
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !data?.success ||
        !data?.imageUrl
      ) {
        if (
          response.status ===
          401
        ) {
          throw new Error(
            "Your admin session has expired. Sign in again and retry."
          );
        }

        if (
          response.status ===
          413
        ) {
          throw new Error(
            `The image is too large. Maximum allowed size is ${maxSizeMB} MB.`
          );
        }

        throw new Error(
          data?.message ||
            "Image upload failed."
        );
      }

      clearTemporaryPreview();

      if (
        !mountedRef.current
      ) {
        return;
      }

      setPreviewUrl(
        data.imageUrl
      );

      if (
        typeof onChange ===
        "function"
      ) {
        onChange(
          data.imageUrl
        );
      }

      setStatus({
        type: "success",

        message:
          "Image uploaded successfully.",
      });

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return;
      }

      clearTemporaryPreview();

      if (
        mountedRef.current
      ) {
        setPreviewUrl(
          value || ""
        );
      }

      reportError(
        error?.message ||
          "Something went wrong while uploading the image."
      );
    } finally {
      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current =
          null;

        updateUploadingState(
          false
        );
      }
    }
  }

  async function uploadMultipleImages(files) {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files).slice(0, maxFiles);

    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) { reportError(`${file.name}: ${err}`); return; }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ type: "info", message: `Uploading ${fileArray.length} image${fileArray.length > 1 ? "s" : ""}...` });
    updateUploadingState(true);

    try {
      const formData = new FormData();
      for (const file of fileArray) {
        formData.append("file", file);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {
        if (response.status === 401) throw new Error("Your admin session has expired. Sign in again and retry.");
        if (response.status === 413) throw new Error(`An image is too large. Maximum allowed size is ${maxSizeMB} MB.`);
        throw new Error(data?.message || "Image upload failed.");
      }

      if (!mountedRef.current) return;

      // multi-file response has data.images array; single-file has data.imageUrl
      const urls = data.images
        ? data.images.map((img) => img.imageUrl).filter(Boolean)
        : data.imageUrl
          ? [data.imageUrl]
          : [];

      if (typeof onChange === "function") {
        onChange(urls);
      }

      setStatus({ type: "success", message: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded successfully.` });

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      if (error?.name === "AbortError") return;
      reportError(error?.message || "Something went wrong while uploading.");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        updateUploadingState(false);
      }
    }
  }

  function handleFileChange(
    event
  ) {
    if (multiple) {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      void uploadMultipleImages(files);
      return;
    }

    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    void uploadImage(
      file
    );
  }

  function handleDragEnter(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !disabled &&
      !isUploading
    ) {
      setIsDragging(
        true
      );
    }
  }

  function handleDragOver(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !disabled &&
      !isUploading
    ) {
      event.dataTransfer.dropEffect =
        "copy";

      setIsDragging(
        true
      );
    }
  }

  function handleDragLeave(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !event.currentTarget.contains(
        event.relatedTarget
      )
    ) {
      setIsDragging(
        false
      );
    }
  }

  function handleDrop(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(
      false
    );

    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    if (multiple) {
      const files = event.dataTransfer.files;
      if (files && files.length > 0) void uploadMultipleImages(files);
      return;
    }

    const file =
      event.dataTransfer
        .files?.[0];

    if (file) {
      void uploadImage(
        file
      );
    }
  }

  function openFilePicker() {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    fileInputRef.current?.click();
  }

  function removeImage() {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    clearTemporaryPreview();

    setPreviewUrl("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }

    if (
      typeof onChange ===
      "function"
    ) {
      onChange("");
    }

    setStatus({
      type: "success",
      message:
        "Image removed.",
    });
  }

  const isUnavailable =
    disabled ||
    isUploading;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-[0.25em] text-neutral-500"
        >
          {label}

          {required ? (
            <span
              className="ml-1 text-red-400"
              aria-hidden="true"
            >
              *
            </span>
          ) : null}
        </label>

        {helperText ? (
          <p className="mt-2 text-xs leading-6 text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="relative overflow-hidden border border-white/10 bg-black">
          <div className="flex min-h-64 items-center justify-center bg-white/[0.025] p-4">
            <img
              src={previewUrl}
              alt={previewAlt}
              className={
                previewClassName
              }
            />
          </div>

          {allowRemove ? (
            <button
              type="button"
              onClick={
                removeImage
              }
              disabled={
                isUnavailable
              }
              className="absolute right-3 top-3 border border-white/20 bg-black/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur transition hover:border-red-400 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        onDragEnter={
          handleDragEnter
        }
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={
          handleDrop
        }
        className={`border border-dashed p-6 text-center transition sm:p-8 ${
          isDragging
            ? "border-[#f1ece4] bg-white/10"
            : "border-white/15 bg-white/[0.025]"
        } ${
          isUnavailable
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-white/35 hover:bg-white/[0.045]"
        }`}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={
            handleFileChange
          }
          disabled={
            isUnavailable
          }
          className="sr-only"
        />

        <button
          type="button"
          onClick={
            openFilePicker
          }
          disabled={
            isUnavailable
          }
          className="w-full disabled:cursor-not-allowed"
        >
          <span className="block text-sm text-[#f1ece4]">
            {isUploading
              ? multiple ? "Uploading images..." : "Uploading image..."
              : isDragging
                ? multiple ? "Drop images here" : "Drop the image here"
                : multiple ? `Choose up to ${maxFiles} images or drag them here` : "Choose an image or drag it here"}
          </span>

          <span className="mt-2 block text-xs leading-6 text-neutral-500">
            {helperText}
          </span>
        </button>
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="min-h-5"
      >
        {status.message ? (
          <p
            className={`text-xs leading-5 ${
              status.type ===
              "error"
                ? "text-red-300"
                : status.type ===
                    "success"
                  ? "text-emerald-300"
                  : "text-yellow-300"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}