import Link from "next/link";
import SettingsEditor from "./SettingsEditor";

function normalizeText(
  value,
  fallback = "Not configured"
) {
  if (Array.isArray(value)) {
    const entries = value
      .map((entry) =>
        String(entry || "").trim()
      )
      .filter(Boolean);

    return entries.length > 0
      ? entries.join(", ")
      : fallback;
  }

  const normalizedValue = String(
    value ?? ""
  ).trim();

  return normalizedValue || fallback;
}

function formatBoolean(value) {
  return value === true
    ? "Enabled"
    : "Disabled";
}

function formatMoney(
  value,
  currency = "BDT"
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `0 ${currency}`;
  }

  return `${amount.toLocaleString(
    "en-BD"
  )} ${currency}`;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 px-6 py-5 sm:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
          {eyebrow}
        </p>

        <h2 className="mt-3 font-heading text-3xl font-light sm:text-4xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="p-6 sm:p-8">
        {children}
      </div>
    </section>
  );
}

function InformationGrid({
  children,
}) {
  return (
    <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
      {children}
    </div>
  );
}

function InformationField({
  label,
  value,
  className = "",
  preserveWhitespace = false,
}) {
  return (
    <div
      className={`bg-[#0e0e0e] p-5 sm:p-6 ${className}`}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-600">
        {label}
      </p>

      <p
        className={`mt-3 break-words text-sm leading-7 text-neutral-300 ${
          preserveWhitespace
            ? "whitespace-pre-line"
            : ""
        }`}
      >
        {normalizeText(value)}
      </p>
    </div>
  );
}

