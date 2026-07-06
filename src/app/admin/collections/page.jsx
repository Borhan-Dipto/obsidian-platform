import Link from "next/link";
import clientPromise from "../../../lib/mongodb";
import { requireAdminAuth } from "../../../lib/adminAuth";
import CollectionsManager from "../../../components/admin/CollectionsManager";

async function getCollections() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const collections = await db
    .collection("collections")
    .find({})
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(collections));
}

export default async function AdminCollectionsPage() {
  await requireAdminAuth();

  const collections = await getCollections();

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Collections
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Collections
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/products"
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Products
            </Link>

            <Link
              href="/admin"
              className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back
            </Link>
          </div>
        </div>

        <CollectionsManager initialCollections={collections} />
      </div>
    </main>
  );
}