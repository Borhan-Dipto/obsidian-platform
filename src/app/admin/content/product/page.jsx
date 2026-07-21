import { requireAdminAuth } from "../../../../lib/adminAuth";
import { getProductContent } from "../../../../lib/getCmsContent";
import ProductContentEditor from "../../../../components/admin/ProductContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminProductContentPage() {
  await requireAdminAuth();

  const productContent = await getProductContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Product
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Product Page CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage reusable Product page labels, fallback content, feature
            highlights, delivery and exchange information, missing product
            content, dynamic metadata templates, and SEO from one workspace.
          </p>
        </div>

        <ProductContentEditor initialContent={productContent} />
      </div>
    </main>
  );
}