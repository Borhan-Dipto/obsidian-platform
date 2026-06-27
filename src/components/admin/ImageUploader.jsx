"use client";

import { useState } from "react";

export default function ImageUploader({ value, onChange }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) {
      alert("Please choose an image first.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert("Image upload failed.");
        setIsUploading(false);
        return;
      }

      onChange(data.imageUrl);
      setPreviewUrl(data.imageUrl);
      alert("Image uploaded successfully.");
    } catch (error) {
      alert("Something went wrong while uploading image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-xs uppercase tracking-[0.25em] text-neutral-500">
        Product Image
      </label>

      {previewUrl && (
        <div className="overflow-hidden border border-white/10 bg-white/5 p-4">
          <img
            src={previewUrl}
            alt="Product preview"
            className="max-h-80 w-full object-contain"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full border border-white/10 bg-white/5 px-5 py-4 text-sm outline-none file:mr-4 file:border-0 file:bg-[#f1ece4] file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-[#0b0b0b]"
      />

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
        className="w-full border border-white/20 px-6 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? "Uploading Image..." : "Upload Image"}
      </button>

      {value && (
        <p className="break-all text-xs leading-6 text-neutral-500">
          Image URL: {value}
        </p>
      )}
    </div>
  );
}