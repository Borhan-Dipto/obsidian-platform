import Reveal from "../ui/Reveal";

export default function BrandStory() {
  return (
    <section className="obsidian-dark-panel relative overflow-hidden px-6 py-32 text-[#f1ece4] lg:py-40">
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f1ece4_1px,transparent_1px),linear-gradient(#f1ece4_1px,transparent_1px)] bg-[size:96px_96px]" />
      </div>

      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#b1844a]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-[28rem] w-[28rem] rounded-full bg-[#f1ece4]/4 blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.52fr_0.48fr] lg:items-end">
          <Reveal>
            <div className="mb-8 flex items-center gap-4">
              <span className="h-px w-8 bg-[#b1844a]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#f1ece4]/45">
                Our Direction
              </p>
            </div>

            <h2 className="font-heading max-w-5xl text-[4rem] font-light leading-[0.9] tracking-[-0.055em] text-[#f1ece4] sm:text-[5.6rem] lg:text-[7.3rem]">
              Starting with
              <br />
              T-shirts.
              <br />
              Building a
              <br />
              fashion label.
            </h2>
          </Reveal>

          <Reveal delay={160} className="max-w-2xl lg:pb-4">
            <p className="text-lg leading-9 text-[#eee7dd]/70">
              Obsidian begins with graphic and oversized T-shirts, but the
              vision is bigger than one product. We are building a fashion brand
              around dark essentials, structured silhouettes, and quiet visual
              strength.
            </p>

            <p className="mt-8 text-lg leading-9 text-[#eee7dd]/50">
              As the brand grows, Obsidian can expand into shirts, polos,
              hoodies, jackets, pants, accessories, and future seasonal
              collections — all under one consistent identity system.
            </p>
          </Reveal>
        </div>

        <div className="mt-24 grid grid-cols-1 border-y border-[#f1ece4]/10 md:grid-cols-3">
          <Reveal
            delay={120}
            className="border-b border-[#f1ece4]/10 py-10 md:border-b-0 md:border-r md:pr-10"
          >
            <p className="font-heading text-4xl font-light text-[#b1844a]">
              01
            </p>

            <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]">
              Launch Product
            </h3>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#eee7dd]/55">
              We start focused with T-shirts — oversized fits, graphic drops,
              washed textures, and everyday wearable essentials.
            </p>
          </Reveal>

          <Reveal
            delay={240}
            className="border-b border-[#f1ece4]/10 py-10 md:border-b-0 md:border-r md:px-10"
          >
            <p className="font-heading text-4xl font-light text-[#b1844a]">
              02
            </p>

            <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]">
              Brand Expansion
            </h3>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#eee7dd]/55">
              The platform is ready for more fashion items — from shirts and
              hoodies to pants, accessories, and complete outfit categories.
            </p>
          </Reveal>

          <Reveal delay={360} className="py-10 md:pl-10">
            <p className="font-heading text-4xl font-light text-[#b1844a]">
              03
            </p>

            <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f1ece4]">
              Future Collections
            </h3>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#eee7dd]/55">
              Every new product line can be released through curated drops,
              collection stories, and the same OBSIDIAN visual language.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220} className="mt-20">
          <div className="grid grid-cols-1 border border-[#f1ece4]/10 md:grid-cols-[0.42fr_0.58fr]">
            <div className="border-b border-[#f1ece4]/10 bg-[#f1ece4]/[0.03] p-8 md:border-b-0 md:border-r lg:p-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#b1844a]">
                Fashion System
              </p>

              <h3 className="mt-8 font-heading text-[3.2rem] font-light leading-[0.9] tracking-[-0.045em] text-[#f1ece4] sm:text-[4.5rem]">
                One brand.
                <br />
                Many future
                <br />
                categories.
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="border-b border-[#f1ece4]/10 p-8 sm:border-r lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                  T-Shirts
                </p>
                <p className="mt-5 text-sm leading-7 text-[#eee7dd]/55">
                  The first product line — oversized, graphic, minimal, and
                  built around the core OBSIDIAN identity.
                </p>
              </div>

              <div className="border-b border-[#f1ece4]/10 p-8 lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                  Tops
                </p>
                <p className="mt-5 text-sm leading-7 text-[#eee7dd]/55">
                  Future shirts, polos, long sleeves, hoodies, and outerwear can
                  be added as the brand grows.
                </p>
              </div>

              <div className="border-b border-[#f1ece4]/10 p-8 sm:border-b-0 sm:border-r lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                  Bottoms
                </p>
                <p className="mt-5 text-sm leading-7 text-[#eee7dd]/55">
                  Pants, cargos, shorts, and everyday bottomwear can become part
                  of future OBSIDIAN drops.
                </p>
              </div>

              <div className="p-8 lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f1ece4]">
                  Accessories
                </p>
                <p className="mt-5 text-sm leading-7 text-[#eee7dd]/55">
                  Caps, bags, small goods, and lifestyle pieces can complete the
                  fashion ecosystem later.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}