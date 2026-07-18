import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

type SuccessPageProps = {
  searchParams?: Promise<{
    orderId?: string;
  }>;
};

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams?.orderId;

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
            Your order has been received. We will confirm it manually through
            WhatsApp or phone.
          </p>

          {orderId && (
            <div className="mx-auto mt-10 max-w-md border border-black/10 bg-[#eee7dd] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                Tracking ID
              </p>

              <p className="mt-4 font-heading text-4xl font-light">
                {orderId}
              </p>

              <p className="mt-4 text-sm leading-7 text-neutral-600">
                Save this ID to track your order status later.
              </p>
            </div>
          )}

          <div className="mt-12 flex flex-col gap-4 md:flex-row md:justify-center">
            <Link
              href="/shop"
              className="border border-black px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="bg-black px-8 py-4 text-xs uppercase tracking-[0.3em] text-white transition hover:opacity-85"
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