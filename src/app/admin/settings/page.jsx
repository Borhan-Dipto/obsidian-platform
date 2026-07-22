import { requireAdminAuth } from "../../../lib/adminAuth";
import {
  getSettings,
  serializeSettings,
} from "../../../lib/settings";
import SettingsEditor from "../../../components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminAuth();

  const settings = await getSettings();

  return (
    <SettingsEditor
      initialSettings={serializeSettings(settings)}
    />
  );
}