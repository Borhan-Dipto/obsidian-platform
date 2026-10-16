/*
 * Private / transactional pages: useful to visitors, but they must
 * not appear in search results (no unique public content, and some
 * carry personal or order data). Each page gets its own canonical
 * instead of inheriting the homepage's.
 */
export const metadata = {
  title: "Checkout",
  description: "Complete your OBSIDIAN order securely.",

  alternates: {
    canonical: "/checkout",
  },

  robots: {
    index: false,
    follow: true,

    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function CheckoutLayout({ children }) {
  return children;
}
