import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="flex min-h-[80vh] items-center px-6 pt-32 pb-20">
        <div className="container-custom mx-auto max-w-3xl text-center">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-neutral-500">
            Order Submitted
          </p>

          <h1 className="font-heading text-6xl font-light md:text-8xl">
            Thank You
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-neutral-700">
            Your order request has been prepared successfully.
          </p>

          <div className="mt-12 flex flex-col gap-4 md:flex-row md:justify-center">
            <Link
              href="/shop"
              className="border border-black px-8 py-4 text-xs uppercase tracking-[0.3em]"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="bg-black px-8 py-4 text-xs uppercase tracking-[0.3em] text-white"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}