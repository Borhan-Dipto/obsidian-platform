"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const defaultFormData = {
  store: {
    name: "OBSIDIAN",
    tagline: "Built under pressure. Finished with precision.",
    currency: "BDT",
  },
  contact: {
    whatsappNumber: "8801814455199",
    email: "",
    location: "",
    phone: "",
  },
  social: {
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
  },
  delivery: {
    insideDhaka: "0",
    outsideDhaka: "0",
    freeShippingOver: "0",
  },
  seo: {
    title: "",
    description: "",
    keywords: "",
    ogImage: "",
  },
  homepage: {
    heroEyebrow: "",
    heroTitle: "",
    heroSubtitle: "",
    primaryCtaText: "",
    primaryCtaHref: "",
    secondaryCtaText: "",
    secondaryCtaHref: "",
  },
  payment: {
    cashOnDelivery: true,
    bkash: false,
    nagad: false,
    rocket: false,
  },
};

function normalizeSettings(settings = {}) {
  return {
    store: {
      name: settings.store?.name || "OBSIDIAN",
      tagline:
        settings.store?.tagline ||
        "Built under pressure. Finished with precision.",
      currency: settings.store?.currency || "BDT",
    },
    contact: {
      whatsappNumber: settings.contact?.whatsappNumber || "8801814455199",
      email: settings.contact?.email || "",
      location: settings.contact?.location || "",
      phone: settings.contact?.phone || "",
    },
    social: {
      facebookUrl: settings.social?.facebookUrl || "",
      instagramUrl: settings.social?.instagramUrl || "",
      tiktokUrl: settings.social?.tiktokUrl || "",
      youtubeUrl: settings.social?.youtubeUrl || "",
    },
    delivery: {
      insideDhaka: String(settings.delivery?.insideDhaka ?? 0),
      outsideDhaka: String(settings.delivery?.outsideDhaka ?? 0),
      freeShippingOver: String(settings.delivery?.freeShippingOver ?? 0),
    },
    seo: {
      title: settings.seo?.title || "",
      description: settings.seo?.description || "",
      keywords: settings.seo?.keywords || "",
      ogImage: settings.seo?.ogImage || "",
    },
    homepage: {
      heroEyebrow: settings.homepage?.heroEyebrow || "",
      heroTitle: settings.homepage?.heroTitle || "",
      heroSubtitle: settings.homepage?.heroSubtitle || "",
      primaryCtaText: settings.homepage?.primaryCtaText || "",
      primaryCtaHref: settings.homepage?.primaryCtaHref || "",
      secondaryCtaText: settings.homepage?.secondaryCtaText || "",
      secondaryCtaHref: settings.homepage?.secondaryCtaHref || "",
    },
    payment: {
      cashOnDelivery: Boolean(settings.payment?.cashOnDelivery),
      bkash: Boolean(settings.payment?.bkash),
      nagad: Boolean(settings.payment?.nagad),
      rocket: Boolean(settings.payment?.rocket),
    },
  };
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
    />
  );
}

function Textarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-none border border-white/10 bg-white/5 px-5 py-4 leading-7 outline-none placeholder:text-neutral-600"
    />
  );
}

