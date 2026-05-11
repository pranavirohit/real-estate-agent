"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultInfoMenuProps = {
  /** Prefer attestation-specific Eigen dashboard URL when present. */
  verificationUrl?: string;
  /** Light icon for dark vault hero */
  tone?: "default" | "onDark";
};

export function VaultInfoMenu({ verificationUrl, tone = "default" }: VaultInfoMenuProps) {
  const { openHowItWorks } = useHowItWorksModal();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const eigenUrl = verificationUrl ?? getEigenVerificationDashboardUrl();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const openEigen = () => {
    setOpen(false);
    window.open(eigenUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative flex justify-end" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          tone === "onDark"
            ? "rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            : "rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Information and help"
      >
        <Info size={22} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-[60] mt-1 w-[min(calc(100vw-2.5rem),20rem)] rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-900/10"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openHowItWorks();
            }}
            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            style={{ fontFamily: sans }}
          >
            <span className="text-[14px] font-semibold text-slate-900">How Dokimos works</span>
            <span className="text-[12px] text-slate-500">Learn about TEE processing</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openEigen}
            className="flex w-full flex-col items-start gap-0.5 border-t border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            style={{ fontFamily: sans }}
          >
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
              Verify TEE attestation
              <ExternalLink size={13} className="opacity-60" aria-hidden />
            </span>
            <span className="text-[12px] text-slate-500">Check the cryptographic proof</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
