import type { MetadataRoute } from "next";

import {
  PRODUCTS_COLLECTION_NAME,
  getPublicProductQuery,
} from "../lib/catalog";

import clientPromise from "../lib/mongodb";
import { createCollectionPath } from "../lib/collectionUrls.js";

/* Rebuild at most hourly so new products and collections appear without a redeploy. */
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

type ProductSitemapRecord = {
  id?: string;
  series?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function getValidDate(
  value: Date | string | undefined,
  fallback: Date
): Date {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return parsedDate;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/journal`,
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/size-guide`,
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-of-sale`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/delivery-policy`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/exchange-return-policy`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: generatedAt,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const products = await db
      .collection<ProductSitemapRecord>(
        PRODUCTS_COLLECTION_NAME
      )
      .find(
        getPublicProductQuery({
          id: {
            $type: "string",
            $ne: "",
          },
        }),
        {
          projection: {
            _id: 0,
            id: 1,
            series: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      )
      .sort({
        updatedAt: -1,
        createdAt: -1,
      })
      .toArray();

    const productRoutes: MetadataRoute.Sitemap = [];

    /*
     * Collection pages (/collections/<slug>) are indexable landing
     * pages with self-referencing canonicals, so list each series
     * that has at least one public product (one URL per slug).
     */
    const collectionLastModified = new Map<string, Date>();

    for (const product of products) {
      const productId =
        typeof product.id === "string" ? product.id.trim() : "";

      if (!productId) {
        continue;
      }

      const series =
        typeof product.series === "string"
          ? product.series.replace(/\s+/g, " ").trim()
          : "";

      if (series) {
        const modified = getValidDate(
          product.updatedAt || product.createdAt,
          generatedAt
        );
        const previous = collectionLastModified.get(series);

        if (!previous || modified > previous) {
          collectionLastModified.set(series, modified);
        }
      }

      productRoutes.push({
        url: `${SITE_URL}/product/${encodeURIComponent(productId)}`,
        lastModified: getValidDate(
          product.updatedAt || product.createdAt,
          generatedAt
        ),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    const collectionRoutes: MetadataRoute.Sitemap = Array.from(
      collectionLastModified.entries()
    ).reduce<MetadataRoute.Sitemap>((routes, [series, lastModified]) => {
      const url = `${SITE_URL}${createCollectionPath(series)}`;

      if (!routes.some((route) => route.url === url)) {
        routes.push({
          url,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      return routes;
    }, []);

    return [
      ...staticRoutes,
      ...collectionRoutes,
      ...productRoutes,
    ];
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return staticRoutes;
  }
}