function StatusBadge({
  enabled,
}) {
  return (
    <span
      className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
        enabled
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.03] text-neutral-500"
      }`}
    >
      {enabled
        ? "Enabled"
        : "Disabled"}
    </span>
  );
}

function ProviderCard({
  title,
  provider,
  configured,
}) {
  return (
    <article className="border border-white/10 bg-[#0e0e0e] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#f1ece4]">
            {title}
          </p>

          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-neutral-600">
            {normalizeText(
              provider
            )}
          </p>
        </div>

        <StatusBadge
          enabled={
            configured === true
          }
        />
      </div>
    </article>
  );
}

function StoreSettingsSummary({
  settings,
}) {
  const storeSettings =
    settings &&
    typeof settings === "object"
      ? settings
      : {};

  const currency =
    normalizeText(
      storeSettings.store?.currency,
      "BDT"
    );

  return (
    <div className="space-y-8">
      <Section
        eyebrow="Store Configuration"
        title="Identity & Contact"
        description="Store identity and public communication details are visible in read-only mode."
      >
        <InformationGrid>
          <InformationField
            label="Store Name"
            value={
              storeSettings.store?.name
            }
          />

          <InformationField
            label="Currency"
            value={currency}
          />

          <InformationField
            label="Brand Tagline"
            value={
              storeSettings.store
                ?.tagline
            }
            className="sm:col-span-2"
          />

          <InformationField
            label="WhatsApp"
            value={
              storeSettings.contact
                ?.whatsappNumber
            }
          />

          <InformationField
            label="Phone"
            value={
              storeSettings.contact
                ?.phone
            }
          />

          <InformationField
            label="Email"
            value={
              storeSettings.contact
                ?.email
            }
          />

          <InformationField
            label="Location"
            value={
              storeSettings.contact
                ?.location
            }
          />
        </InformationGrid>
      </Section>

      <Section
        eyebrow="Public Presence"
        title="Social Profiles"
      >
        <InformationGrid>
          <InformationField
            label="Facebook"
            value={
              storeSettings.social
                ?.facebookUrl
            }
          />

          <InformationField
            label="Instagram"
            value={
              storeSettings.social
                ?.instagramUrl
            }
          />

          <InformationField
            label="TikTok"
            value={
              storeSettings.social
                ?.tiktokUrl
            }
          />

          <InformationField
            label="YouTube"
            value={
              storeSettings.social
                ?.youtubeUrl
            }
          />
        </InformationGrid>
      </Section>

      <Section
        eyebrow="Commerce Rules"
        title="Delivery & Payment"
      >
        <InformationGrid>
          <InformationField
            label="Inside Dhaka Delivery"
            value={formatMoney(
              storeSettings.delivery
                ?.insideDhaka,
              currency
            )}
          />

          <InformationField
            label="Outside Dhaka Delivery"
            value={formatMoney(
              storeSettings.delivery
                ?.outsideDhaka,
              currency
            )}
          />

          <InformationField
            label="Free Shipping Over"
            value={formatMoney(
              storeSettings.delivery
                ?.freeShippingOver,
              currency
            )}
          />

          <InformationField
            label="Cash on Delivery"
            value={formatBoolean(
              storeSettings.payment
                ?.cashOnDelivery
            )}
          />

          <InformationField
            label="bKash"
            value={formatBoolean(
              storeSettings.payment
                ?.bkash
            )}
          />

          <InformationField
            label="Nagad"
            value={formatBoolean(
              storeSettings.payment
                ?.nagad
            )}
          />

          <InformationField
            label="Rocket"
            value={formatBoolean(
              storeSettings.payment
                ?.rocket
            )}
          />

          <InformationField
            label="Last Updated"
            value={formatDate(
              storeSettings.updatedAt
            )}
          />
        </InformationGrid>
      </Section>

      <Section
        eyebrow="Search & Sharing"
        title="Global SEO"
      >
        <InformationGrid>
          <InformationField
            label="SEO Title"
            value={
              storeSettings.seo?.title
            }
            className="sm:col-span-2"
          />

          <InformationField
            label="SEO Description"
            value={
              storeSettings.seo
                ?.description
            }
            className="sm:col-span-2"
            preserveWhitespace
          />

          <InformationField
            label="SEO Keywords"
            value={
              storeSettings.seo
                ?.keywords
            }
            className="sm:col-span-2"
            preserveWhitespace
          />

          <InformationField
            label="Open Graph Image"
            value={
              storeSettings.seo
                ?.ogImage
            }
            className="sm:col-span-2"
          />
        </InformationGrid>
      </Section>
    </div>
  );
}

function ChannelSummary({
  title,
  channel,
  provider,
  type,
}) {
  const settings =
    channel &&
    typeof channel === "object"
      ? channel
      : {};

  return (
    <Section
      eyebrow="Notification Channel"
      title={title}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#0e0e0e] p-5">
        <div>
          <p className="text-sm text-neutral-300">
            Channel Status
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-600">
            {normalizeText(
              provider?.provider
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            enabled={
              settings.enabled === true
            }
          />

          <span
            className={`inline-flex border px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
              provider?.configured ===
              true
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            }`}
          >
            {provider?.configured ===
            true
              ? "Provider Ready"
              : "Provider Not Ready"}
          </span>
        </div>
      </div>

      <InformationGrid>
        <InformationField
          label="Customer Order Placed"
          value={formatBoolean(
            settings.customerOrderPlaced
          )}
        />

        <InformationField
          label="Admin Order Placed"
          value={formatBoolean(
            settings.adminOrderPlaced
          )}
        />

        <InformationField
          label="Customer Status Updates"
          value={formatBoolean(
            settings.customerStatusUpdates
          )}
        />

        <InformationField
          label="Admin Recipients"
          value={
            settings.adminRecipients
          }
          preserveWhitespace
        />

        {type === "email" ? (
          <>
            <InformationField
              label="Reply-To"
              value={
                settings.replyTo
              }
            />

            <InformationField
              label="Customer Order Subject"
              value={
                settings.orderPlacedSubject
              }
            />

            <InformationField
              label="Admin Order Subject"
              value={
                settings.adminOrderPlacedSubject
              }
            />

            <InformationField
              label="Status Update Subject"
              value={
                settings.statusUpdateSubject
              }
            />
          </>
        ) : null}

        {type === "whatsapp" ? (
          <>
            <InformationField
              label="Language Code"
              value={
                settings.languageCode
              }
            />

            <InformationField
              label="Customer Order Template"
              value={
                settings.templates
                  ?.orderPlaced
              }
            />

            <InformationField
              label="Admin Order Template"
              value={
                settings.templates
                  ?.adminOrderPlaced
              }
            />

            <InformationField
              label="Status Update Template"
              value={
                settings.templates
                  ?.statusUpdate
              }
            />
          </>
        ) : null}

        {type !== "whatsapp" ? (
          <>
            <InformationField
              label="Customer Order Message"
              value={
                settings.orderPlacedMessage
              }
              className="sm:col-span-2"
              preserveWhitespace
            />

            <InformationField
              label="Admin Order Message"
              value={
                settings.adminOrderPlacedMessage
              }
              className="sm:col-span-2"
              preserveWhitespace
            />

            <InformationField
              label="Status Update Message"
              value={
                settings.statusUpdateMessage
              }
              className="sm:col-span-2"
              preserveWhitespace
            />
          </>
        ) : null}
      </InformationGrid>
    </Section>
  );
}

function NotificationSettingsSummary({
  settings,
  providers,
}) {
  const notificationSettings =
    settings &&
    typeof settings === "object"
      ? settings
      : {};

  const providerStatus =
    providers &&
    typeof providers === "object"
      ? providers
      : {};

  const statusEvents =
    notificationSettings.statusEvents ||
    {};

  return (
    <div className="space-y-8">
      <Section
        eyebrow="Automatic Communication"
        title="Provider Status"
        description="Credentials remain protected in environment variables. Only readiness is shown here."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ProviderCard
            title="Email"
            provider={
              providerStatus.email
                ?.provider
            }
            configured={
              providerStatus.email
                ?.configured
            }
          />

          <ProviderCard
            title="SMS"
            provider={
              providerStatus.sms
                ?.provider
            }
            configured={
              providerStatus.sms
                ?.configured
            }
          />

          <ProviderCard
            title="WhatsApp"
            provider={
              providerStatus.whatsapp
                ?.provider
            }
            configured={
              providerStatus.whatsapp
                ?.configured
            }
          />
        </div>
      </Section>

      <ChannelSummary
        title="Email Notifications"
        channel={
          notificationSettings.email
        }
        provider={
          providerStatus.email
        }
        type="email"
      />

      <ChannelSummary
        title="SMS Notifications"
        channel={
          notificationSettings.sms
        }
        provider={
          providerStatus.sms
        }
        type="sms"
      />

      <ChannelSummary
        title="WhatsApp Notifications"
        channel={
          notificationSettings
            .whatsapp
        }
        provider={
          providerStatus.whatsapp
        }
        type="whatsapp"
      />

      <Section
        eyebrow="Status Automation"
        title="Notification Events"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [
              "confirmed",
              "Confirmed",
            ],
            [
              "processing",
              "Processing",
            ],
            [
              "packed",
              "Packed",
            ],
            [
              "shipped",
              "Shipped",
            ],
            [
              "delivered",
              "Delivered",
            ],
            [
              "cancelled",
              "Cancelled",
            ],
          ].map(
            ([
              field,
              label,
            ]) => (
              <div
                key={field}
                className="flex items-center justify-between gap-4 border border-white/10 bg-[#0e0e0e] p-4"
              >
                <span className="text-sm text-neutral-300">
                  {label}
                </span>

                <StatusBadge
                  enabled={
                    statusEvents[
                      field
                    ] === true
                  }
                />
              </div>
            )
          )}
        </div>

        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-neutral-600">
          Last updated{" "}
          {formatDate(
            notificationSettings.updatedAt
          )}
        </p>
      </Section>
    </div>
  );
}

export default function PermissionAwareSettingsEditor({
  initialSettings,
  initialNotificationSettings,
  initialNotificationProviders,
  canReadSettings = false,
  canUpdateSettings = false,
  canReadNotifications = false,
  canUpdateNotifications = false,
  canUploadMedia = false,
}) {
  const canUseFullEditor =
    canReadSettings &&
    canUpdateSettings &&
    canReadNotifications &&
    canUpdateNotifications &&
    canUploadMedia;

  if (canUseFullEditor) {
    return (
      <SettingsEditor
        initialSettings={
          initialSettings
        }
        initialNotificationSettings={
          initialNotificationSettings
        }
        initialNotificationProviders={
          initialNotificationProviders
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-[#f1ece4] sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
                Admin / Settings
              </p>

              <h1 className="font-heading text-5xl font-light md:text-7xl">
                Settings
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-400">
                Your role can review
                the settings shown
                below. Editing and
                upload controls remain
                hidden unless every
                required management
                permission is
                available.
              </p>
            </div>

            <Link
              href="/admin"
              className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back to Admin
            </Link>
          </div>

          <div className="mt-7 inline-flex border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.22em] text-neutral-400">
            Read-only access
          </div>
        </header>

        <div className="space-y-10">
          {canReadSettings ? (
            <StoreSettingsSummary
              settings={
                initialSettings
              }
            />
          ) : null}

          {canReadSettings &&
          canReadNotifications ? (
            <div className="border-t border-white/10" />
          ) : null}

          {canReadNotifications ? (
            <NotificationSettingsSummary
              settings={
                initialNotificationSettings
              }
              providers={
                initialNotificationProviders
              }
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}