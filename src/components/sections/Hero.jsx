import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[820px] overflow-hidden bg-[#0b0b0b] text-[#f1ece4]">
      <Image
        src="/images/hero-obsidian-editorial.png"
        alt="Obsidian Hero"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_top]"
        style={{
          animation: "heroImagePremiumZoom 18s ease-out forwards",
        }}
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,rgba(11,11,11,0.95)_0%,rgba(11,11,11,0.76)_48%,rgba(11,11,11,0.25)_78%,transparent_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(to_top,rgba(11,11,11,0.82)_0%,rgba(11,11,11,0.28)_55%,transparent_100%)]" />

      <div className="relative z-20 flex h-full items-center px-6 pt-16 pb-20 sm:px-10 lg:px-20">
        <div className="max-w-[650px]">
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px w-10 bg-[#b1844a]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#d7bea0]">
              Built Under Pressure
            </p>
          </div>

          <h1 className="font-heading text-[4.6rem] font-light leading-[0.84] tracking-[-0.06em] sm:text-[6rem] lg:text-[7.6rem]">
            Where
            <br />
            pressure
            <br />
            meets
            <br />
            precision
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-[#eee7dd]/82">
            Engineered essentials shaped by pressure, precision, and quiet
            confidence.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/collections"
              className="group inline-flex items-center gap-5 rounded-full bg-[#f1ece4] px-9 py-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0b0b0b] transition hover:bg-[#d7bea0]"
            >
              Explore Collection
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href="/shop"
              className="border-b border-[#d7bea0]/70 pb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4]/85"
            >
              Shop All
            </Link>
          </div>

          <Link
            href="/shop?series=Artifact%20Series"
            className="relative z-40 mt-10 flex w-fit items-center gap-4 border border-[#f1ece4]/10 bg-[#0b0b0b]/45 p-3 backdrop-blur-md transition hover:bg-[#0b0b0b]/70"
          >
            <div className="relative h-[60px] w-[60px] overflow-hidden bg-[#111]">
              <Image
                src="/images/collection-artifact.jpeg"
                alt="Artifact Series"
                fill
                sizes="60px"
                className="object-cover"
              />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#b1844a]">
                New Drop
              </p>
              <h3 className="mt-1 font-heading text-[1.35rem] font-light">
                Artifact Series
              </h3>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7bea0]">
                View →
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="absolute right-8 top-[42%] z-20 hidden w-[250px] border border-[#f1ece4]/12 bg-[#0b0b0b]/62 p-7 backdrop-blur-md lg:block xl:right-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em]">
          Obsidian System
        </p>

        <p className="mt-5 text-sm leading-7 text-[#eee7dd]/70">
          A refined uniform for discipline, strength, and intentional everyday
          presence.
        </p>

        <Link
          href="/collections"
          className="mt-7 inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7bea0]"
        >
          Discover →
        </Link>
      </div>

      <div className="absolute right-8 top-28 z-20 hidden text-center lg:block xl:right-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
          OBS / 01
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
          Bangladesh
        </p>
        <span className="mx-auto mt-4 block h-px w-8 bg-[#b1844a]" />
      </div>
    </section>
  );
}