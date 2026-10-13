"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  initMetaPixel,
  isMetaPixelAllowedPath,
  isMetaPixelEnabled,
  trackMetaPageView,
} from "../../lib/metaPixel";

/*
 * Loads the Meta Pixel once for the storefront and sends one
 * PageView per route. Admin pages never load the pixel.
 *
 * Keyed on pathname only: query-string changes (shop filters) and
 * on-page effects such as the homepage intro replay do not create
 * extra PageViews.
 */
export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !isMetaPixelEnabled() ||
      !isMetaPixelAllowedPath(pathname)
    ) {
      return;
    }

    if (initMetaPixel()) {
      trackMetaPageView(pathname);
    }
  }, [pathname]);

  return null;
}
