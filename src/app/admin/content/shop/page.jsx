import { requireAdminAuth } from "../../../../lib/adminAuth";
import { getShopContent } from "../../../../lib/getCmsContent";
import ShopContentEditor from "../../../../components/admin/ShopContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminShopContentPage() {
  await requireAdminAuth();

  const shopContent = await getShopContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Shop
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Shop Page CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage the public Shop page heading, search and filter labels,
            product status text, empty state, dynamic metadata templates, and
            SEO from one workspace.
          </p>
        </div>

        <ShopContentEditor initialContent={shopContent} />
      </div>
    </main>
  );
}