"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type PlaidStyleOnboardingShellProps = {
  onBack: () => void;
  /** Small label next to back (e.g. product context). */
  contextLabel?: string;
  title: string;
  description: string;
  /** Fine print under description (e.g. TEE / privacy). */
  detail?: string;
  error?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Dashboard-style onboarding frame: neutral canvas, white panel, header band + footer strip —
 * mirrors Plaid Console / dashboard signup density (sans hierarchy, subtle border/shadow).
 */
export function PlaidStyleOnboardingShell({
  onBack,
  contextLabel = "Verify identity",
  title,
  description,
  detail,
  error,
  children,
  footer,
}: PlaidStyleOnboardingShellProps) {
  return (
    <div
      className="min-h-[100dvh] bg-[#f5f6f8] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]"
      style={{ fontFamily: sans }}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[540px] flex-col px-4 sm:px-6">
        {/* Top bar — back + context */}
        <div className="flex shrink-0 items-center gap-3 py-4 sm:py-5">
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-200/70"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-slate-500">
            {contextLabel}
          </span>
        </div>

        {/* Panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
            <h1 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{description}</p>
            {detail ? (
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{detail}</p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6">
            {error ? <div className="mb-3">{error}</div> : null}
            {children}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:px-6">{footer}</div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Encrypted in transit. Processing in a protected environment.
        </p>
      </div>
    </div>
  );
}
