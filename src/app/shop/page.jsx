import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function ShopPage() {
  const products = [
    {
      name: "Artifact 001",
      price: "৳ 799",
      image: "/images/collection-artifact.jpeg",
      href: "/product",
    },
    {
      name: "Essential 001",
      price: "৳ 799",
      image: "/images/collection-essential.jpeg",
      href: "/product",
    },
    {
      name: "Blueprint 001",
      price: "৳ 799",
      image: "/images/collection-blueprint.jpeg",
      href: "/product",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-32">
        <div className="container-custom">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Shop
          </p>

          <div className="mb-16 flex items-end justify-between gap-8">
            <h1 className="font-heading text-6xl font-light md:text-8xl">
              All Products
            </h1>

            <p className="hidden text-xs uppercase tracking-[0.3em] text-neutral-500 md:block">
              3 Pieces
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                href={product.href}
                key={product.name}
                className="group overflow-hidden border border-black/10 bg-[#eee7dd] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-square overflow-hidden bg-[#0b0b0b]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain p-2 transition duration-700 group-hover:scale-[1.02]"
                  />
                </div>

                <div className="p-6">
                  <h2 className="font-heading text-3xl font-light">
                    {product.name}
                  </h2>

                  <p className="mt-3 text-neutral-600">{product.price}</p>

                  <p className="mt-6 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    View Product →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}