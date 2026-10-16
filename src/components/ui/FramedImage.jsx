import Image from "next/image";

/*
 * Shows a whole photo inside a fixed frame (e.g. 4:5) without
 * cropping it. When the photo's shape differs from the frame (for
 * example a landscape front + back photo in a portrait card), the
 * leftover space is filled with a soft, blurred copy of the same
 * photo instead of empty bars. Both layers use the same URL and
 * `sizes`, so the browser downloads the file only once.
 *
 * Must be placed inside a `relative` element with a fixed size or
 * aspect ratio.
 */
export default function FramedImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imageClassName = "",
  style,
  onError,
}) {
  if (!src) {
    return null;
  }

  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        priority={priority}
        className={`pointer-events-none scale-110 object-cover object-center opacity-70 blur-2xl ${className}`}
      />

      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={onError}
        style={style}
        className={`object-contain object-center ${imageClassName}`}
      />
    </>
  );
}
