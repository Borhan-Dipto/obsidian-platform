import {
  PRODUCTS_COLLECTION_NAME,
  getCatalogDatabase,
  getPublicProductQuery,
} from "../../../lib/catalog";
import { buildMetaFeedCsv } from "../../../lib/metaCatalogFeed";

/*
 * Public product feed for Meta Commerce Manager:
 *   https://obsidianwearbd.store/feeds/meta-catalog.csv
 *
 * Contains only public storefront data (the same as the product
 * pages). Commerce Manager fetches it on a schedule.
 */

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  "https://obsidianwearbd.store";

export async function GET() {
  try {
    const db = await getCatalogDatabase();

    const products = await db
      .collection(PRODUCTS_COLLECTION_NAME)
      .find(getPublicProductQuery(), {
        projection: {
          _id: 0,
          id: 1,
          name: 1,
          description: 1,
          price: 1,
          stock: 1,
          sizes: 1,
          sizeStock: 1,
          image: 1,
          color: 1,
          series: 1,
        },
      })
      .sort({ createdAt: -1 })
      .limit(5000)
      .toArray();

    return new Response(buildMetaFeedCsv(products, SITE_URL), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control":
          "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("Meta catalog feed error:", error);

    return new Response("Feed temporarily unavailable.\n", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
