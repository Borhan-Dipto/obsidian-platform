import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {
  admin,
  twoFactor,
} from "better-auth/plugins";
import {
  getMongoClient,
  MONGODB_DATABASE_NAME,
} from "./mongodb";

type CreateAdminAuthOptions = {
  bootstrapMode?: boolean;
};

function normalizeOrigin(
  value: string | undefined
): string {
  const candidate = String(
    value || ""
  ).trim();

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

function resolveBaseUrl(): string {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const origin =
      normalizeOrigin(candidate);

    if (origin) {
      return origin;
    }
  }

  return "http://localhost:3000";
}

function resolveTrustedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const origin =
      normalizeOrigin(candidate);

    if (origin) {
      origins.add(origin);
    }
  }

  return Array.from(origins);
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

  const mongoClient =
    await getMongoClient();

  const mongoDatabase =
    mongoClient.db(
      MONGODB_DATABASE_NAME
    );

  return betterAuth({
    appName: "OBSIDIAN Admin",

    baseURL: resolveBaseUrl(),

    basePath:
      "/api/admin/auth",

    database: mongodbAdapter(
      mongoDatabase,
      {
        client: mongoClient,
      }
    ),

    trustedOrigins:
      resolveTrustedOrigins(),

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
         * Only the local one-time bootstrap
         * account receives the Admin role
         * automatically.
         */
        defaultRole:
          bootstrapMode
            ? "admin"
            : "user",

        adminRoles: [
          "admin",
        ],

        impersonationSessionDuration:
          15 * 60,

        bannedUserMessage:
          "This administrator account is unavailable.",
      }),
    ],
  });
}