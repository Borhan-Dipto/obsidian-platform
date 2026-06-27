import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function ArtifactPage() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-24">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Collection 001
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            Artifact Series
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
            Inspired by history, pressure, and ancient strength. The Artifact
            Series transforms visual fragments of the past into modern everyday
            essentials.
          </p>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="container-custom grid gap-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="relative aspect-[16/10] overflow-hidden bg-[#0b0b0b]">
            <Image
              src="/images/collection-artifact.jpeg"
              alt="Artifact Series"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-contain p-2"
            />
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-neutral-500">
              The First Drop
            </p>

            <h2 className="font-heading text-5xl font-light">
              Artifact 001
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-700">
              A dark oversized piece designed around ancient visual language,
              fractured textures, and the quiet strength of obsidian.
            </p>

            <Link
              href="/product"
              className="mt-10 inline-block border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-white"
            >
              View Product
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}