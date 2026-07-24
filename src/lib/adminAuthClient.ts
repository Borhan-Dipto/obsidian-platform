"use client";

import {
  createAuthClient,
} from "better-auth/react";

import {
  adminClient,
  twoFactorClient,
} from "better-auth/client/plugins";

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

      adminClient({
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
      }),
    ],
  });

export const {
  signIn,
  signOut,
  useSession,
  getSession,
} = adminAuthClient;