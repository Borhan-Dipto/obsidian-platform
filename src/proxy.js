import { NextResponse } from "next/server";

import {
  createCollectionPath,
  isSeriesOnlyQuery,
} from "./lib/collectionUrls.js";

/*
 * Permanent (308) redirects for collection URLs, answered before the
 * page renders so search engines get a real redirect status:
 * - /shop?series=Artifact%20Series  -> /collections/artifact-series
 * - /collections/Artifact-Series    -> /collections/artifact-series
 * Filtered shop URLs (series + colour, search, sort...) are untouched.
 */
export function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/shop") {
    const params = Object.fromEntries(searchParams.entries());

    if (isSeriesOnlyQuery(params)) {
      const target = createCollectionPath(params.series);

      if (target !== "/shop") {
        return NextResponse.redirect(new URL(target, request.url), 308);
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/collections/")) {
    const slug = pathname.slice("/collections/".length);

    if (slug && slug !== slug.toLowerCase()) {
      const url = request.nextUrl.clone();
      url.pathname = `/collections/${slug.toLowerCase()}`;

      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/shop", "/collections/:slug"],
};
