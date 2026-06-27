"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";

export default function ProductPage() {
  const { addToCart } = useCart();

  const product = {
    id: "artifact-001",
    name: "Artifact 001",
    series: "Artifact Series",
    color: "Obsidian Black",
    price: 799,
    image: "/images/featured-artifact.jpeg",
  };

  const WHATSAPP_NUMBER = "8801XXXXXXXXX";

  const whatsappMessage =
    "Hello Obsidian, I want to order Artifact 001.%0A%0AProduct: Artifact 001%0ASeries: Artifact Series%0AColor: Obsidian Black%0APrice: 799 BDT%0A%0APlease confirm availability.";

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  function handleAddToCart() {
    addToCart(product);
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom grid gap-16 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
              <Image
                src="/images/featured-artifact.jpeg"
                alt="Artifact 001"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative aspect-square overflow-hidden bg-[#0b0b0b]">
                <Image
                  src="/images/collection-artifact.jpeg"
                  alt="Artifact 001 Collection"
                  fill
                  sizes="25vw"
                  className="object-cover object-center"
                />
              </div>

              <div className="relative aspect-square overflow-hidden bg-[#0b0b0b]">
                <Image
                  src="/images/hero1.jpeg"
                  alt="Artifact 001 Front and Back"
                  fill
                  sizes="25vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>

          <div className="md:sticky md:top-32 md:self-start">
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Artifact Series
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Artifact 001
            </h1>

            <p className="mt-6 text-2xl">৳ 799</p>

            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-700">
              Inspired by ancient strength and refined purpose. Designed for
              those who build under pressure and move with quiet confidence.
            </p>

            <div className="mt-10">
              <p className="mb-4 text-xs uppercase tracking-[0.3em]">Size</p>

              <div className="flex flex-wrap gap-3">
                <button className="border border-black px-5 py-3 text-sm transition hover:bg-black hover:text-white">
                  M
                </button>
                <button className="border border-black px-5 py-3 text-sm transition hover:bg-black hover:text-white">
                  L
                </button>
                <button className="border border-black px-5 py-3 text-sm transition hover:bg-black hover:text-white">
                  XL
                </button>
              </div>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-xs uppercase tracking-[0.3em]">Color</p>

              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full border border-black bg-[#111]" />
                <span className="text-sm text-neutral-600">Obsidian Black</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="mt-12 w-full border border-black px-8 py-5 text-xs uppercase tracking-[0.35em] transition hover:bg-black hover:text-white"
            >
              Add To Cart
            </button>

            <Link
              href="/cart"
              className="mt-4 block w-full border border-black/20 px-8 py-5 text-center text-xs uppercase tracking-[0.35em] transition hover:bg-black hover:text-white"
            >
              View Cart
            </Link>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full bg-black px-8 py-5 text-center text-xs uppercase tracking-[0.35em] text-white transition hover:opacity-80"
            >
              Buy Now On WhatsApp
            </a>

            <div className="mt-16 border-t border-black/10 pt-10">
              <h2 className="font-heading text-3xl">Product Details</h2>

              <ul className="mt-6 space-y-4 text-neutral-700">
                <li>• Oversized premium fit</li>
                <li>• Heavyweight cotton fabric</li>
                <li>• Front and back graphic print</li>
                <li>• Soft washed finish</li>
                <li>• Designed in Bangladesh</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}