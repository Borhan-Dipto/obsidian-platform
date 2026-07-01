import Image from "next/image";
import Link from "next/link";

export default function RelatedProducts({ currentProductId }) {
  const products = [
    {
      id: "artifact-001",
      name: "Artifact 001",
      series: "Artifact Series",
      price: "৳ 799",
      image: "/images/featured-artifact.jpeg",
      href: "/product/artifact-001",
    },
    {
      id: "essential-001",
      name: "Essential 001",
      series: "Essential Series",
      price: "৳ 699",
      image: "/images/hero1.jpeg",
      href: "/product/essential-001",
    },
    {
      id: "blueprint-001",
      name: "Blueprint 001",
      series: "Blueprint Series",
      price: "৳ 899",
      image: "/images/collection-artifact.jpeg",
      href: "/product/blueprint-001",
    },
  ].filter((product) => product.id !== currentProductId);

  return (
    <section className="border-t border-black/10 px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex items-end justify-between gap-8">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Related Products
            </p>

            <h2 className="font-heading text-5xl font-light">
              You May Also Like
            </h2>
          </div>

          <Link
            href="/shop"
            className="hidden text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:text-black md:block"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
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
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  {product.series}
                </p>

                <div className="mt-3 flex items-center justify-between gap-6">
                  <h3 className="font-heading text-3xl font-light">
                    {product.name}
                  </h3>

                  <p className="text-sm text-neutral-700">{product.price}</p>
                </div>

                <p className="mt-6 border-t border-black/10 pt-5 text-xs uppercase tracking-[0.25em] text-neutral-500">
                  View Product →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}