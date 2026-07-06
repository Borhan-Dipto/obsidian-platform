"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    tagline: "",
    whatsappNumber: "",
    storeEmail: "",
    storeLocation: "",
    currency: "",
    facebookUrl: "",
    instagramUrl: "",
    deliveryChargeInsideDhaka: "",
    deliveryChargeOutsideDhaka: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (response.ok && data.success) {
          setFormData({
            storeName: data.settings.storeName || "",
            tagline: data.settings.tagline || "",
            whatsappNumber: data.settings.whatsappNumber || "",
            storeEmail: data.settings.storeEmail || "",
            storeLocation: data.settings.storeLocation || "",
            currency: data.settings.currency || "BDT",
            facebookUrl: data.settings.facebookUrl || "",
            instagramUrl: data.settings.instagramUrl || "",
            deliveryChargeInsideDhaka: String(
              data.settings.deliveryChargeInsideDhaka ?? ""
            ),
            deliveryChargeOutsideDhaka: String(
              data.settings.deliveryChargeOutsideDhaka ?? ""
            ),
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(e) {
    setMessage("");

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          deliveryChargeInsideDhaka: Number(
            formData.deliveryChargeInsideDhaka
          ),
          deliveryChargeOutsideDhaka: Number(
            formData.deliveryChargeOutsideDhaka
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Settings could not be saved.");
        return;
      }

      setMessage("Settings saved successfully.");
    } catch {
      setMessage("Something went wrong while saving settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4]">
        <div className="mx-auto max-w-4xl">
          <p className="text-neutral-400">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-4xl">
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

        {message && (
          <div className="mb-6 border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="border border-white/10 bg-white/[0.03] p-7 md:p-9">
            <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Store Information
            </p>

            <div className="grid gap-6">
              <input
                name="storeName"
                placeholder="Store Name"
                value={formData.storeName}
                onChange={handleChange}
                required
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                name="tagline"
                placeholder="Tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                name="currency"
                placeholder="Currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-7 md:p-9">
            <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Contact
            </p>

            <div className="grid gap-6">
              <input
                name="whatsappNumber"
                placeholder="WhatsApp Number, e.g. 8801814455199"
                value={formData.whatsappNumber}
                onChange={handleChange}
                required
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                type="email"
                name="storeEmail"
                placeholder="Store Email"
                value={formData.storeEmail}
                onChange={handleChange}
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                name="storeLocation"
                placeholder="Store Location"
                value={formData.storeLocation}
                onChange={handleChange}
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-7 md:p-9">
            <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Social Links
            </p>

            <div className="grid gap-6">
              <input
                name="facebookUrl"
                placeholder="Facebook URL"
                value={formData.facebookUrl}
                onChange={handleChange}
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                name="instagramUrl"
                placeholder="Instagram URL"
                value={formData.instagramUrl}
                onChange={handleChange}
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-7 md:p-9">
            <p className="mb-7 text-xs uppercase tracking-[0.4em] text-neutral-500">
              Delivery
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <input
                type="number"
                name="deliveryChargeInsideDhaka"
                placeholder="Inside Dhaka Delivery Charge"
                value={formData.deliveryChargeInsideDhaka}
                onChange={handleChange}
                min="0"
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />

              <input
                type="number"
                name="deliveryChargeOutsideDhaka"
                placeholder="Outside Dhaka Delivery Charge"
                value={formData.deliveryChargeOutsideDhaka}
                onChange={handleChange}
                min="0"
                className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600"
              />
            </div>
          </section>

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