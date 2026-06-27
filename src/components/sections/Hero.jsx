import Image from "next/image";

export default function Hero() {
  return (
    <section className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <div className="container-custom grid min-h-screen grid-cols-1 items-center gap-14 px-6 pt-28 pb-16 md:grid-cols-[0.95fr_1.05fr] md:pt-32 md:pb-20">
        <div>
          <p className="mb-8 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Built Under Pressure
          </p>

          <h1 className="font-heading text-6xl leading-none font-light sm:text-7xl md:text-[8.5rem]">
            OBSIDIAN
          </h1>

          <p className="mt-8 max-w-lg text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
            Finished with precision. Designed for those who move with quiet
            confidence and value timeless essentials over trends.
          </p>

          <button className="mt-10 border border-[#0b0b0b] px-7 py-3.5 text-xs uppercase tracking-[0.28em] transition-all duration-300 hover:bg-[#0b0b0b] hover:text-[#f1ece4]">
            View The Collection
          </button>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0b0b0b] sm:aspect-[3/4] md:aspect-[4/5] lg:h-[660px]">
          <Image
            src="/images/hero1.jpeg"
            alt="Obsidian Artifact Series T-shirt"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="scale-110 object-cover object-[38%_50%]"
          />
        </div>
      </div>
    </section>
  );
}