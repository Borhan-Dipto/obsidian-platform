import "server-only";

import { createAdminAuth } from "./createAdminAuth";

export const adminAuth =
  await createAdminAuth({
    bootstrapMode: false,
  });

export type AdminAuth =
  typeof adminAuth;