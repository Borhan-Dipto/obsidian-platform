import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  fileURLToPath,
} from "node:url";

const currentDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const projectRoot =
  path.resolve(
    currentDirectory,
    "../.."
  );

function projectPath(
  relativePath
) {
  return path.join(
    projectRoot,
    relativePath
  );
}

function readSource(
  relativePath
) {
  const absolutePath =
    projectPath(
      relativePath
    );

  assert.equal(
    existsSync(
      absolutePath
    ),
    true,
    `Required file is missing: ${relativePath}`
  );

  return readFileSync(
    absolutePath,
    "utf8"
  );
}

function assertContains(
  source,
  pattern,
  message
) {
  assert.match(
    source,
    pattern,
    message
  );
}

function assertNotContains(
  source,
  pattern,
  message
) {
  assert.doesNotMatch(
    source,
    pattern,
    message
  );
}

function countOccurrences(
  source,
  value
) {
  return source
    .split(value)
    .length - 1;
}

function collectSourceFiles(
  relativeDirectory
) {
  const directory =
    projectPath(
      relativeDirectory
    );

  if (
    !existsSync(directory)
  ) {
    return [];
  }

  const results = [];

  for (
    const entry
    of readdirSync(directory)
  ) {
    const absolutePath =
      path.join(
        directory,
        entry
      );

    const relativePath =
      path.relative(
        projectRoot,
        absolutePath
      );

    const metadata =
      statSync(
        absolutePath
      );

    if (
      metadata.isDirectory()
    ) {
      results.push(
        ...collectSourceFiles(
          relativePath
        )
      );

      continue;
    }

    if (
      /\.(?:js|jsx|mjs|ts|tsx)$/.test(
        entry
      )
    ) {
      results.push(
        relativePath
      );
    }
  }

  return results;
}

