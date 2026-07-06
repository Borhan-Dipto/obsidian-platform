import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import clientPromise from "../../lib/mongodb";

async function getCollections() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "obsidian");

  const collections = await db
    .collection("collections")
    .find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return JSON.parse(JSON.stringify(collections));
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Collections
          </p>

          <div className="mb-14 border-b border-black/10 pb-8">
            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              All Collections
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
              Explore the core Obsidian series — each shaped around pressure,
              precision, and quiet strength.
            </p>
          </div>

          {collections.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-10">
              <p className="text-neutral-600">
                No collections are available right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {collections.map((collection) => (
                <Link
                  key={collection._id}
                  href={`/shop?series=${encodeURIComponent(
                    collection.series
                  )}`}
                  className="group block border border-black/10 bg-[#eee7dd] transition duration-300 hover:-translate-y-1 hover:border-black/25"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                    <img
                      src={collection.coverImage}
                      alt={collection.title}
                      className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-7">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                        Series
                      </p>

                      {collection.isFeatured ? (
                        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                          Featured
                        </p>
                      ) : null}
                    </div>

                    <h2 className="font-heading text-3xl font-light">
                      {collection.title}
                    </h2>

                    <p className="mt-4 text-sm leading-7 text-neutral-600">
                      {collection.description}
                    </p>

                    <p className="mt-7 text-xs uppercase tracking-[0.28em] text-neutral-500">
                      View Products →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}