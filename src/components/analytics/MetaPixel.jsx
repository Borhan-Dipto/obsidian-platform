"use client";

import { Suspense, useEffect } from "react";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";
import {
  initMetaPixel,
  isMetaPixelAllowedPath,
  isMetaPixelEnabled,
  trackMetaPageView,
} from "../../lib/metaPixel";

/*
 * Loads the Meta Pixel once for the storefront and sends one
 * PageView per page address (path + query), so links such as
 * /shop?series=... from the collections page count as page views,
 * just like a normal full page load would. Admin pages never load
 * the pixel.
 *
 * On-page effects such as the homepage intro replay do not change
 * the address and therefore never create extra PageViews.
 */
function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";

  useEffect(() => {
    if (
      !isMetaPixelEnabled() ||
      !isMetaPixelAllowedPath(pathname)
    ) {
      return;
    }

    if (initMetaPixel()) {
      trackMetaPageView(pathname, search);
    }
  }, [pathname, search]);

  return null;
}

/*
 * useSearchParams needs a Suspense boundary so the rest of each
 * page can still be prerendered.
 */
export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelTracker />
    </Suspense>
  );
}
