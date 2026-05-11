"use client";

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { HowDokimosProtectsContent } from "@/components/dokimos/HowDokimosProtectsContent";
import { STORAGE_EXPLAINER_SEEN } from "@/types/dokimos";

type ExplainerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;
const serif = "var(--font-instrument-serif), Georgia, serif" as const;

export function ExplainerModal({ isOpen, onClose }: ExplainerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const eigenUrl = getEigenVerificationDashboardUrl();

  const handleVerify = () => {
    window.open(eigenUrl, "_blank", "noopener,noreferrer");
  };

  const handleGotIt = () => {
    try {
      localStorage.setItem(STORAGE_EXPLAINER_SEEN, "1");
    } catch {
      /* ignore */
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainer-title"
    >
      <div className="max-h-[min(90dvh,800px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <h2
          id="explainer-title"
          className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl"
          style={{ fontFamily: serif }}
        >
          How Dokimos protects your identity
        </h2>

        <div className="mt-4 text-left">
          <HowDokimosProtectsContent omitMainHeading showTechnicalDetailsButton />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleVerify}
            className="flex w-full flex-col items-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            style={{ fontFamily: sans }}
          >
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-slate-900">
              Verify it yourself
              <ExternalLink size={14} className="opacity-70" aria-hidden />
            </span>
            <span className="text-[13px] text-slate-500">Open the Eigen verification dashboard</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleGotIt}
          className="mt-6 h-12 w-full rounded-xl bg-dokimos-accent text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
          style={{ fontFamily: sans }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
