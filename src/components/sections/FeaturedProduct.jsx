import Image from "next/image";

export default function FeaturedProduct() {
  return (
    <section className="bg-[#0b0b0b] px-6 py-32 text-[#f1ece4]">
      <div className="container-custom grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div className="relative aspect-square overflow-hidden bg-[#111]">
          <Image
            src="/images/featured-artifact.jpeg"
            alt="Obsidian Artifact 001"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
            priority
          />
        </div>

        <div>
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Featured Product
          </p>

          <h2 className="font-heading text-5xl font-light leading-tight md:text-7xl">
            Artifact 001
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-9 text-neutral-300">
            A dark oversized piece inspired by ancient strength, pressure, and
            refined purpose.
          </p>

          <p className="mt-8 text-sm uppercase tracking-[0.35em] text-neutral-500">
            Artifact Series / Obsidian Black
          </p>

          <a
            href="#"
            className="mt-12 inline-block border border-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            View Product
          </a>
        </div>
      </div>
    </section>
  );
}