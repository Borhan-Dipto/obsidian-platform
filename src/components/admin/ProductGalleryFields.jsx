"use client";

import ImageUploader from "./ImageUploader";
import { MAX_GALLERY_IMAGES } from "../../lib/productImages";

/*
 * Extra product photos shown in the product page gallery after the
 * main image. Suggested order: back, print close-up, fabric close-up,
 * on-model front, on-model back. Best size: 1600×2000 px (4:5).
 *
 * Props:
 *   gallery    – string[]  current gallery URLs
 *   mainImage  – string    current main/cover image URL
 *   onChange   – (gallery: string[]) => void  called when gallery changes
 *   onMainImageChange – (url: string) => void  called when main image changes
 *   disabled   – boolean
 */
export default function ProductGalleryFields({
  gallery = [],
  mainImage = "",
  onChange,
  onMainImageChange,
  disabled = false,
}) {
  const images = Array.isArray(gallery) ? gallery.filter(Boolean) : [];
  const remaining = MAX_GALLERY_IMAGES - images.length;
  const canAddMore = remaining > 0;

  function updateAt(index, url) {
    const next = [...images];

    if (url) {
      next[index] = url;
    } else {
      next.splice(index, 1);
    }

    onChange(next);
  }

  // Add one or more URLs from multi-upload
  function addImages(urlOrUrls) {
    if (!urlOrUrls) return;
    const incoming = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    const toAdd = incoming.filter(Boolean).slice(0, remaining);
    if (toAdd.length === 0) return;
    onChange([...images, ...toAdd]);
  }

  function move(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= images.length) {
      return;
    }

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  // Swap a gallery image into the main image slot
  function promoteToMain(index) {
    if (!onMainImageChange) return;
    const galleryUrl = images[index];
    const next = [...images];

    if (mainImage) {
      // Put the current main image into the gallery slot
      next[index] = mainImage;
    } else {
      next.splice(index, 1);
    }

    onMainImageChange(galleryUrl);
    onChange(next);
  }

  const canPromote = typeof onMainImageChange === "function";

  return (
    <fieldset className="space-y-5 border border-white/10 p-5">
      <legend className="px-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
        More photos (optional — up to {MAX_GALLERY_IMAGES})
      </legend>

      <p className="text-xs leading-6 text-neutral-500">
        Shown after the main image. Suggested: back, print close-up,
        fabric close-up, on-model. Best size 1600×2000 px (portrait 4:5),
        one view per photo.
      </p>

      {images.map((url, index) => (
        <div key={url} className="space-y-3 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              Photo {index + 2}
            </p>

            <div className="flex flex-wrap gap-2">
              {canPromote ? (
                <button
                  type="button"
                  onClick={() => promoteToMain(index)}
                  disabled={disabled}
                  title="Move this photo to the main image slot (Photo 1)"
                  className="border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] disabled:opacity-30 hover:border-[#f1ece4]/40"
                >
                  ★ Make Main
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={disabled || index === 0}
                className="border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] disabled:opacity-30"
              >
                ↑ Up
              </button>

              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={disabled || index === images.length - 1}
                className="border border-white/15 px-3 py-2 text-[10px] uppercase tracking-[0.2em] disabled:opacity-30"
              >
                ↓ Down
              </button>
            </div>
          </div>

          <ImageUploader
            value={url}
            label={`Photo ${index + 2}`}
            disabled={disabled}
            onChange={(nextUrl) => updateAt(index, nextUrl)}
          />
        </div>
      ))}

      {canAddMore ? (
        <div className="border-t border-white/10 pt-5">
          <ImageUploader
            key={`new-${images.length}`}
            value=""
            label={`Add photo${remaining > 1 ? "s" : ""}`}
            helperText={`JPEG, PNG, WebP or AVIF — up to ${remaining} photo${remaining > 1 ? "s" : ""} at once, max 10 MB each.`}
            multiple={remaining > 1}
            maxFiles={remaining}
            disabled={disabled}
            onChange={addImages}
          />
        </div>
      ) : null}
    </fieldset>
  );
}
