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
  persistMetaIdentifiers,
  trackMetaPageView,
} from "../../lib/metaPixel";
import {
  initGa4,
  isGa4AllowedPath,
  isGa4Enabled,
  trackGa4PageView,
} from "../../lib/googleAnalytics";
import { isLabMode } from "../../lib/labMode";

/*
 * Storefront analytics loader (Meta Pixel + GA4).
 *
 * Sends one page view per page address (path + query), so links
 * such as /shop?series=... from the collections page count as page
 * views, just like a normal full page load would. Admin pages never
 * load any tracking.
 *
 * On-page effects such as the homepage intro replay do not change
 * the address and therefore never create extra page views.
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";

  useEffect(() => {
    if (
      isMetaPixelEnabled() &&
      isMetaPixelAllowedPath(pathname)
    ) {
      persistMetaIdentifiers(search);

      if (initMetaPixel()) {
        trackMetaPageView(pathname, search);
      }
    }

    if (isGa4Enabled() && isGa4AllowedPath(pathname)) {
      if (initGa4()) {
        trackGa4PageView(pathname, search);
      }
    }
  }, [pathname, search]);

  return null;
}

/*
 * useSearchParams needs a Suspense boundary so the rest of each
 * page can still be prerendered.
 */
export default function MetaPixel() {
  /* Test copy: never send analytics. */
  if (isLabMode()) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