test(
  "unverified registration cannot automatically claim guest orders",
  () => {
    const source =
      readSource(
        "src/app/api/account/register/route.js"
      );

    assertContains(
      source,
      /emailVerified\s*:\s*false/,

      "New customer registration must remain unverified until ownership verification."
    );

    assertNotContains(
      source,
      /\b(?:link|claim|attach|adopt)GuestOrders\b/i,

      "Registration must not automatically attach historical guest orders."
    );

    assertNotContains(
      source,
      /guest[\s_-]*order[\s\S]{0,240}updateMany\s*\(/i,

      "Registration must not bulk-update guest orders using unverified identity data."
    );
  }
);

test(
  "authenticated account-order access is bound to immutable account identity",
  () => {
    const routePaths = [
      "src/app/api/account/orders/route.js",

      "src/app/api/account/orders/[id]/route.js",
    ];

    for (
      const routePath
      of routePaths
    ) {
      const source =
        readSource(
          routePath
        );

      assertContains(
        source,
        /customerAccountId|customerId/,

        `${routePath} must query using an immutable customer account identifier.`
      );
    }
  }
);

test(
  "public order tracking requires order ID and phone with persistent controls",
  () => {
    const source =
      readSource(
        "src/app/api/orders/track/route.js"
      );

    assert.ok(
      countOccurrences(
        source,
        "orderId"
      ) >= 3,

      "Tracking route must process the order ID as a required verification factor."
    );

    assert.ok(
      countOccurrences(
        source,
        "phone"
      ) >= 3,

      "Tracking route must process the phone number as a required verification factor."
    );

    assertContains(
      source,
      /createPhoneQuery/,

      "Tracking lookup must require the normalized phone query together with the order ID."
    );

    assertContains(
      source,
      /createIndex/,

      "Tracking rate limiting must use a persistent indexed store."
    );

    assertContains(
      source,
      /expireAfterSeconds/,

      "Tracking rate-limit records must use TTL expiry."
    );

    assertNotContains(
      source,
      /\b(?:phoneOnly|listByPhone)\b/i,

      "Phone-only order listing must not be restored."
    );

    const adminOrderRoute =
      readSource(
        "src/app/api/orders/[id]/route.js"
      );

    assertContains(
      adminOrderRoute,
      /requireAdminApiPermission/,

      "Full order-detail access must require Admin Workspace permission."
    );

    assertNotContains(
      adminOrderRoute,
      /consumeTrackingAttempt|trackingAttempts|serializePublicOrder|safeCompare/,

      "The admin order-detail route must not expose a second public tracking fallback."
    );
  }
);

test(
  "checkout preserves transaction and idempotency protections",
  () => {
    const source =
      readSource(
        "src/app/api/orders/route.js"
      );

    const requiredPatterns = [
      [
        /checkoutToken/,

        "Checkout token/idempotency handling is required.",
      ],

      [
        /startTransaction|withTransaction/,

        "Order creation must run in a MongoDB transaction.",
      ],

      [
        /createStockReservationOperation/,

        "Stock reservation must remain inside the protected order flow.",
      ],

      [
        /createCouponUsageOperation/,

        "Coupon usage must remain inside the protected order flow.",
      ],

      [
        /acceptedPolicies/,

        "Checkout legal consent must remain server-enforced.",
      ],

      [
        /checkoutLegalConsent/,

        "Accepted legal-policy evidence must be stored with the order.",
      ],
    ];

    for (
      const [
        pattern,
        message,
      ]
      of requiredPatterns
    ) {
      assertContains(
        source,
        pattern,
        message
      );
    }
  }
);

test(
  "order lifecycle has strict transitions and exactly-once release markers",
  () => {
    const lifecycle =
      readSource(
        "src/lib/orderLifecycle.js"
      );

    const adminRoute =
      readSource(
        "src/app/api/orders/[id]/route.js"
      );

    const requiredLifecyclePatterns = [
      /isAllowedOrderStatusTransition/,
      /releaseCancelledOrderReservations/,
      /inventoryReservationStatus/,
      /inventoryReleasedAt/,
      /couponUsageStatus/,
      /couponUsageReleasedAt/,
    ];

    for (
      const pattern
      of requiredLifecyclePatterns
    ) {
      assertContains(
        lifecycle,
        pattern,

        `Order lifecycle contract is missing ${pattern}.`
      );
    }

    assertContains(
      adminRoute,
      /releaseCancelledOrderReservations/,

      "Admin cancellation route must invoke the transactional release helper."
    );

    assertContains(
      adminRoute,
      /isAllowedOrderStatusTransition/,

      "Admin order updates must enforce the transition matrix."
    );

    assertContains(
      adminRoute,
      /commerceRelease/,

      "Cancellation inventory and coupon release must remain recorded in order activity history."
    );
  }
);

test(
  "notification delivery supports bounded retry and stale lease recovery",
  () => {
    const source =
      readSource(
        "src/lib/orderNotifications.js"
      );

    const requiredPatterns = [
      /attemptCount/,
      /lastAttemptAt/,
      /nextRetryAt/,
      /leaseExpiresAt/,
      /retry_scheduled/,
      /terminal_failed/,
      /processRetryableNotificationDeliveries/,
    ];

    for (
      const pattern
      of requiredPatterns
    ) {
      assertContains(
        source,
        pattern,

        `Notification retry contract is missing ${pattern}.`
      );
    }

    const retryRoute =
      readSource(
        "src/app/api/internal/notifications/retry/route.js"
      );

    assertContains(
      retryRoute,
      /CRON_SECRET/,

      "Notification retry route must require the cron secret."
    );

    assertContains(
      retryRoute,
      /timingSafeEqual/,

      "Cron authorization must use timing-safe comparison."
    );
  }
);

test(
  "inactive products remain excluded from public pages and sitemap",
  () => {
    const productPage =
      readSource(
        "src/app/product/[id]/page.jsx"
      );

    const sitemap =
      readSource(
        "src/app/sitemap.ts"
      );

    assertContains(
      productPage,
      /getPublicProductQuery/,

      "Public product page must use the shared public-product query."
    );

    assertContains(
      productPage,
      /notFound\s*\(/,

      "Non-public products must return route-level 404."
    );

    assertContains(
      sitemap,
      /getPublicProductQuery/,

      "Sitemap must use the shared public-product query."
    );
  }
);

test(
  "admin routes retain permission enforcement and mandatory 2FA controls",
  () => {
    const apiAuthorization =
      readSource(
        "src/lib/adminApiAuthorization.js"
      );

    assertContains(
      apiAuthorization,
      /requireAdminApiPermission/,

      "Admin API permission enforcement helper is missing."
    );

    assertContains(
      apiAuthorization,
      /permission/i,

      "Admin API authorization must evaluate permissions."
    );

    const adminSecurityFiles = [
      ...collectSourceFiles(
        "src/lib"
      ),

      ...collectSourceFiles(
        "src/app/admin"
      ),

      ...collectSourceFiles(
        "src/app/api/admin"
      ),
    ];

    const combinedSource =
      adminSecurityFiles
        .map(
          (relativePath) =>
            readSource(
              relativePath
            )
        )
        .join("\n");

    assertContains(
      combinedSource,
      /twoFactor|two-factor|\b2fa\b/i,

      "Mandatory admin two-factor authentication controls are missing."
    );

    assertContains(
      combinedSource,
      /requireAdmin|requireAdminAuth/,

      "Protected admin workspace authorization is missing."
    );
  }
);

test(
  "public mutation routes use the shared abuse-protection policy",
  () => {
    const routePaths = [
      "src/app/api/account/register/route.js",

      "src/app/api/account/forgot-password/route.js",

      "src/app/api/account/reset-password/route.js",

      "src/app/api/account/profile/route.js",

      "src/app/api/account/change-password/route.js",

      "src/app/api/account/addresses/route.js",

      "src/app/api/account/addresses/[addressId]/route.js",

      "src/app/api/newsletter/route.js",

      "src/app/api/coupons/validate/route.js",

      "src/app/api/orders/route.js",

      "src/app/api/orders/quote/route.js",
    ];

    for (
      const routePath
      of routePaths
    ) {
      const source =
        readSource(
          routePath
        );

      assertContains(
        source,
        /publicApiSecurity/,

        `${routePath} must import the shared public API security policy.`
      );

      assertContains(
        source,
        /enforcePublicJsonRequest|enforcePublicRequestEnvelope/,

        `${routePath} must enforce the shared request policy.`
      );
    }
  }
);

test(
  "legal routes and versioned consent remain connected",
  () => {
    const requiredLegalRoutes = [
      "privacy",
      "terms",
      "terms-of-sale",
      "delivery-policy",
      "exchange-return-policy",
      "refund-policy",
    ];

    for (
      const legalRoute
      of requiredLegalRoutes
    ) {
      assert.equal(
        existsSync(
          projectPath(
            `src/app/${legalRoute}/page.jsx`
          )
        ),
        true,

        `Legal route is missing: /${legalRoute}`
      );
    }

    const consentHelper =
      readSource(
        "src/lib/legalConsent.js"
      );

    assertContains(
      consentHelper,
      /sha256/,

      "Legal consent must retain a SHA-256 digest."
    );

    assertContains(
      consentHelper,
      /bundleDigest/,

      "Legal consent must retain the accepted policy bundle digest."
    );

    for (
      const routePath
      of [
        "src/app/api/account/register/route.js",

        "src/app/api/orders/route.js",

        "src/app/api/newsletter/route.js",
      ]
    ) {
      assertContains(
        readSource(
          routePath
        ),
        /createLegalConsentRecord/,

        `${routePath} must store versioned legal consent.`
      );
    }
  }
);

test(
  "global browser headers and image-host restrictions remain enabled",
  () => {
    const source =
      readSource(
        "next.config.ts"
      );

    const requiredPatterns = [
      /Content-Security-Policy/,
      /Strict-Transport-Security/,
      /X-Content-Type-Options/,
      /Referrer-Policy/,
      /Permissions-Policy/,
      /frame-ancestors 'none'/,
      /res\.cloudinary\.com/,
    ];

    for (
      const pattern
      of requiredPatterns
    ) {
      assertContains(
        source,
        pattern,

        `Platform security configuration is missing ${pattern}.`
      );
    }

    assertNotContains(
      source,
      /hostname\s*:\s*["']\*\*["']/,

      "Remote image hosts must not use a wildcard hostname."
    );
  }
);

test(
  "media upload retains decompression and abuse protections",
  () => {
    const source =
      readSource(
        "src/app/api/upload/route.js"
      );

    const requiredPatterns = [
      /limitInputPixels/,
      /MAX_IMAGE_PIXELS/,
      /MAX_IMAGE_EDGE/,
      /animated:\s*false/,
      /RATE_LIMIT_COLLECTION_NAME/,
      /CLOUDINARY_UPLOAD_TIMEOUT_MS/,
      /res\.cloudinary\.com/,
    ];

    for (
      const pattern
      of requiredPatterns
    ) {
      assertContains(
        source,
        pattern,

        `Upload security contract is missing ${pattern}.`
      );
    }
  }
);
