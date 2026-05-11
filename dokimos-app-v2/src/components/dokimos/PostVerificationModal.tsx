"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";
import { dokimosSectionLabelClass } from "@/lib/dokimosLayout";
import { STORAGE_POST_VERIFICATION_EXPLAINER_SEEN } from "@/types/dokimos";

/** Plus Jakarta Sans — same as How it works modal (`--font-landing-sans`). */
const plusJakartaSans = "var(--font-landing-sans), system-ui, sans-serif" as const;

export type PostVerificationCloseSource = "dismiss" | "learn-more" | "verify-yourself";

type PostVerificationModalProps = {
  isOpen: boolean;
  onClose: (source: PostVerificationCloseSource) => void;
};

function markSeen() {
  try {
    localStorage.setItem(STORAGE_POST_VERIFICATION_EXPLAINER_SEEN, "1");
  } catch {
    /* ignore */
  }
}

export function PostVerificationModal({ isOpen, onClose }: PostVerificationModalProps) {
  const { openHowItWorks } = useHowItWorksModal();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleLearnMore = () => {
    markSeen();
    onClose("learn-more");
    openHowItWorks();
  };

  const handleVerifyYourself = () => {
    markSeen();
    const url = getEigenVerificationDashboardUrl();
    window.open(url, "_blank", "noopener,noreferrer");
    onClose("verify-yourself");
  };

  const handleDismiss = () => {
    markSeen();
    onClose("dismiss");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-verification-modal-title"
      aria-describedby="post-verification-description"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent"
        aria-label="Dismiss"
        onClick={handleDismiss}
      />
      <div
        className="relative z-10 flex max-h-[min(92dvh,900px)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1 pr-2">
            <p
              className={`${dokimosSectionLabelClass} text-[11px] tracking-[0.12em]`}
              style={{ fontFamily: plusJakartaSans }}
            >
              Help
            </p>
            <h2
              id="post-verification-modal-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px]"
              style={{ fontFamily: plusJakartaSans }}
            >
              What just happened?
            </h2>
            <p
              className="mt-2 max-w-prose text-[13px] leading-relaxed text-slate-600 sm:text-[14px]"
              style={{ fontFamily: plusJakartaSans }}
            >
              Your ID is safe.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pt-4 sm:px-6">
          <div
            id="post-verification-description"
            className="mx-auto max-w-2xl space-y-4 pb-4 text-[13px] leading-relaxed text-slate-600 sm:text-[14px]"
            style={{ fontFamily: plusJakartaSans }}
          >
            <p>
              We verified your ID document and confirmed your face matches it. But here&apos;s the important part:{" "}
              <strong className="font-semibold text-slate-900">
                Dokimos never saw your actual document or photo.
              </strong>
            </p>
            <p>Everything was processed in isolated, tamper-proof hardware that even we can&apos;t access.</p>
            <p>
              What you have now is a verified digital credential you can share with anyone, without ever uploading your
              ID again.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={handleLearnMore}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-dokimos-accent px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
              style={{ fontFamily: plusJakartaSans }}
            >
              Learn more
            </button>
            <button
              type="button"
              onClick={handleVerifyYourself}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
              style={{ fontFamily: plusJakartaSans }}
            >
              Verify it yourself
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
