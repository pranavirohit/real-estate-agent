/**
 * Dokimos app shell: screen roles and shared layout tokens.
 *
 * **Pattern:** Hub and settings pages should wrap content in `DokimosPageChrome` (`@/components/dokimos/DokimosPageChrome`)
 * with a `DokimosScreenRole` + title + short description. Use `DokimosSurfaceCard` / `DokimosSection` for sections.
 * The app frame (`AppShellLayout`) uses `dokimosCanvasClass` (same warm stone as marketing).
 * Accent color is `dokimos.accent` (teal) — see `tailwind.config.js` / `:root` in `globals.css`.
 */

/** Where the screen sits in the product — sets eyebrow copy and density. */
export type DokimosScreenRole =
  | "hub"
  | "detail"
  | "flow"
  | "settings"
  | "legal"
  | "business";

export const DOKIMOS_ROLE_LABEL: Record<DokimosScreenRole, string> = {
  hub: "Home",
  detail: "Details",
  flow: "Verification",
  settings: "Account",
  legal: "Legal",
  business: "Business",
};

/** Page canvas (onboarding + `/app/*`) — `dokimos.productCanvas` in Tailwind. */
export const dokimosCanvasClass = "bg-dokimos-productCanvas";

/** Primary surfaces: cards on canvas. */
export const dokimosCardClass =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6";

/** Section eyebrow — teal tint to match marketing labels. */
export const dokimosSectionLabelClass =
  "text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-800/80";

export const dokimosPrimaryButtonClass =
  "inline-flex h-12 min-h-[44px] items-center justify-center rounded-xl bg-dokimos-accent px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover active:bg-dokimos-accentPressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent sm:h-14 sm:text-[15px]";

export const dokimosSecondaryButtonClass =
  "inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent";
