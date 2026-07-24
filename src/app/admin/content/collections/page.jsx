import { requireAdminPermission } from "../../../../lib/adminAuth";
import { getCollectionsContent } from "../../../../lib/getCmsContent";
import CollectionsContentEditor from "../../../../components/admin/CollectionsContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsContentPage() {
  await requireAdminPermission({
    content: ["update"],
  });

  const collectionsContent = await getCollectionsContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Collections
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Collections Page CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage the public Collections page heading, collection card labels,
            visibility settings, empty state, and SEO from one workspace.
          </p>
        </div>

        <CollectionsContentEditor initialContent={collectionsContent} />
      </div>
    </main>
  );
}