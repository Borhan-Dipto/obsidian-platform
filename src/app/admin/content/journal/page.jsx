import { requireAdminPermission } from "../../../../lib/adminAuth";
import { getJournalContent } from "../../../../lib/getCmsContent";
import JournalContentEditor from "../../../../components/admin/JournalContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminJournalContentPage() {
  await requireAdminPermission({
    content: ["update"],
  });

  const journalContent = await getJournalContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Journal
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Journal CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage Journal page content, stories, display order, visibility,
            call-to-action content, and SEO from one workspace.
          </p>
        </div>

        <JournalContentEditor initialContent={journalContent} />
      </div>
    </main>
  );
}