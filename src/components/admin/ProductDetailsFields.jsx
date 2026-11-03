"use client";

/*
 * Optional product facts shown to customers ("Fabric & Care") and
 * used in Google / Meta product data. Leave a field empty when the
 * fact is not confirmed — empty fields are simply not shown.
 */

export const EMPTY_PRODUCT_DETAILS_FORM = {
  detailMaterial: "",
  detailGsm: "",
  detailFit: "",
  detailPrint: "",
  detailCare: "",
  detailModel: "",
};

export function productDetailsToForm(details) {
  const source =
    details && typeof details === "object" ? details : {};

  return {
    detailMaterial: String(source.material || ""),
    detailGsm:
      source.gsm === undefined || source.gsm === null
        ? ""
        : String(source.gsm),
    detailFit: String(source.fit || ""),
    detailPrint: String(source.print || ""),
    detailCare: String(source.care || ""),
    detailModel: String(source.model || ""),
  };
}

export function formToProductDetails(formData) {
  return {
    material: String(formData.detailMaterial || "").trim(),
    gsm: String(formData.detailGsm || "").trim(),
    fit: String(formData.detailFit || "").trim(),
    print: String(formData.detailPrint || "").trim(),
    care: String(formData.detailCare || "").trim(),
    model: String(formData.detailModel || "").trim(),
  };
}

const inputClassName =
  "w-full border border-white/10 bg-white/5 px-5 py-4 outline-none placeholder:text-neutral-600";

export default function ProductDetailsFields({ formData, onChange }) {
  return (
    <fieldset className="space-y-4 border border-white/10 p-5">
      <legend className="px-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
        Fabric &amp; care (optional — only confirmed facts)
      </legend>

      <input
        name="detailMaterial"
        placeholder="Fabric, e.g. 100% combed cotton"
        value={formData.detailMaterial}
        onChange={onChange}
        maxLength={120}
        className={inputClassName}
      />

      <input
        name="detailGsm"
        type="number"
        inputMode="numeric"
        min={80}
        max={600}
        step={1}
        placeholder="Fabric weight in GSM, e.g. 220"
        value={formData.detailGsm}
        onChange={onChange}
        className={inputClassName}
      />

      <input
        name="detailFit"
        placeholder="Fit, e.g. Oversized / Drop shoulder"
        value={formData.detailFit}
        onChange={onChange}
        maxLength={80}
        className={inputClassName}
      />

      <input
        name="detailPrint"
        placeholder="Print, e.g. Screen print / DTF"
        value={formData.detailPrint}
        onChange={onChange}
        maxLength={80}
        className={inputClassName}
      />

      <textarea
        name="detailCare"
        placeholder="Care, e.g. Wash inside out in cold water. Do not iron on print."
        value={formData.detailCare}
        onChange={onChange}
        maxLength={400}
        rows={3}
        className={inputClassName}
      />

      <input
        name="detailModel"
        placeholder={'Model info, e.g. Model is 6\'0" and wears size L'}
        value={formData.detailModel}
        onChange={onChange}
        maxLength={120}
        className={inputClassName}
      />
    </fieldset>
  );
}
