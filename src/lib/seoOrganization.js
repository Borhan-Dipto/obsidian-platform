/*
 * Organization identity for structured data (schema.org), built
 * only from what the business has entered in admin Settings.
 * Missing values are left out rather than guessed, so search
 * engines and AI systems never receive invented business details.
 */

export const ORGANIZATION_LOGO_PATH = "/images/obsidian-logo-black.png";

function cleanText(value, maxLength = 300) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeProfileUrl(value) {
  const text = cleanText(value, 500);

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);

    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeEmail(value) {
  const email = cleanText(value, 254).toLowerCase().replace(/^mailto:/, "");

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/* Bangladesh numbers to international format, e.g. +8801XXXXXXXXX. */
export function normalizeTelephone(value) {
  let digits = cleanText(value, 40).replace(/\D/g, "");

  if (/^01\d{9}$/.test(digits)) {
    digits = `88${digits}`;
  }

  return /^\d{8,15}$/.test(digits) ? `+${digits}` : "";
}

export function buildOrganizationProfile(settings, siteUrl) {
  const store = settings?.store || {};
  const contact = settings?.contact || {};
  const social = settings?.social || {};
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");

  const name = cleanText(store.name, 120) || "OBSIDIAN";
  const email = normalizeEmail(contact.email);
  const telephone =
    normalizeTelephone(contact.phone) ||
    normalizeTelephone(contact.whatsappNumber);
  const location = cleanText(contact.location, 120);

  const sameAs = [
    social.facebookUrl,
    social.instagramUrl,
    social.tiktokUrl,
    social.youtubeUrl,
  ]
    .map(normalizeProfileUrl)
    .filter(Boolean);

  const profile = {
    name,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}${ORGANIZATION_LOGO_PATH}`,
      width: 2048,
      height: 2048,
    },
  };

  const tagline = cleanText(store.tagline, 200);

  if (tagline) {
    profile.slogan = tagline;
  }

  if (email) {
    profile.email = email;
  }

  if (telephone) {
    profile.telephone = telephone;
  }

  if (location) {
    profile.address = {
      "@type": "PostalAddress",
      addressLocality: location,
      addressCountry: "BD",
    };
  }

  const contactPoint = {
    "@type": "ContactPoint",
    contactType: "customer support",
    areaServed: "BD",
    availableLanguage: ["English", "Bengali"],
  };

  if (email) {
    contactPoint.email = email;
  }

  if (telephone) {
    contactPoint.telephone = telephone;
  }

  profile.contactPoint = [contactPoint];

  if (sameAs.length > 0) {
    profile.sameAs = sameAs;
  }

  return profile;
}
