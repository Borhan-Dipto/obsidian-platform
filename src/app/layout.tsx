import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Urbanist } from "next/font/google";
import AppProviders from "../providers/AppProviders";
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

const siteName = "OBSIDIAN";
const siteDescription =
  "Premium menswear and engineered essentials built under pressure and finished with precision.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://obsidianwearbd.store";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "OBSIDIAN | Premium Menswear Bangladesh",
    template: "%s | OBSIDIAN",
  },

  description: siteDescription,

  applicationName: siteName,

  keywords: [
    "OBSIDIAN",
    "OBSIDIAN Bangladesh",
    "premium menswear Bangladesh",
    "premium t-shirt Bangladesh",
    "oversized t-shirt Bangladesh",
    "mens fashion Bangladesh",
    "streetwear Bangladesh",
    "minimal fashion Bangladesh",
    "premium clothing Dhaka",
    "Obsidian Wear BD",
  ],

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

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/",
    siteName,
    title: "OBSIDIAN | Premium Menswear Bangladesh",
    description: siteDescription,
    images: [
      {
        url: "/images/hero1.jpeg",
        width: 1200,
        height: 630,
        alt: "OBSIDIAN premium menswear collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "OBSIDIAN | Premium Menswear Bangladesh",
    description: siteDescription,
    images: ["/images/hero1.jpeg"],
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
  },
};

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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}