import Link from "next/link";

import Footer from "../../../components/layout/Footer";
import Navbar from "../../../components/layout/Navbar";
import { getProductContent } from "../../../lib/getCmsContent";

function cleanText(
  value,
  fallback = ""
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  const cleanedValue =
    value
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return (
    cleanedValue ||
    fallback
  );
}

export default async function ProductNotFound() {
  const productPage =
    await getProductContent();

  const content =
    productPage?.content ||
    {};

  const buttonHref =
    cleanText(
      content
        .notFoundButtonHref,
      "/shop"
    );

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="flex min-h-[70vh] items-center justify-center px-6 pb-20 pt-32">
        <div className="max-w-2xl text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-neutral-500">
            {cleanText(
              content
                .notFoundEyebrow,
              "Product"
            )}
          </p>

          <h1 className="font-heading text-5xl font-light leading-none md:text-7xl">
            {cleanText(
              content
                .notFoundTitle,
              "Product not found."
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-neutral-600">
            {cleanText(
              content
                .notFoundDescription,

              "This piece may have been removed, renamed, or is no longer available in the current collection."
            )}
          </p>

          <Link
            href={buttonHref}
            className="mt-10 inline-flex border border-[#0b0b0b] px-8 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#0b0b0b] hover:text-[#f1ece4]"
          >
            {cleanText(
              content
                .notFoundButtonText,
              "Back To Shop"
            )}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
