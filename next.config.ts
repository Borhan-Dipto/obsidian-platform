import type {
  NextConfig,
} from "next";

const isDevelopment =
  process.env.NODE_ENV !==
  "production";

function normalizeRemoteImageHosts(
  value: string | undefined
) {
  const hosts = String(
    value || ""
  )
    .split(",")
    .map((host) =>
      host
        .trim()
        .toLowerCase()
    )
    .filter(
      (host) =>
        Boolean(host) &&
        /^[a-z0-9.-]+$/.test(
          host
        ) &&
        !host.includes("..") &&
        !host.startsWith(".") &&
        !host.endsWith(".")
    );

  return Array.from(
    new Set(hosts)
  );
}

const approvedRemoteImageHosts =
  Array.from(
    new Set([
      "res.cloudinary.com",

      ...normalizeRemoteImageHosts(
        process.env
          .NEXT_IMAGE_REMOTE_HOSTS
      ),
    ])
  );

const imageSources =
  approvedRemoteImageHosts
    .map(
      (hostname) =>
        `https://${hostname}`
    )
    .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",

  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "https://connect.facebook.net",
    "https://www.googletagmanager.com",

    ...(isDevelopment
      ? ["'unsafe-eval'"]
      : []),
  ].join(" "),

  "style-src 'self' 'unsafe-inline'",

  [
    "img-src",
    "'self'",
    "data:",
    "blob:",
    "https://www.facebook.com",
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    imageSources,
  ]
    .filter(Boolean)
    .join(" "),

  "font-src 'self' data:",

  [
    "connect-src",
    "'self'",
    "https://www.facebook.com",
    "https://connect.facebook.net",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",

    ...(isDevelopment
      ? [
          "ws:",
          "http:",
          "https:",
        ]
      : []),
  ].join(" "),

  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",

  ...(isDevelopment
    ? []
    : [
        "upgrade-insecure-requests",
      ]),
]
  .join("; ")
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key:
      "Content-Security-Policy",

    value:
      contentSecurityPolicy,
  },

  {
    key:
      "X-Content-Type-Options",

    value:
      "nosniff",
  },

  {
    key:
      "X-Frame-Options",

    value:
      "DENY",
  },

  {
    key:
      "Referrer-Policy",

    value:
      "strict-origin-when-cross-origin",
  },

  {
    key:
      "Permissions-Policy",

    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "browsing-topics=()",
    ].join(", "),
  },

  {
    key:
      "X-DNS-Prefetch-Control",

    value:
      "off",
  },

  ...(isDevelopment
    ? []
    : [
        {
          key:
            "Strict-Transport-Security",

          value:
            "max-age=31536000",
        },
      ]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    formats: [
      "image/avif",
      "image/webp",
    ],

    remotePatterns:
      approvedRemoteImageHosts.map(
        (hostname) => ({
          protocol:
            "https" as const,

          hostname,
          pathname: "/**",
        })
      ),
  },

  async headers() {
    return [
      {
        source:
          "/:path*",

        headers:
          securityHeaders,
      },
    ];
  },
};

export default nextConfig;
