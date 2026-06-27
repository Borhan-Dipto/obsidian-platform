export default function Footer() {
  return (
    <footer className="bg-[#0b0b0b] px-6 py-16 text-[#f1ece4] md:py-20">
      <div className="container-custom">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <h2 className="text-3xl font-light tracking-[0.3em]">OBSIDIAN</h2>

            <p className="mt-6 max-w-xs text-sm leading-7 text-neutral-400">
              Built under pressure. Finished with precision.
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Shop
            </h3>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li><a href="/shop" className="transition hover:text-white">All Products</a></li>
              <li><a href="/shop" className="transition hover:text-white">T-Shirts</a></li>
              <li><a href="/collections/artifact" className="transition hover:text-white">Collections</a></li>
              <li><a href="/shop" className="transition hover:text-white">New Drop</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Company
            </h3>

            <ul className="space-y-3 text-sm text-neutral-300">
              <li><a href="/about" className="transition hover:text-white">About</a></li>
              <li><a href="/journal" className="transition hover:text-white">Journal</a></li>
              <li><a href="/contact" className="transition hover:text-white">Contact</a></li>
              <li><a href="/size-guide" className="transition hover:text-white">Size Guide</a></li>
            </ul>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="mb-5 text-xs uppercase tracking-[0.35em] text-neutral-500">
              Stay In Touch
            </h3>

            <p className="mb-6 max-w-sm text-sm leading-7 text-neutral-400">
              Join the Obsidian community for future drops and stories.
            </p>

            <div className="flex border border-white/20">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600"
              />

              <button className="border-l border-white/20 px-4 text-xs uppercase tracking-[0.25em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.22em] text-neutral-600 md:mt-16 md:text-xs md:tracking-[0.25em]">
          © 2026 Obsidian. All rights reserved.
        </div>
      </div>
    </footer>
  );
}