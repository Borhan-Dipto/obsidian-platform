import Link from "next/link";
import clientPromise from "../../lib/mongodb";
import Reveal from "../ui/Reveal";

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
    <section className="relative overflow-hidden bg-[#eee7dd] px-6 pt-20 pb-32 text-[#0b0b0b] lg:pt-24 lg:pb-40">
      <div className="pointer-events-none absolute inset-0 opacity-[0.028]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0b0b_1px,transparent_1px),linear-gradient(#0b0b0b_1px,transparent_1px)] bg-[size:96px_96px]" />
      </div>

      <div className="pointer-events-none absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-[#0b0b0b]/7 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-[32rem] w-[32rem] rounded-full bg-[#b1844a]/10 blur-3xl" />

      <div className="container-custom relative z-10">
        <Reveal>
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px w-8 bg-[#b1844a]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-neutral-500">
              Collections
            </p>
          </div>

          <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h2 className="font-heading text-[4rem] font-light leading-[0.9] tracking-[-0.055em] text-[#0b0b0b] sm:text-[5.5rem] lg:text-[7rem]">
                Designed
                <br className="hidden sm:block" /> to endure.
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600">
                Explore the first OBSIDIAN fashion drops — oversized T-shirts,
                graphic essentials, and future-ready collection stories.
              </p>
            </div>

            <Link
              href="/collections"
              className="group inline-flex w-fit items-center gap-4 border border-black/20 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-700 transition duration-300 hover:border-black hover:bg-black hover:text-[#f1ece4]"
            >
              View All
              <span className="transition duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </Reveal>

        {collections.length === 0 ? (
          <Reveal>
            <div className="border border-black/10 bg-[#f1ece4] p-8">
              <p className="text-sm leading-7 text-neutral-600">
                No featured collections are available right now.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <Reveal key={collection._id} delay={index * 140}>
                <Link
                  href={`/shop?series=${encodeURIComponent(collection.series)}`}
                  className="group block overflow-hidden border border-black/10 bg-[#f1ece4] transition duration-500 hover:-translate-y-2 hover:border-black/30"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                    <img
                      src={collection.coverImage}
                      alt={collection.title}
                      className="h-full w-full object-cover object-center transition duration-1000 group-hover:scale-[1.055]"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,0.64),transparent_58%)] opacity-80 transition duration-500 group-hover:opacity-55" />

                    <div className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#f1ece4]/25 bg-black/35 font-heading text-lg text-[#f1ece4] backdrop-blur-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#d7bea0]">
                        Obsidian Drop
                      </p>

                      <h3 className="font-heading text-4xl font-light leading-none tracking-[-0.04em] text-[#f1ece4]">
                        {collection.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 lg:p-7">
                    <p className="text-sm leading-7 text-neutral-600">
                      {collection.description}
                    </p>

                    <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                        View Products
                      </p>

                      <span className="text-xl leading-none text-[#0b0b0b] transition duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}