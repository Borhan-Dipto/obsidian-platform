import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0b0b0b] text-[#f1ece4]">
      <div className="relative min-h-screen">
        <Image
          src="/images/hero-obsidian-editorial.png"
          alt="Obsidian editorial hero"
          fill
          priority
          sizes="100vw"
          className="animate-[heroImageZoom_14s_ease-out_forwards] object-cover object-center"
        />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(11,11,11,0.92)_0%,rgba(11,11,11,0.76)_27%,rgba(11,11,11,0.35)_48%,rgba(11,11,11,0.05)_72%,rgba(11,11,11,0)_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,11,11,0.72)_0%,rgba(11,11,11,0.18)_32%,rgba(11,11,11,0)_62%)]" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 pt-32 sm:px-10 lg:px-16 xl:px-20">
          <div className="max-w-[760px] pt-8 lg:pt-12">
            <div className="animate-[heroReveal_800ms_ease_120ms_both] mb-7 flex items-center gap-4">
              <span className="h-px w-8 origin-left animate-[heroLine_900ms_ease_260ms_both] bg-[#b1844a]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#f1ece4]/55">
                Built Under Pressure
              </p>
            </div>

            <h1 className="obsidian-cut-heading max-w-[760px] font-heading text-[4.5rem] font-light leading-[0.82] tracking-[-0.06em] text-[#f1ece4] sm:text-[6.4rem] lg:text-[8.2rem] xl:text-[9.4rem]">
              <span className="block animate-[heroReveal_850ms_ease_220ms_both]">
                Where
              </span>
              <span className="block animate-[heroReveal_850ms_ease_320ms_both]">
                pressure
              </span>
              <span className="block animate-[heroReveal_850ms_ease_420ms_both]">
                meets
              </span>
              <span className="block animate-[heroReveal_850ms_ease_520ms_both]">
                precision
              </span>
            </h1>

            <p className="animate-[heroReveal_800ms_ease_680ms_both] mt-8 max-w-md text-[15px] leading-8 text-[#eee7dd]/75 sm:text-base">
              Engineered essentials shaped by pressure, precision, and quiet
              confidence.
            </p>

            <div className="animate-[heroReveal_800ms_ease_820ms_both] mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link
                href="/collections"
                className="group inline-flex items-center gap-5 rounded-full bg-[#f1ece4] px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0b0b0b] shadow-xl shadow-black/30 transition duration-300 hover:bg-[#d7bea0]"
              >
                Explore Collection
                <span className="transition duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/shop"
                className="border-b border-[#f1ece4]/35 pb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4]/75 transition duration-300 hover:border-[#f1ece4] hover:text-[#f1ece4]"
              >
                Shop All
              </Link>
            </div>

            <div className="animate-[heroReveal_800ms_ease_980ms_both] mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="relative h-16 w-12 overflow-hidden border border-[#f1ece4]/15 bg-black shadow-lg shadow-black/30 transition duration-500 hover:-translate-y-1">
                  <Image
                    src="/images/hero-obsidian-editorial.png"
                    alt="Obsidian drop preview"
                    fill
                    sizes="48px"
                    className="object-cover object-center"
                  />
                </div>

                <div className="relative h-16 w-12 overflow-hidden border border-[#f1ece4]/15 bg-black shadow-lg shadow-black/30 transition duration-500 hover:-translate-y-1">
                  <Image
                    src="/images/collection-artifact.jpeg"
                    alt="Artifact series preview"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#f1ece4]/45">
                  New Drop
                </p>

                <p className="mt-1 font-heading text-xl leading-none text-[#f1ece4]">
                  Artifact Series
                </p>

                <Link
                  href="/shop?series=Artifact%20Series"
                  className="mt-2 inline-block text-[9px] font-semibold uppercase tracking-[0.26em] text-[#d7bea0] transition hover:text-[#f1ece4]"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden justify-between pb-10 text-center lg:flex">
            <div className="animate-[heroReveal_750ms_ease_1100ms_both] w-1/3 border-r border-[#f1ece4]/10 px-8 text-left">
              <p className="font-heading text-2xl font-light text-[#b1844a]">
                01
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                Pressure
              </p>
              <p className="mt-2 text-sm text-[#f1ece4]/55">Shapes us.</p>
            </div>

            <div className="animate-[heroReveal_750ms_ease_1220ms_both] w-1/3 border-r border-[#f1ece4]/10 px-8 text-left">
              <p className="font-heading text-2xl font-light text-[#b1844a]">
                02
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                Precision
              </p>
              <p className="mt-2 text-sm text-[#f1ece4]/55">Defines us.</p>
            </div>

            <div className="animate-[heroReveal_750ms_ease_1340ms_both] w-1/3 px-8 text-left">
              <p className="font-heading text-2xl font-light text-[#b1844a]">
                03
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                Identity
              </p>
              <p className="mt-2 text-sm text-[#f1ece4]/55">Sets us apart.</p>
            </div>
          </div>
        </div>

        <div className="absolute right-8 top-36 z-10 hidden animate-[heroReveal_800ms_ease_900ms_both] text-center lg:block xl:right-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
            OBS / 01
          </p>

          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]/65">
            Bangladesh
          </p>

          <span className="mx-auto mt-4 block h-px w-8 origin-center animate-[heroLine_900ms_ease_1080ms_both] bg-[#b1844a]" />
        </div>

        <div className="absolute right-8 bottom-32 z-10 hidden w-[230px] animate-[heroCardReveal_900ms_ease_1040ms_both] border border-[#f1ece4]/12 bg-[#0b0b0b]/55 p-6 shadow-2xl shadow-black/35 backdrop-blur-md transition duration-500 hover:-translate-y-1 lg:block xl:right-16">
          <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-full border border-[#f1ece4]/25 font-heading text-lg text-[#f1ece4]">
            O
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
            Obsidian System
          </p>

          <p className="mt-4 text-sm leading-7 text-[#eee7dd]/68">
            A refined uniform for discipline, strength, and intentional everyday
            presence.
          </p>

          <Link
            href="/collections"
            className="mt-6 inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7bea0]"
          >
            Discover →
          </Link>
        </div>
      </div>
    </section>
  );
}