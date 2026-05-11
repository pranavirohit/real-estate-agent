/**
 * Shared layout tokens for vault dashboard detail overlays (verified identity, pending requests, activity).
 * Matches `PlaidSplitOnboardingLayout` main card + inset panels (`Screen02UploadOrCapture` upload zone).
 */

/** Outer white card: same shell + shadow as onboarding step card. */
export const vaultPlaidDetailCardClass =
  "flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_40px_rgba(15,23,42,0.08)]";

/** Inset content panel (upload-zone style). */
export const vaultInsetPanelClass = "rounded-xl border border-slate-200 bg-slate-50/80";

/** Centered title in the card header band (matches onboarding `cardTitle`). */
export const vaultDetailTitleClass =
  "text-[1.25rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.375rem]";
