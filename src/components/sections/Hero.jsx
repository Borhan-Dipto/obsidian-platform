import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-[#f1ece4] text-[#0b0b0b]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 items-center gap-16 px-6 pt-32 pb-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pt-36 lg:pb-24">
        <div className="max-w-[720px]">
          <p className="mb-8 text-xs uppercase tracking-[0.55em] text-neutral-500">
            Built Under Pressure
          </p>

          <h1 className="font-heading text-[5.5rem] font-light leading-[0.85] tracking-[-0.05em] sm:text-[7rem] lg:text-[10rem]">
            OBSIDIAN
          </h1>

          <p className="mt-10 max-w-xl text-lg leading-9 text-neutral-700">
            Engineered essentials shaped by pressure, precision, and quiet
            confidence.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/collections/artifact"
              className="inline-flex w-fit border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.32em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            >
              View Collection
            </Link>

            <Link
              href="/shop"
              className="inline-flex w-fit px-1 py-4 text-xs uppercase tracking-[0.32em] text-neutral-600 transition hover:text-[#0b0b0b]"
            >
              Shop All
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0b0b0b] lg:min-h-[680px]">
          <Image
            src="/images/hero1.jpeg"
            alt="Obsidian Artifact Series T-shirt"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}