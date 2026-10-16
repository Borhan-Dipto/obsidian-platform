import FramedImage from "../ui/FramedImage";
import Link from "next/link";
import Reveal from "../ui/Reveal";

const RELATED_PRODUCTS = [
  {
    id: "artifact-001",
    name: "Artifact 001",
    series: "Artifact Series",
    price: 799,
    image: "/images/featured-artifact.jpeg",
  },
  {
    id: "essential-001",
    name: "Essential 001",
    series: "Essential Series",
    price: 699,
    image: "/images/hero1.jpeg",
  },
  {
    id: "blueprint-001",
    name: "Blueprint 001",
    series: "Blueprint Series",
    price: 899,
    image: "/images/collection-artifact.jpeg",
  },
];

const FALLBACK_IMAGE = "/images/collection-artifact.jpeg";

function getProductImage(product) {
  if (typeof product?.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  return FALLBACK_IMAGE;
}

export default function RelatedProducts({ currentProductId }) {
  const products = RELATED_PRODUCTS.filter(
    (product) => product.id !== currentProductId
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="obsidian-product-related-section border-t border-black/10 bg-[#f1ece4] px-6 py-24 text-[#0b0b0b] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal
          as="div"
          variant="fade-up"
          duration={900}
          y={24}
          className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Related Products
            </p>

            <h2 className="font-heading text-5xl font-light leading-none md:text-7xl">
              You May Also Like
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600">
              Explore more OBSIDIAN pieces shaped by pressure, precision, and
              purpose.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex w-fit border border-black/20 px-6 py-4 text-xs uppercase tracking-[0.3em] text-neutral-700 transition duration-300 hover:border-black hover:bg-black hover:text-[#f1ece4]"
          >
            View All Products
          </Link>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <Reveal
              key={product.id}
              as="div"
              variant="scale"
              delay={index * 80}
              duration={900}
              y={22}
              className="h-full"
            >
            <Link
              href={`/product/${product.id}`}
              aria-label={`View ${product.name}`}
              className="obsidian-product-card group block h-full overflow-hidden border border-black/10 bg-[#eee7dd] transition duration-500 hover:-translate-y-1 hover:border-black/25 hover:shadow-2xl hover:shadow-black/10"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#0b0b0b]">
                <FramedImage
                  src={getProductImage(product)}
                  alt={product.name}
                  priority={index === 0}
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                  imageClassName=" transition-transform duration-1000 ease-out will-change-transform group-hover:scale-105"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="absolute bottom-4 right-4 translate-y-2 border border-[#f1ece4]/20 bg-black/45 px-4 py-3 text-[11px] uppercase tracking-[0.26em] text-[#f1ece4] opacity-0 backdrop-blur-md transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  View Product
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  {product.series}
                </p>

                <div className="mt-3 flex items-start justify-between gap-6">
                  <h3 className="font-heading text-3xl font-light leading-none">
                    {product.name}
                  </h3>

                  <p className="shrink-0 text-sm text-neutral-700">
                    ৳ {product.price}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                  <span className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Discover
                  </span>

                  <span className="transition duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}