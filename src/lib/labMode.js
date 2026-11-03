/*
 * OBSIDIAN LAB (test copy of the store).
 * Enabled only by NEXT_PUBLIC_OBSIDIAN_LAB=true on the lab deployment:
 * no Meta Pixel / Conversions API / GA4, hidden from search engines,
 * and a visible "test site" badge. The live store never sets this.
 */
export function isLabMode() {
  return process.env.NEXT_PUBLIC_OBSIDIAN_LAB === "true";
}
