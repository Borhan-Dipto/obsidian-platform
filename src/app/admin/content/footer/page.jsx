import { requireAdminAuth } from "../../../../lib/adminAuth";
import { getFooterContent } from "../../../../lib/getCmsContent";
import FooterContentEditor from "../../../../components/admin/FooterContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminFooterContentPage() {
  await requireAdminAuth();

  const footerContent = await getFooterContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Footer
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Footer CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage footer branding, navigation columns, newsletter content,
            social platform visibility, contact details, legal links, and
            copyright settings from one workspace.
          </p>
        </div>

        <FooterContentEditor initialContent={footerContent} />
      </div>
    </main>
  );
}