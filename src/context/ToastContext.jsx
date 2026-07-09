"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  function showToast({
    type = "success",
    title = "",
    message = "",
    actionLabel = "",
    actionHref = "",
  }) {
    setToast({
      type,
      title,
      message,
      actionLabel,
      actionHref,
      id: Date.now(),
    });
  }

  function hideToast() {
    setToast(null);
  }

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {toast && (
        <div className="fixed right-5 top-24 z-[9999] w-[calc(100%-2.5rem)] max-w-sm animate-[toastSlideIn_420ms_cubic-bezier(0.16,1,0.3,1)_both] border border-[#f1ece4]/15 bg-[#0b0b0b]/92 p-5 text-[#f1ece4] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#b1844a]/60 text-sm text-[#d7bea0]">
              {toast.type === "error" ? "!" : "✓"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7bea0]">
                {toast.title}
              </p>

              {toast.message && (
                <p className="mt-3 text-sm leading-6 text-[#eee7dd]/78">
                  {toast.message}
                </p>
              )}

              {toast.actionHref && toast.actionLabel && (
                <Link
                  href={toast.actionHref}
                  onClick={hideToast}
                  className="mt-4 inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f1ece4] transition hover:text-[#d7bea0]"
                >
                  {toast.actionLabel} →
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={hideToast}
              className="text-sm text-[#f1ece4]/45 transition hover:text-[#f1ece4]"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}