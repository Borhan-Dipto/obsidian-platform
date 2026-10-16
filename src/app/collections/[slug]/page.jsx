import {
  notFound,
  permanentRedirect,
} from "next/navigation";

import {
  buildShopMetadata,
  getPublicSeriesNames,
  renderShopPage,
} from "../../../components/shop/ShopPageView";
import {
  createCollectionSlug,
  findSeriesBySlug,
} from "../../../lib/collectionUrls.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveSeries(slug) {
  return findSeriesBySlug(await getPublicSeriesNames(), slug);
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const series = await resolveSeries(slug);

  if (!series) {
    return {
      title: "Collection Not Found",
      robots: { index: false, follow: true },
    };
  }

  return buildShopMetadata({ ...(await searchParams), series });
}

export default async function CollectionPage({ params, searchParams }) {
  const { slug } = await params;
  const series = await resolveSeries(slug);

  if (!series) {
    notFound();
  }

  /* One URL per collection: fix upper-case or untidy slugs. */
  const canonicalSlug = createCollectionSlug(series);

  if (slug !== canonicalSlug) {
    permanentRedirect(`/collections/${canonicalSlug}`);
  }

  return renderShopPage(
    { ...(await searchParams), series },
    { collection: { series, slug: canonicalSlug } }
  );
}
