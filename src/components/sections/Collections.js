import Link from "next/link";
import clientPromise from "../../lib/mongodb";

async function getFeaturedCollections() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const collections = await db
    .collection("collections")
    .find({
      isActive: true,
      isFeatured: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(3)
    .toArray();

  return JSON.parse(JSON.stringify(collections));
}

export default async function Collections() {
  const collections = await getFeaturedCollections();

  return (
    <section className="bg-[#f1ece4] px-6 py-32 text-[#0b0b0b]">
      <div className="container-custom">
        <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
          Collections
        </p>

        <div className="mb-16 flex items-end justify-between gap-8">
          <h2 className="font-heading text-5xl font-light md:text-7xl">
            Designed To Endure
          </h2>

          <Link
            href="/collections"
            className="hidden text-xs uppercase tracking-[0.3em] text-neutral-600 hover:text-black md:block"
          >
            View All
          </Link>
        </div>

        {collections.length === 0 ? (
          <div className="border border-black/10 bg-[#eee7dd] p-8">
            <p className="text-sm leading-7 text-neutral-600">
              No featured collections are available right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection._id}
                href={`/shop?series=${encodeURIComponent(collection.series)}`}
                className="group block overflow-hidden border border-black/10 bg-[#eee7dd] transition-all duration-300 hover:-translate-y-1 hover:border-black/25"
              >
                <div className="aspect-square overflow-hidden bg-[#0b0b0b]">
                  <img
                    src={collection.coverImage}
                    alt={collection.title}
                    className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="p-6">
                  <h3 className="font-heading text-3xl font-light">
                    {collection.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-neutral-600">
                    {collection.description}
                  </p>

                  <p className="mt-6 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    View Products →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}