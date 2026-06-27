import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-24">
        <div className="container-custom max-w-5xl">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            About Obsidian
          </p>

          <h1 className="font-heading text-6xl font-light leading-none md:text-8xl">
            Built Under Pressure.
            <br />
            Finished With Precision.
          </h1>

          <p className="mt-12 max-w-3xl text-xl leading-10 text-neutral-700">
            Obsidian is a modern essentials brand inspired by resilience,
            craftsmanship, and timeless design. We create garments that feel
            intentional, enduring, and quietly confident.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="container-custom grid gap-16 md:grid-cols-2">
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Our Philosophy
            </p>

            <h2 className="font-heading text-5xl font-light md:text-6xl">
              Substance
              <br />
              Over Noise
            </h2>
          </div>

          <div>
            <p className="text-lg leading-9 text-neutral-700">
              We believe true character is formed slowly. Not through trends,
              but through pressure, patience, and purpose. Every collection is
              designed to reflect those values through materials, silhouettes,
              and visual storytelling.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0b0b0b] px-6 py-24 text-[#f1ece4]">
        <div className="container-custom max-w-4xl">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Why Obsidian
          </p>

          <h2 className="font-heading text-5xl font-light md:text-7xl">
            Formed By Nature.
            <br />
            Refined By Pressure.
          </h2>

          <p className="mt-10 max-w-3xl text-lg leading-9 text-neutral-300">
            Obsidian is a volcanic glass created under intense heat and pressure.
            That idea sits at the heart of our brand. We believe meaningful
            things are forged, not manufactured. Every piece carries that
            philosophy forward.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="container-custom max-w-4xl">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Origin
          </p>

          <h2 className="font-heading text-5xl font-light">
            Designed In Bangladesh
          </h2>

          <p className="mt-10 text-lg leading-9 text-neutral-700">
            Obsidian was founded with a simple idea: create garments that feel
            premium, intentional, and timeless. Rooted in Bangladesh’s deep
            manufacturing heritage, we aim to combine thoughtful design with
            quality craftsmanship.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}