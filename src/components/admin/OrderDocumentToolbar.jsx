"use client";

import Link from "next/link";
import { useState } from "react";

export default function OrderDocumentToolbar({
  orderId,
  documentTitle,
}) {
  const [isPrinting, setIsPrinting] = useState(false);

  function handlePrint() {
    setIsPrinting(true);

    const originalTitle = document.title;

    const safeFileName = String(
      orderId || "OBSIDIAN-Invoice"
    )
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-");

    const restoreDocumentState = () => {
      document.title = originalTitle;
      setIsPrinting(false);

      window.removeEventListener(
        "afterprint",
        restoreDocumentState
      );
    };

    document.title = safeFileName;

    window.addEventListener(
      "afterprint",
      restoreDocumentState
    );

    window.setTimeout(() => {
      window.print();
    }, 150);

    window.setTimeout(() => {
      if (document.title === safeFileName) {
        restoreDocumentState();
      }
    }, 3000);
  }

  return (
    <div className="print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-col justify-between gap-4 border border-white/10 bg-[#111111] px-5 py-4 text-[#f1ece4] sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">
            OBSIDIAN / Order Document
          </p>

          <p className="mt-2 text-sm text-neutral-300">
            {documentTitle || "Order Document"} · {orderId}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/orders/${encodeURIComponent(
              orderId
            )}`}
            className="inline-flex min-h-11 items-center justify-center border border-white/15 px-5 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition hover:border-white/40 hover:bg-white/[0.04]"
          >
            Back to Order
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex min-h-11 items-center justify-center border border-[#f1ece4] bg-[#f1ece4] px-5 text-[10px] uppercase tracking-[0.2em] text-[#0b0b0b] transition hover:bg-transparent hover:text-[#f1ece4] disabled:cursor-wait disabled:opacity-60"
          >
            {isPrinting
              ? "Preparing..."
              : "Print / Save PDF"}
          </button>
        </div>
      </div>

      <div className="mx-auto mt-3 max-w-[210mm] border border-blue-400/20 bg-blue-400/[0.06] px-5 py-4 text-xs leading-6 text-blue-200/80">
        Choose{" "}
        <strong className="font-medium text-blue-100">
          Save as PDF
        </strong>{" "}
        in the print dialog. The order ID will be used
        automatically as the suggested PDF file name.
        Disable browser headers and footers to remove the URL,
        date, and page title from the PDF.
      </div>
    </div>
  );
}