import { NextResponse } from "next/server";

import { getMongoClient, MONGODB_DATABASE_NAME } from "../../../../lib/mongodb";
import { isLabMode } from "../../../../lib/labMode";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
 * ONE-TIME seed for the OBSIDIAN LAB test copy. Copies the live store's
 * catalogue, content, settings, coupons and admin login into the lab
 * database. Never copies customers, orders, sessions or other personal
 * or temporary data. Reads the live database only; refuses to run
 * outside lab mode, onto the live database, or onto a non-empty lab.
 * This file is removed from the lab branch right after use.
 */
const EXCLUDED = new Set([
  "orders",
  "customers",
  "customerPasswordResets",
  "publicApiRateLimits",
  "admin_sessions",
  "admin_verifications",
  "admin_rate_limits",
]);

const EXCLUDED_PATTERN = /newsletter|subscriber|audit|notificationDeliver|delivery_log|session|rateLimit|rate_limit/i;

export async function POST(request) {
  if (!isLabMode()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const client = await getMongoClient();
  const target = client.db(MONGODB_DATABASE_NAME);

  const { databases } = await client.db().admin().listDatabases({ nameOnly: true });
  const candidates = [];

  for (const { name } of databases) {
    if (name === MONGODB_DATABASE_NAME || ["admin", "local", "config"].includes(name)) {
      continue;
    }

    const names = (await client.db(name).listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);

    if (names.includes("products") && names.includes("admin_users")) {
      candidates.push(name);
    }
  }

  const wanted = new URL(request.url).searchParams.get("source");
  const sourceName = wanted && candidates.includes(wanted) ? wanted : candidates.length === 1 ? candidates[0] : "";

  if (!sourceName) {
    return NextResponse.json({ error: "Choose a source database.", candidates }, { status: 409 });
  }

  if ((await target.collection("products").estimatedDocumentCount()) > 0) {
    return NextResponse.json({ error: "Lab database already has data; nothing copied." }, { status: 409 });
  }

  const source = client.db(sourceName);
  const copied = {};
  const skipped = [];

  for (const info of await source.listCollections({ type: "collection" }).toArray()) {
    const name = info.name;

    if (name.startsWith("system.") || EXCLUDED.has(name) || EXCLUDED_PATTERN.test(name)) {
      skipped.push(name);
      continue;
    }

    const docs = await source.collection(name).find({}).toArray();

    if (docs.length > 0) {
      await target.collection(name).insertMany(docs, { ordered: false });
    }

    const indexes = (await source.collection(name).indexes()).filter((index) => index.name !== "_id_");

    for (const index of indexes) {
      const { key, name: indexName, v, ns, ...options } = index;

      try {
        await target.collection(name).createIndex(key, { name: indexName, ...options });
      } catch {
        /* Index options the target cannot take are skipped; app code recreates its own. */
      }
    }

    copied[name] = docs.length;
  }

  return NextResponse.json({ ok: true, copied, skipped, into: "lab database" });
}
