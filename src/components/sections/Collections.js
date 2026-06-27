import Image from "next/image";
import Link from "next/link";

export default function Collections() {
  const collections = [
    {
      title: "Artifact Series",
      description: "Inspired by history, crafted for the present.",
      image: "/images/collection-artifact.jpeg",
      href: "/collections/artifact",
    },
    {
      title: "Essential Series",
      description: "Minimal forms. Maximum intention.",
      image: "/images/collection-essential.jpeg",
      href: "/collections/essential",
    },
    {
      title: "Blueprint Series",
      description: "Engineering precision meets everyday wear.",
      image: "/images/collection-blueprint.jpeg",
      href: "/collections/blueprint",
    },
  ];

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
            href="/collections/artifact"
            className="hidden text-xs uppercase tracking-[0.3em] text-neutral-600 hover:text-black md:block"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="group block overflow-hidden border border-black/10 bg-[#eee7dd] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-square overflow-hidden bg-[#0b0b0b]">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain transition duration-700 group-hover:scale-[1.02]"
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
                  Explore Collection →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}