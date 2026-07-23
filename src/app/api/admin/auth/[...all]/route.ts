import { toNextJsHandler } from "better-auth/next-js";
import { adminAuth } from "../../../../../lib/adminAuthCore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST } =
  toNextJsHandler(adminAuth);