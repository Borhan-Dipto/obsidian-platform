/*
 * Private / transactional pages: useful to visitors, but they must
 * not appear in search results (no unique public content, and some
 * carry personal or order data). Each page gets its own canonical
 * instead of inheriting the homepage's.
 */
export const metadata = {
  title: "My Account",
  description: "Sign in to your OBSIDIAN account to view orders, saved addresses and profile details.",

  alternates: {
    canonical: "/account",
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

export default function AccountLayout({ children }) {
  return children;
}
