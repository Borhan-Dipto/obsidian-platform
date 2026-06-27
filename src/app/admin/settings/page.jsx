import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
      <div className="container-custom">
        <div className="mb-14 flex items-center justify-between">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Settings
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Settings
            </h1>
          </div>

          <Link
            href="/admin"
            className="border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        <div className="max-w-3xl space-y-6">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              WhatsApp Number
            </label>

            <input
              type="text"
              defaultValue="+8801XXXXXXXXX"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Store Email
            </label>

            <input
              type="email"
              defaultValue="hello@obsidianwear.com"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Store Location
            </label>

            <input
              type="text"
              defaultValue="Dhaka, Bangladesh"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500">
              Currency
            </label>

            <input
              type="text"
              defaultValue="BDT"
              className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none"
            />
          </div>

          <button className="mt-6 bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.3em] text-[#0b0b0b] transition hover:opacity-80">
            Save Settings
          </button>
        </div>
      </div>
    </main>
  );
}