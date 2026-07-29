import {
  requireAdminPermission,
} from "../../../../lib/adminAuth";

import {
  getSizeGuideContent,
} from "../../../../lib/getCmsContent";

import SizeGuideContentEditor from "../../../../components/admin/SizeGuideContentEditor";

export const dynamic =
  "force-dynamic";

export default async function AdminSizeGuideContentPage() {
  await requireAdminPermission({
    content: [
      "update",
    ],
  });

  const sizeGuideContent =
    await getSizeGuideContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Size Guide
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Size Guide CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage the OBSIDIAN size chart, S–XXXL visibility, inch and
            centimetre measurements, fit guidance, standalone page content,
            product-page chart content, accessibility labels, and SEO.
          </p>
        </div>

        <SizeGuideContentEditor
          initialContent={
            sizeGuideContent
          }
        />
      </div>
    </main>
  );
}
