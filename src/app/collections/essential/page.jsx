import Image from "next/image";
import Link from "next/link";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";

export default function EssentialPage() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-24">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Collection 002
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            Essential Series
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
            Minimal forms. Maximum intention. The Essential Series focuses on
            timeless design, clean silhouettes, and everyday versatility.
          </p>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="container-custom grid gap-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="relative aspect-[16/10] overflow-hidden bg-[#0b0b0b]">
            <Image
              src="/images/collection-essential.jpeg"
              alt="Essential Series"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-contain p-2"
            />
          </div>

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-neutral-500">
              The Essential Drop
            </p>

            <h2 className="font-heading text-5xl font-light">
              Essential 001
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-700">
              Designed around simplicity and purpose. A refined everyday piece
              that embodies the core philosophy of Obsidian.
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