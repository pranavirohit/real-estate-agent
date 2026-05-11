"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { DokimosBrandBackdrop } from "@/components/dokimos/DokimosBrandBackdrop";

type PlaidSplitOnboardingLayoutProps = {
  onBack: () => void;
  /** Large teal headline on the left rail */
  leftHeadline: string;
  /** Short value bullets with checkmarks */
  leftBullets: string[];
  cardTitle: string;
  cardDescription: string;
  cardDetail?: string;
  error?: ReactNode;
  children: ReactNode;
  /** Primary action (e.g. Next) — laid out bottom-right of the card like Plaid */
  footer: ReactNode;
};

/**
 * Plaid-style split onboarding: dark branded left rail (~1/3) + neutral canvas + centered white card.
 */
export function PlaidSplitOnboardingLayout({
  onBack,
  leftHeadline,
  leftBullets,
  cardTitle,
  cardDescription,
  cardDetail,
  error,
  children,
  footer,
}: PlaidSplitOnboardingLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col-reverse font-sans lg:flex-row lg:items-stretch">
      {/* Left rail — dark navy, marketing (Geist / sans throughout) */}
      <aside
        className="font-landing relative flex min-h-[min(42vh,320px)] shrink-0 flex-col overflow-hidden bg-[#0F172A] px-6 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pb-12 lg:min-h-[100dvh] lg:w-[min(38%,440px)] lg:max-w-[440px] lg:px-10 lg:pb-16 lg:pt-10"
      >
        <DokimosBrandBackdrop />

        <div className="relative z-[1] flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2 pt-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-slate-900 text-[13px] font-bold text-white shadow-lg shadow-teal-900/40">
              D
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-white">Dokimos</span>
          </div>
        </div>

        <div className="relative z-[1] mt-8 flex flex-1 flex-col lg:mt-14">
          <h1 className="text-[clamp(1.35rem,3.5vw,1.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-[#2DD4BF]">
            {leftHeadline}
          </h1>
          <ul className="mt-6 max-w-[20rem] space-y-3.5 text-[14px] leading-snug text-white/90">
            {leftBullets.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3 text-teal-300" strokeWidth={3} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {/* Social proof strip — abstract “logo” row */}
          <div className="mt-auto hidden pt-10 sm:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">Trusted for high-stakes verification</p>
            <div className="mt-4 flex flex-wrap items-center gap-6 opacity-80">
              {["Finance", "HR", "Mobility", "Healthcare"].map((label) => (
                <span key={label} className="text-[13px] font-semibold tracking-wide text-white/70">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main — light canvas + card */}
      <main className="flex min-h-0 flex-1 flex-col bg-[#eceef1] px-4 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:items-center lg:justify-center lg:px-12 lg:py-14">
        <div className="mx-auto flex w-full max-w-[520px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-10">
            <h2 className="text-[1.25rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.375rem]">
              {cardTitle}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{cardDescription}</p>
            {cardDetail ? (
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{cardDetail}</p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
            {error ? <div className="mb-4">{error}</div> : null}
            {children}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}
