"use client";

import {
  createAuthClient,
} from "better-auth/react";
import {
  adminClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const adminAuthClient =
  createAuthClient({
    basePath:
      "/api/admin/auth",

    fetchOptions: {
      credentials:
        "same-origin",
    },

    plugins: [
      twoFactorClient({
        twoFactorPage:
          "/admin/verify",
      }),

      adminClient(),
    ],
  });

export const {
  signIn,
  signOut,
  useSession,
  getSession,
} = adminAuthClient;