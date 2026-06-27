export default function BrandStory() {
  return (
    <section className="bg-[#0b0b0b] px-6 py-32 text-[#f1ece4]">
      <div className="container-custom grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-8 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Our Philosophy
          </p>

          <h2 className="font-heading text-5xl leading-tight font-light md:text-7xl">
            Formed By Nature.
            <br />
            Designed With Intent.
          </h2>
        </div>

        <div>
          <p className="max-w-xl text-lg leading-9 text-neutral-300">
            Obsidian was created for those who value substance over noise. Every
            piece is inspired by pressure, precision, and the belief that true
            character is formed slowly, deliberately, and with purpose.
          </p>

          <p className="mt-8 max-w-xl text-lg leading-9 text-neutral-400">
            Built under pressure. Finished with precision.
          </p>
        </div>
      </div>
    </section>
  );
}