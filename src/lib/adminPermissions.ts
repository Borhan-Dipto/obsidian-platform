import {
  createAccessControl,
} from "better-auth/plugins/access";

import {
  adminAc,
  defaultStatements,
} from "better-auth/plugins/admin/access";

/*
 * OBSIDIAN Admin permission catalogue.
 *
 * Better Auth's built-in user and session
 * resources are retained through
 * defaultStatements.
 */
export const ADMIN_PERMISSION_STATEMENTS =
  {
    ...defaultStatements,

    dashboard: [
      "read",
    ],

    orders: [
      "read",
      "update",
      "export",
    ],

    customers: [
      "read",
      "update",
      "export",
    ],

    products: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    collections: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    coupons: [
      "read",
      "create",
      "update",
      "delete",
    ],

    newsletter: [
      "read",
      "create",
      "update",
      "delete",
      "export",
    ],

    content: [
      "read",
      "update",
    ],

    settings: [
      "read",
      "update",
    ],

    notifications: [
      "read",
      "update",
    ],

    media: [
      "upload",
    ],

    security: [
      "read_audit",
      "manage_staff",
    ],
  } as const;

export const adminAccessControl =
  createAccessControl(
    ADMIN_PERMISSION_STATEMENTS
  );

/*
 * Owner / Super Admin
 *
 * Retains all Better Auth administrative
 * permissions and all OBSIDIAN platform
 * permissions.
 */
export const adminRole =
  adminAccessControl.newRole({
    ...adminAc.statements,

    dashboard: [
      "read",
    ],

    orders: [
      "read",
      "update",
      "export",
    ],

    customers: [
      "read",
      "update",
      "export",
    ],

    products: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    collections: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    coupons: [
      "read",
      "create",
      "update",
      "delete",
    ],

    newsletter: [
      "read",
      "create",
      "update",
      "delete",
      "export",
    ],

    content: [
      "read",
      "update",
    ],

    settings: [
      "read",
      "update",
    ],

    notifications: [
      "read",
      "update",
    ],

    media: [
      "upload",
    ],

    security: [
      "read_audit",
      "manage_staff",
    ],
  });

/*
 * Operations Manager
 *
 * Manages orders and customer-service
 * workflows without access to sensitive
 * system configuration.
 */
export const operationsRole =
  adminAccessControl.newRole({
    dashboard: [
      "read",
    ],

    orders: [
      "read",
      "update",
      "export",
    ],

    customers: [
      "read",
      "update",
    ],

    products: [
      "read",
    ],

    collections: [
      "read",
    ],
  });

/*
 * Catalog Manager
 *
 * Manages products, stock, collections
 * and the images required by the catalog.
 */
export const catalogRole =
  adminAccessControl.newRole({
    dashboard: [
      "read",
    ],

    products: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    collections: [
      "read",
      "read_private",
      "create",
      "update",
      "delete",
    ],

    coupons: [
      "read",
    ],

    media: [
      "upload",
    ],
  });

/*
 * Content Manager
 *
 * Manages storefront CMS content and
 * uploaded editorial media.
 */
export const contentRole =
  adminAccessControl.newRole({
    dashboard: [
      "read",
    ],

    content: [
      "read",
      "update",
    ],

    media: [
      "upload",
    ],
  });

/*
 * Marketing Manager
 *
 * Manages promotions, newsletter
 * subscribers and subscriber exports.
 */
export const marketingRole =
  adminAccessControl.newRole({
    dashboard: [
      "read",
    ],

    coupons: [
      "read",
      "create",
      "update",
      "delete",
    ],

    newsletter: [
      "read",
      "create",
      "update",
      "delete",
      "export",
    ],

    products: [
      "read",
    ],

    collections: [
      "read",
    ],
  });

/*
 * Read-only Viewer
 *
 * Can review routine operational and
 * commercial information without altering
 * platform data or entering CMS editors,
 * security, payment, notification or staff
 * controls.
 */
export const viewerRole =
  adminAccessControl.newRole({
    dashboard: [
      "read",
    ],

    orders: [
      "read",
    ],

    customers: [
      "read",
    ],

    products: [
      "read",
      "read_private",
    ],

    collections: [
      "read",
      "read_private",
    ],

    coupons: [
      "read",
    ],

    newsletter: [
      "read",
    ],
  });

/*
 * Safe fallback role.
 *
 * Public signup remains disabled, but the
 * default Better Auth role must still exist.
 * It receives no Admin Workspace access.
 */
export const userRole =
  adminAccessControl.newRole({
    user: [],
    session: [],
  });

export const ADMIN_ROLE_DEFINITIONS =
  {
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
  } as const;

export type AdminRoleKey =
  keyof typeof ADMIN_ROLE_DEFINITIONS;

export const ADMIN_WORKSPACE_ROLE_KEYS =
  [
    "admin",
    "operations",
    "catalog",
    "content",
    "marketing",
    "viewer",
  ] as const satisfies readonly AdminRoleKey[];

export const ADMIN_ASSIGNABLE_ROLE_KEYS =
  [
    "admin",
    "operations",
    "catalog",
    "content",
    "marketing",
    "viewer",
  ] as const satisfies readonly AdminRoleKey[];

export const ADMIN_ROLE_METADATA =
  {
    admin: {
      label:
        "Owner / Super Admin",

      description:
        "Complete access to the platform, security controls, staff accounts and configuration.",

      risk:
        "critical",
    },

    operations: {
      label:
        "Operations Manager",

      description:
        "Manages orders and customer-service workflows.",

      risk:
        "high",
    },

    catalog: {
      label:
        "Catalog Manager",

      description:
        "Manages products, stock, collections and catalog media.",

      risk:
        "high",
    },

    content: {
      label:
        "Content Manager",

      description:
        "Manages storefront CMS content and editorial media.",

      risk:
        "standard",
    },

    marketing: {
      label:
        "Marketing Manager",

      description:
        "Manages coupons, promotions, newsletter subscribers and exports.",

      risk:
        "high",
    },

    viewer: {
      label:
        "Read-only Viewer",

      description:
        "Can review operational information without changing platform data.",

      risk:
        "low",
    },

    user: {
      label:
        "No Admin Access",

      description:
        "Authenticated account without Admin Workspace permissions.",

      risk:
        "none",
    },
  } as const;

export function normalizeAdminRoles(
  roleValue: unknown
): AdminRoleKey[] {
  const source =
    Array.isArray(roleValue)
      ? roleValue
      : String(
          roleValue ?? ""
        ).split(",");

  const normalizedRoles =
    source
      .map((role) =>
        String(role ?? "")
          .trim()
          .toLowerCase()
      )
      .filter(
        (
          role
        ): role is AdminRoleKey =>
          Object.prototype.hasOwnProperty.call(
            ADMIN_ROLE_DEFINITIONS,
            role
          )
      );

  return Array.from(
    new Set(
      normalizedRoles
    )
  );
}

export function isAdminWorkspaceRole(
  role: unknown
): role is
  (typeof ADMIN_WORKSPACE_ROLE_KEYS)[number] {
  return ADMIN_WORKSPACE_ROLE_KEYS.includes(
    String(
      role ?? ""
    )
      .trim()
      .toLowerCase() as
      (typeof ADMIN_WORKSPACE_ROLE_KEYS)[number]
  );
}

export function hasAdminWorkspaceRole(
  roleValue: unknown
): boolean {
  return normalizeAdminRoles(
    roleValue
  ).some(
    isAdminWorkspaceRole
  );
}