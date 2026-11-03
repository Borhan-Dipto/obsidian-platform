import { isLabMode } from "../../lib/labMode";

/* Small fixed badge so nobody mistakes the test copy for the live store. */
export default function LabBadge() {
  if (!isLabMode()) {
    return null;
  }

  return (
    <div
      role="note"
      className="pointer-events-none fixed left-3 bottom-5 z-[90] bg-[#b1844a] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0b0b0b] shadow-lg"
    >
      Test site · not live
    </div>
  );
}
