export default function GlobalLoading() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f1ece4] text-[#0b0b0b]"
      aria-label="Loading page"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Navbar skeleton */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f1ece4]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <div className="h-6 w-40 obsidian-loading-pulse bg-black/10" />

          <div className="hidden items-center gap-10 lg:flex">
            <div className="h-3 w-16 obsidian-loading-pulse bg-black/10" />
            <div className="h-3 w-24 obsidian-loading-pulse bg-black/10" />
            <div className="h-3 w-24 obsidian-loading-pulse bg-black/10" />
            <div className="h-3 w-16 obsidian-loading-pulse bg-black/10" />
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <div className="h-3 w-20 obsidian-loading-pulse bg-black/10" />
            <div className="h-3 w-16 obsidian-loading-pulse bg-black/10" />
          </div>

          <div className="h-3 w-14 obsidian-loading-pulse bg-black/10 lg:hidden" />
        </div>
      </header>

      {/* Main loading layout */}
      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-4xl">
            <div className="h-3 w-24 obsidian-loading-pulse bg-black/10" />

            <div className="mt-7 space-y-4">
              <div className="h-16 w-full max-w-[680px] obsidian-loading-pulse bg-black/10 md:h-24" />
              <div className="h-16 w-4/5 max-w-[520px] obsidian-loading-pulse bg-black/10 md:h-24" />
            </div>

            <div className="mt-8 space-y-3">
              <div className="h-4 w-full max-w-[560px] obsidian-loading-pulse bg-black/10" />
              <div className="h-4 w-4/5 max-w-[470px] obsidian-loading-pulse bg-black/10" />
            </div>
          </div>

          <div className="mt-14 border-y border-black/10 py-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
              <div className="h-14 obsidian-loading-pulse bg-[#eee7dd]" />
              <div className="h-14 obsidian-loading-pulse bg-[#eee7dd]" />
              <div className="h-14 obsidian-loading-pulse bg-[#eee7dd]" />
              <div className="h-14 obsidian-loading-pulse bg-[#eee7dd]" />
              <div className="h-14 min-w-28 obsidian-loading-pulse bg-black/15" />
            </div>
          </div>

          {/* Product card skeletons */}
          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden border border-black/10 bg-[#eee7dd]"
              >
                <div className="aspect-[4/5] obsidian-loading-pulse bg-black/15" />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="h-3 w-28 obsidian-loading-pulse bg-black/10" />
                      <div className="mt-4 h-8 w-4/5 obsidian-loading-pulse bg-black/10" />
                    </div>

                    <div className="h-4 w-16 obsidian-loading-pulse bg-black/10" />
                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-5">
                    <div className="h-3 w-24 obsidian-loading-pulse bg-black/10" />
                    <div className="h-3 w-20 obsidian-loading-pulse bg-black/10" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-3">
            <span className="h-2 w-2 obsidian-loading-pulse rounded-full bg-[#0b0b0b]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-neutral-500">
              Loading Obsidian
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
