"use client";

import { X } from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";
import { VerificationRequestReviewCard } from "@/components/VerificationRequestReviewCard";

type RequestNotificationModalProps = {
  request: VerificationRequest | null;
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  onDenied: () => void;
};

export function RequestNotificationModal({
  request,
  open,
  onClose,
  onApproved,
  onDenied,
}: RequestNotificationModalProps) {
  const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

  if (!request) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-colors duration-300 ${
        open ? "bg-black/50" : "pointer-events-none bg-transparent"
      }`}
      role="presentation"
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        className={`max-h-[min(90vh,calc(100dvh-2rem))] w-full max-w-[600px] overflow-y-auto rounded-[20px] border border-slate-200/90 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl transition-all duration-300 ease-out ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-labelledby="req-review-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <h2 id="req-review-title" className="sr-only">
          Review verification request from {request.verifierName ?? "organization"}
        </h2>

        <div style={{ fontFamily: sans }}>
          <VerificationRequestReviewCard
            request={request}
            onApproved={onApproved}
            onDenied={onDenied}
          />
        </div>
      </div>
    </div>
  );
}
