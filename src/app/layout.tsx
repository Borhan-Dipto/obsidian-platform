import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Urbanist,
} from "next/font/google";
import AppProviders from "../providers/AppProviders";
import MetaPixel from "../components/analytics/MetaPixel";
import {
  DEFAULT_SETTINGS,
  getSettings,
} from "../lib/settings";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const FALLBACK_SITE_URL =
  "https://obsidianwearbd.store";

function getSiteUrl() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
      .replace(/\/+$/, "");

  if (!configuredSiteUrl) {
    return FALLBACK_SITE_URL;
  }

  try {
    return new URL(configuredSiteUrl).toString()
      .replace(/\/+$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function normalizeText(
  value: unknown,
  fallback: string
) {
  const normalizedValue = String(
    value ?? ""
  ).trim();

  return normalizedValue || fallback;
}

function normalizeKeywords(
  value: unknown
): string[] {
  const keywords = Array.isArray(value)
    ? value
    : String(value ?? "").split(",");

  return keywords
    .map((keyword) =>
      String(keyword ?? "").trim()
    )
    .filter(Boolean);
}

/*
 * Meta Business domain verification (meta-tag method). Set
 * META_DOMAIN_VERIFICATION in Vercel to the code Meta shows under
 * Business Settings -> Brand safety -> Domains.
 */
function getDomainVerificationTags(): Record<string, string> {
  const code = String(
    process.env.META_DOMAIN_VERIFICATION || ""
  ).trim();

  return /^[a-z0-9]{10,64}$/i.test(code)
    ? { "facebook-domain-verification": code }
    : {};
}

/*
 * Google Search Console (HTML tag method). Set
 * GOOGLE_SITE_VERIFICATION in Vercel to the content value Google
 * shows when adding a URL-prefix property.
 */
function getSearchConsoleVerification(): Pick<Metadata, "verification"> {
  const code = String(
    process.env.GOOGLE_SITE_VERIFICATION || ""
  ).trim();

  return /^[A-Za-z0-9_-]{20,100}$/.test(code)
    ? { verification: { google: code } }
    : {};
}

async function getMetadataSettings() {
  try {
    return await getSettings();
  } catch (error) {
    console.error(
      "Global metadata settings error:",
      error
    );

    return DEFAULT_SETTINGS;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMetadataSettings();

  const siteUrl = getSiteUrl();

  const siteName = normalizeText(
    settings.store?.name,
    DEFAULT_SETTINGS.store.name
  );

  const siteTagline = normalizeText(
    settings.store?.tagline,
    DEFAULT_SETTINGS.store.tagline
  );

  const seoTitle = normalizeText(
    settings.seo?.title,
    DEFAULT_SETTINGS.seo.title
  );

  const seoDescription = normalizeText(
    settings.seo?.description,
    DEFAULT_SETTINGS.seo.description
  );

  const seoImage = normalizeText(
    settings.seo?.ogImage,
    DEFAULT_SETTINGS.seo.ogImage
  );

  const keywords = normalizeKeywords(
    settings.seo?.keywords
  );

  const fallbackKeywords = normalizeKeywords(
    DEFAULT_SETTINGS.seo.keywords
  );

  const metadataKeywords =
    keywords.length > 0
      ? keywords
      : fallbackKeywords;

  return {
    metadataBase: new URL(siteUrl),

    title: {
      default: seoTitle,
      template: `%s | ${siteName}`,
    },

    description: seoDescription,

    applicationName: siteName,

    keywords: metadataKeywords,

    authors: [
      {
        name: siteName,
        url: siteUrl,
      },
    ],

    creator: siteName,
    publisher: siteName,

    category: "fashion",

    referrer: "origin-when-cross-origin",

    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
    },

    openGraph: {
      type: "website",
      locale: "en_BD",
      url: "/",
      siteName,
      title: seoTitle,
      description: seoDescription,

      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: `${siteName} social sharing image`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
    },

    robots: {
      index: true,
      follow: true,
      nocache: false,

      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    other: {
      "theme-color": "#f1ece4",
      "color-scheme": "light",
      "brand-tagline": siteTagline,

      ...getDomainVerificationTags(),
    },

    ...getSearchConsoleVerification(),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#f1ece4",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0b0b0b",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-BD"
      className={`${urbanist.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-[#f1ece4] text-[#0b0b0b] antialiased">
        <AppProviders>
          {children}
        </AppProviders>

        <MetaPixel />
      </body>
    </html>
  );
}