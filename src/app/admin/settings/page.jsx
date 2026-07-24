import {
  hasAdminPermission,
  requireAnyAdminPermission,
} from "../../../lib/adminAuth";
import {
  getSettings,
  serializeSettings,
} from "../../../lib/settings";
import {
  getNotificationProviderStatus,
  getNotificationSettings,
  serializeNotificationSettings,
} from "../../../lib/notificationSettings";
import PermissionAwareSettingsEditor from "../../../components/admin/PermissionAwareSettingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAnyAdminPermission(
    [
      {
        settings: ["read"],
      },
      {
        notifications: ["read"],
      },
    ],
    {
      path: "/admin/settings",
    }
  );

  const [
    canReadSettings,
    canUpdateSettings,
    canReadNotifications,
    canUpdateNotifications,
    canUploadMedia,
  ] = await Promise.all([
    hasAdminPermission({
      settings: ["read"],
    }),

    hasAdminPermission({
      settings: ["update"],
    }),

    hasAdminPermission({
      notifications: ["read"],
    }),

    hasAdminPermission({
      notifications: ["update"],
    }),

    hasAdminPermission({
      media: ["upload"],
    }),
  ]);

  const [
    settings,
    notificationSettings,
  ] = await Promise.all([
    canReadSettings
      ? getSettings()
      : Promise.resolve(null),

    canReadNotifications
      ? getNotificationSettings()
      : Promise.resolve(null),
  ]);

  return (
    <PermissionAwareSettingsEditor
      initialSettings={
        canReadSettings
          ? serializeSettings(settings)
          : null
      }
      initialNotificationSettings={
        canReadNotifications
          ? serializeNotificationSettings(
              notificationSettings
            )
          : null
      }
      initialNotificationProviders={
        canReadNotifications
          ? getNotificationProviderStatus()
          : null
      }
      canReadSettings={canReadSettings}
      canUpdateSettings={
        canReadSettings &&
        canUpdateSettings
      }
      canReadNotifications={
        canReadNotifications
      }
      canUpdateNotifications={
        canReadNotifications &&
        canUpdateNotifications
      }
      canUploadMedia={
        canReadSettings &&
        canUpdateSettings &&
        canUploadMedia
      }
    />
  );
}