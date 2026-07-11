import type { MetadataRoute } from "next";
import clientPromise from "../lib/mongodb";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

type ProductSitemapRecord = {
  id?: string;
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
  ];

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const products = await db
      .collection("products")
      .find<ProductSitemapRecord>(
        {
          id: {
            $type: "string",
            $ne: "",
          },
        },
        {
          projection: {
            _id: 0,
            id: 1,
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

    for (const product of products) {
      const productId =
        typeof product.id === "string" ? product.id.trim() : "";

      if (!productId) {
        continue;
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

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return staticRoutes;
  }
}