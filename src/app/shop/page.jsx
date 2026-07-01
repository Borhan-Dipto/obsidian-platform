import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function ShopPage() {
  const products = [
    {
      id: "artifact-001",
      name: "Artifact 001",
      series: "Artifact Series",
      color: "Obsidian Black",
      price: "৳ 799",
      image: "/images/collection-artifact.jpeg",
      href: "/product/artifact-001",
    },
    {
      id: "essential-001",
      name: "Essential 001",
      series: "Essential Series",
      color: "Stone Ivory",
      price: "৳ 799",
      image: "/images/collection-essential.jpeg",
      href: "/product/essential-001",
    },
    {
      id: "blueprint-001",
      name: "Blueprint 001",
      series: "Blueprint Series",
      color: "Blueprint White",
      price: "৳ 799",
      image: "/images/collection-blueprint.jpeg",
      href: "/product/blueprint-001",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Shop
            </p>

            <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
              Engineered
              <br />
              Essentials
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600">
              Every piece is built under pressure and finished with precision.
              Minimal forms. Maximum intention.
            </p>
          </div>

          <div className="mt-14 flex flex-col gap-6 border-y border-black/10 py-5 md:flex-row md:items-center md:justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {products.length} Products
            </p>

            <div className="flex flex-wrap gap-7 text-xs uppercase tracking-[0.28em] text-neutral-600">
              <button className="transition hover:text-black">Latest</button>
              <button className="transition hover:text-black">Price</button>
              <button className="transition hover:text-black">Collection</button>
            </div>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="group block border border-black/10 bg-[#eee7dd] transition duration-300 hover:-translate-y-1 hover:border-black/25"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#0b0b0b]/85 px-5 py-4 text-[#f1ece4] backdrop-blur-sm transition duration-300 group-hover:translate-y-0">
                    <p className="text-xs uppercase tracking-[0.28em]">
                      View Product
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                        {product.series}
                      </p>

                      <h2 className="mt-3 font-heading text-3xl font-light">
                        {product.name}
                      </h2>
                    </div>

                    <p className="shrink-0 text-sm text-neutral-700">
                      {product.price}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                      {product.color}
                    </p>

                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                      Details →
                    </p>
                  </div>
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