import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export const metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: true,
  },
};

const SUGGESTIONS = [
  { href: "/shop", label: "Shop all products" },
  { href: "/collections", label: "Browse collections" },
  { href: "/track-order", label: "Track an order" },
  { href: "/contact", label: "Contact us" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-6 pt-36 pb-28 lg:px-10 lg:pt-44 lg:pb-36">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">
            Error 404
          </p>

          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-light leading-[0.95] sm:text-7xl">
            This page could not be found.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
            The link may be old or the piece may no longer be available.
            Everything else is still here.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-14 items-center justify-center bg-[#0b0b0b] px-8 text-xs uppercase tracking-[0.3em] text-[#f1ece4] transition hover:opacity-85"
            >
              Continue shopping
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-14 items-center justify-center border border-[#0b0b0b] px-8 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
            >
              Back to home
            </Link>
          </div>

          <ul className="mt-14 grid max-w-2xl gap-px border border-black/10 bg-black/10 sm:grid-cols-2">
            {SUGGESTIONS.map((item) => (
              <li key={item.href} className="bg-[#eee7dd]">
                <Link
                  href={item.href}
                  className="flex min-h-14 items-center justify-between px-5 text-sm transition hover:bg-[#e6ddd0]"
                >
                  {item.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
}
