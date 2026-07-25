import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {
  admin,
  twoFactor,
} from "better-auth/plugins";
import {
  adminAccessControl,
  adminRole,
  catalogRole,
  contentRole,
  marketingRole,
  operationsRole,
  userRole,
  viewerRole,
} from "./adminPermissions";
import {
  adminAuthAuditAfterHook,
  handleAdminAuthApiError,
} from "./adminAuthAuditHooks";
import {
  getMongoClient,
  MONGODB_DATABASE_NAME,
} from "./mongodb";

type CreateAdminAuthOptions = {
  bootstrapMode?: boolean;
};

function normalizeEnvironmentValue(
  value: string | undefined
): string {
  return String(value || "").trim();
}

function normalizeOrigin(
  value: string | undefined
): string {
  const candidate =
    normalizeEnvironmentValue(value);

  if (!candidate) {
    return "";
  }

  try {
    return new URL(
      candidate.includes("://")
        ? candidate
        : `https://${candidate}`
    ).origin;
  } catch {
    return "";
  }
}

function getCanonicalUrlCandidates(): Array<
  string | undefined
> {
  return [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL,
  ];
}

function getTrustedOriginCandidates(): Array<
  string | undefined
> {
  return [
    ...getCanonicalUrlCandidates(),
    process.env.VERCEL_URL,
  ];
}

function resolveBaseUrl(
  isProduction: boolean
): string {
  for (const candidate of getCanonicalUrlCandidates()) {
    const origin =
      normalizeOrigin(candidate);

    if (origin) {
      return origin;
    }
  }

  if (isProduction) {
    throw new Error(
      "Admin authentication requires a valid production URL. Configure BETTER_AUTH_URL with the canonical HTTPS website URL."
    );
  }

  return "http://localhost:3000";
}

function resolveTrustedOrigins(
  isProduction: boolean
): string[] {
  const origins = new Set<string>();

  if (!isProduction) {
    origins.add(
      "http://localhost:3000"
    );

    origins.add(
      "http://127.0.0.1:3000"
    );
  }

  for (const candidate of getTrustedOriginCandidates()) {
    const origin =
      normalizeOrigin(candidate);

    if (origin) {
      origins.add(origin);
    }
  }

  return Array.from(origins);
}

function resolveAuthSecret(
  isProduction: boolean
): string {
  const secret =
    normalizeEnvironmentValue(
      process.env.BETTER_AUTH_SECRET
    );

  if (
    isProduction &&
    secret.length < 32
  ) {
    throw new Error(
      "BETTER_AUTH_SECRET must be configured with at least 32 characters in production."
    );
  }

  return secret;
}

export async function createAdminAuth(
  options: CreateAdminAuthOptions = {}
) {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  const bootstrapMode =
    options.bootstrapMode === true;

  if (
    isProduction &&
    bootstrapMode
  ) {
    throw new Error(
      "Admin bootstrap mode cannot run in production."
    );
  }

  const baseURL =
    resolveBaseUrl(
      isProduction
    );

  const trustedOrigins =
    resolveTrustedOrigins(
      isProduction
    );

  const authSecret =
    resolveAuthSecret(
      isProduction
    );

  const mongoClient =
    await getMongoClient();

  const mongoDatabase =
    mongoClient.db(
      MONGODB_DATABASE_NAME
    );

  return betterAuth({
    appName: "OBSIDIAN Admin",

    ...(authSecret
      ? {
          secret:
            authSecret,
        }
      : {}),

    baseURL,

    basePath:
      "/api/admin/auth",

    database: mongodbAdapter(
      mongoDatabase,
      {
        client: mongoClient,
      }
    ),

    trustedOrigins,

    hooks: {
      after:
        adminAuthAuditAfterHook,
    },

    onAPIError: {
      onError:
        handleAdminAuthApiError,
    },

    emailAndPassword: {
      enabled: true,

      /*
       * The website never permits public
       * Admin registration.
       *
       * Signup is enabled only inside the
       * controlled local bootstrap script.
       */
      disableSignUp:
        !bootstrapMode,

      minPasswordLength: 14,
      maxPasswordLength: 128,

      autoSignIn: false,

      revokeSessionsOnPasswordReset:
        true,
    },

    user: {
      modelName:
        "admin_users",

      changeEmail: {
        enabled: false,
      },

      deleteUser: {
        enabled: false,
      },
    },

    session: {
      modelName:
        "admin_sessions",

      expiresIn:
        60 * 60 * 8,

      updateAge:
        60 * 15,

      freshAge:
        60 * 5,

      cookieCache: {
        enabled: false,
      },
    },

    account: {
      modelName:
        "admin_accounts",

      accountLinking: {
        enabled: false,
      },
    },

    verification: {
      modelName:
        "admin_verifications",

      storeIdentifier:
        "hashed",
    },

    rateLimit: {
      enabled: true,

      storage:
        "database",

      modelName:
        "admin_rate_limits",

      window: 60,
      max: 60,

      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 5,
        },

        "/sign-up/email": {
          window: 60,
          max: 2,
        },

        "/two-factor/verify-totp":
          {
            window: 60,
            max: 5,
          },

        "/two-factor/verify-backup-code":
          {
            window: 300,
            max: 3,
          },
      },
    },

    advanced: {
      cookiePrefix:
        "obsidian-admin-secure",

      useSecureCookies:
        isProduction,

      disableCSRFCheck: false,
      disableOriginCheck: false,

      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      },

      ipAddress: {
        disableIpTracking:
          false,
      },
    },

    plugins: [
      twoFactor({
        issuer:
          "OBSIDIAN Admin",

        twoFactorTable:
          "admin_two_factor",

        skipVerificationOnEnable:
          false,

        allowPasswordless:
          false,

        totpOptions: {
          digits: 6,
          period: 30,
        },

        backupCodeOptions: {
          amount: 10,
          length: 12,
        },

        accountLockout: {
          enabled: true,

          maxFailedAttempts: 5,

          durationSeconds:
            30 * 60,
        },
      }),

      admin({
        /*
         * Only the controlled local
         * bootstrap account receives the
         * owner-level Admin role
         * automatically.
         */
        defaultRole:
          bootstrapMode
            ? "admin"
            : "user",

        ac:
          adminAccessControl,

        roles: {
          admin:
            adminRole,

          operations:
            operationsRole,

          catalog:
            catalogRole,

          content:
            contentRole,

          marketing:
            marketingRole,

          viewer:
            viewerRole,

          user:
            userRole,
        },

        impersonationSessionDuration:
          15 * 60,

        bannedUserMessage:
          "This administrator account is unavailable.",
      }),
    ],
  });
}