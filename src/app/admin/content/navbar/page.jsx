import { requireAdminPermission } from "../../../../lib/adminAuth";
import { getNavbarContent } from "../../../../lib/getCmsContent";
import NavbarContentEditor from "../../../../components/admin/NavbarContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminNavbarContentPage() {
  await requireAdminPermission({
    content: ["update"],
  });

  const navbarContent = await getNavbarContent();

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-[#f1ece4] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-neutral-500">
            Content / Navbar
          </p>

          <h1 className="font-heading text-5xl font-light md:text-7xl">
            Navbar CMS
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-400">
            Manage navbar branding, navigation links, desktop and mobile
            controls, utility actions, and announcement content from one
            workspace.
          </p>
        </div>

        <NavbarContentEditor initialContent={navbarContent} />
      </div>
    </main>
  );
}