function Section({ title, children }) {
  return (
    <section className="border border-white/10 bg-white/[0.03] p-7 md:p-9">
      <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
        {title}
      </p>

      {children}
    </section>
  );
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setFormData(normalizeSettings(data.settings));
        } else {
          setMessage(data.message || "Settings could not be loaded.");
        }
      } catch {
        setMessage("Something went wrong while loading settings.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(section, field, value) {
    setMessage("");

    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function handleCheckboxChange(section, field, checked) {
    setMessage("");

    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: checked,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("Saving settings...");

    try {
      const payload = {
        type: "store",

        store: {
          name: formData.store.name.trim() || "OBSIDIAN",
          tagline:
            formData.store.tagline.trim() ||
            "Built under pressure. Finished with precision.",
          currency: formData.store.currency.trim() || "BDT",
        },

        contact: {
          whatsappNumber:
            formData.contact.whatsappNumber.trim() || "8801814455199",
          email: formData.contact.email.trim(),
          location: formData.contact.location.trim(),
          phone: formData.contact.phone.trim(),
        },

        social: {
          facebookUrl: formData.social.facebookUrl.trim(),
          instagramUrl: formData.social.instagramUrl.trim(),
          tiktokUrl: formData.social.tiktokUrl.trim(),
          youtubeUrl: formData.social.youtubeUrl.trim(),
        },

        delivery: {
          insideDhaka: Number(formData.delivery.insideDhaka || 0),
          outsideDhaka: Number(formData.delivery.outsideDhaka || 0),
          freeShippingOver: Number(formData.delivery.freeShippingOver || 0),
        },

        seo: {
          title: formData.seo.title.trim(),
          description: formData.seo.description.trim(),
          keywords: formData.seo.keywords.trim(),
          ogImage: formData.seo.ogImage.trim(),
        },

        homepage: {
          heroEyebrow: formData.homepage.heroEyebrow.trim(),
          heroTitle: formData.homepage.heroTitle.trim(),
          heroSubtitle: formData.homepage.heroSubtitle.trim(),
          primaryCtaText: formData.homepage.primaryCtaText.trim(),
          primaryCtaHref: formData.homepage.primaryCtaHref.trim(),
          secondaryCtaText: formData.homepage.secondaryCtaText.trim(),
          secondaryCtaHref: formData.homepage.secondaryCtaHref.trim(),
        },

        payment: {
          cashOnDelivery: Boolean(formData.payment.cashOnDelivery),
          bkash: Boolean(formData.payment.bkash),
          nagad: Boolean(formData.payment.nagad),
          rocket: Boolean(formData.payment.rocket),
        },
      };

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Settings could not be saved.");
        return;
      }

      setFormData(normalizeSettings(data.settings));
      setMessage("Settings saved successfully.");
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch {
      setMessage("Something went wrong while saving settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="mx-auto max-w-5xl">
          <p className="text-neutral-400">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Settings
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Settings
            </h1>
          </div>

          <Link
            href="/admin"
            className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        {message ? (
          <div className="mb-6 border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
            {message}
            {lastSavedAt ? (
              <span className="ml-2 text-neutral-500">
                Last saved at {lastSavedAt}
              </span>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          <Section title="Store Information">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                placeholder="Store Name"
                value={formData.store.name}
                onChange={(event) =>
                  handleChange("store", "name", event.target.value)
                }
              />

              <Input
                placeholder="Currency"
                value={formData.store.currency}
                onChange={(event) =>
                  handleChange("store", "currency", event.target.value)
                }
              />

              <div className="md:col-span-2">
                <Input
                  placeholder="Tagline"
                  value={formData.store.tagline}
                  onChange={(event) =>
                    handleChange("store", "tagline", event.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                placeholder="WhatsApp Number"
                value={formData.contact.whatsappNumber}
                onChange={(event) =>
                  handleChange("contact", "whatsappNumber", event.target.value)
                }
              />

              <Input
                placeholder="Phone"
                value={formData.contact.phone}
                onChange={(event) =>
                  handleChange("contact", "phone", event.target.value)
                }
              />

              <Input
                type="email"
                placeholder="Store Email"
                value={formData.contact.email}
                onChange={(event) =>
                  handleChange("contact", "email", event.target.value)
                }
              />

              <Input
                placeholder="Store Location"
                value={formData.contact.location}
                onChange={(event) =>
                  handleChange("contact", "location", event.target.value)
                }
              />
            </div>
          </Section>

          <Section title="Social Links">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                placeholder="Facebook URL"
                value={formData.social.facebookUrl}
                onChange={(event) =>
                  handleChange("social", "facebookUrl", event.target.value)
                }
              />

              <Input
                placeholder="Instagram URL"
                value={formData.social.instagramUrl}
                onChange={(event) =>
                  handleChange("social", "instagramUrl", event.target.value)
                }
              />

              <Input
                placeholder="TikTok URL"
                value={formData.social.tiktokUrl}
                onChange={(event) =>
                  handleChange("social", "tiktokUrl", event.target.value)
                }
              />

              <Input
                placeholder="YouTube URL"
                value={formData.social.youtubeUrl}
                onChange={(event) =>
                  handleChange("social", "youtubeUrl", event.target.value)
                }
              />
            </div>
          </Section>

          <Section title="Delivery">
            <div className="grid gap-6 md:grid-cols-3">
              <Input
                type="number"
                placeholder="Inside Dhaka"
                value={formData.delivery.insideDhaka}
                onChange={(event) =>
                  handleChange("delivery", "insideDhaka", event.target.value)
                }
              />

              <Input
                type="number"
                placeholder="Outside Dhaka"
                value={formData.delivery.outsideDhaka}
                onChange={(event) =>
                  handleChange("delivery", "outsideDhaka", event.target.value)
                }
              />

              <Input
                type="number"
                placeholder="Free Shipping Over"
                value={formData.delivery.freeShippingOver}
                onChange={(event) =>
                  handleChange(
                    "delivery",
                    "freeShippingOver",
                    event.target.value
                  )
                }
              />
            </div>
          </Section>

          <Section title="Homepage Hero">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                placeholder="Hero Eyebrow"
                value={formData.homepage.heroEyebrow}
                onChange={(event) =>
                  handleChange("homepage", "heroEyebrow", event.target.value)
                }
              />

              <Input
                placeholder="Hero Title"
                value={formData.homepage.heroTitle}
                onChange={(event) =>
                  handleChange("homepage", "heroTitle", event.target.value)
                }
              />

              <div className="md:col-span-2">
                <Textarea
                  placeholder="Hero Subtitle"
                  value={formData.homepage.heroSubtitle}
                  onChange={(event) =>
                    handleChange("homepage", "heroSubtitle", event.target.value)
                  }
                />
              </div>

              <Input
                placeholder="Primary CTA Text"
                value={formData.homepage.primaryCtaText}
                onChange={(event) =>
                  handleChange("homepage", "primaryCtaText", event.target.value)
                }
              />

              <Input
                placeholder="Primary CTA Link, e.g. /collections"
                value={formData.homepage.primaryCtaHref}
                onChange={(event) =>
                  handleChange("homepage", "primaryCtaHref", event.target.value)
                }
              />

              <Input
                placeholder="Secondary CTA Text"
                value={formData.homepage.secondaryCtaText}
                onChange={(event) =>
                  handleChange(
                    "homepage",
                    "secondaryCtaText",
                    event.target.value
                  )
                }
              />

              <Input
                placeholder="Secondary CTA Link, e.g. /shop"
                value={formData.homepage.secondaryCtaHref}
                onChange={(event) =>
                  handleChange(
                    "homepage",
                    "secondaryCtaHref",
                    event.target.value
                  )
                }
              />
            </div>
          </Section>

          <Section title="SEO">
            <div className="grid gap-6">
              <Input
                placeholder="SEO Title"
                value={formData.seo.title}
                onChange={(event) =>
                  handleChange("seo", "title", event.target.value)
                }
              />

              <Textarea
                placeholder="SEO Description"
                value={formData.seo.description}
                onChange={(event) =>
                  handleChange("seo", "description", event.target.value)
                }
              />

              <Input
                placeholder="SEO Keywords"
                value={formData.seo.keywords}
                onChange={(event) =>
                  handleChange("seo", "keywords", event.target.value)
                }
              />

              <Input
                placeholder="OG Image URL"
                value={formData.seo.ogImage}
                onChange={(event) =>
                  handleChange("seo", "ogImage", event.target.value)
                }
              />
            </div>
          </Section>

          <Section title="Payment Methods">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["cashOnDelivery", "Cash On Delivery"],
                ["bkash", "bKash"],
                ["nagad", "Nagad"],
                ["rocket", "Rocket"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 border border-white/10 bg-white/5 px-5 py-4 text-sm text-neutral-300"
                >
                  <input
                    type="checkbox"
                    checked={formData.payment[field]}
                    onChange={(event) =>
                      handleCheckboxChange(
                        "payment",
                        field,
                        event.target.checked
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </Section>

          {message ? (
            <div className="border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
              {message}
              {lastSavedAt ? (
                <span className="ml-2 text-neutral-500">
                  Last saved at {lastSavedAt}
                </span>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#f1ece4] px-8 py-5 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </main>
  );
}