"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DOKIMOS_ROLE_LABEL,
  dokimosCardClass,
  dokimosSectionLabelClass,
  type DokimosScreenRole,
} from "@/lib/dokimosLayout";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type DokimosPageChromeProps = {
  /** Semantic role — drives default eyebrow if `roleLabel` omitted. */
  role: DokimosScreenRole;
  /** Override eyebrow (e.g. "Home", "Settings"). */
  roleLabel?: string;
  /** Main page title (Geist / sans). */
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Standard page header for /app routes: eyebrow + serif title + optional body copy.
 * Place below the app top bar; keep section content in `children`.
 */
export function DokimosPageChrome({
  role,
  roleLabel,
  title,
  description,
  children,
}: DokimosPageChromeProps) {
  const eyebrow = roleLabel ?? DOKIMOS_ROLE_LABEL[role];
  return (
    <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-3 md:px-6">
      <p
        className={`${dokimosSectionLabelClass} text-[11px] tracking-[0.12em]`}
        style={{ fontFamily: sans }}
      >
        {eyebrow}
      </p>
      <h1
        className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] md:text-[30px]"
        style={{ fontFamily: sans }}
      >
        {title}
      </h1>
      {description ? (
        <p
          className="mt-2 max-w-prose text-[14px] leading-relaxed text-slate-600"
          style={{ fontFamily: sans }}
        >
          {description}
        </p>
      ) : null}
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

type DokimosSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Titled block with optional intro — wrap cards or grids inside. */
export function DokimosSection({ id, title, description, children, className = "" }: DokimosSectionProps) {
  return (
    <section id={id} className={className}>
      <h2
        className={`${dokimosSectionLabelClass} mb-3`}
        style={{ fontFamily: sans }}
      >
        {title}
      </h2>
      {description ? (
        <p className="mb-4 max-w-prose text-[13px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

type DokimosSurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function DokimosSurfaceCard({ children, className = "" }: DokimosSurfaceCardProps) {
  return <div className={`${dokimosCardClass} ${className}`.trim()}>{children}</div>;
}

/** Hub CTA: navigate (`href`) or open in-app UI (`onClick`), e.g. How it works modal. */
export type HubAction =
  | {
      href: string;
      label: string;
      variant?: "primary" | "secondary";
      badge?: number;
    }
  | {
      onClick: () => void;
      label: string;
      variant?: "primary" | "secondary";
      badge?: number;
    };

type DokimosHubActionRowProps = {
  actions: HubAction[];
};

/**
 * Prominent next-step links — makes hub pages feel like a destination, not a bare list.
 */
export function DokimosHubActionRow({ actions }: DokimosHubActionRowProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {actions.map((a) => {
        const className =
          a.variant === "primary"
            ? "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-dokimos-accent px-4 py-3 text-center text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent sm:min-w-[160px] sm:flex-initial"
            : "flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-[14px] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent sm:min-w-[160px] sm:flex-initial";
        const key = "href" in a ? `${a.href}-${a.label}` : `action-${a.label}`;
        const badge =
          a.badge != null && a.badge > 0 ? (
            <span
              className={
                a.variant === "primary"
                  ? "rounded-full bg-white/20 px-2 py-0.5 text-[12px] font-bold text-white"
                  : "rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white"
              }
            >
              {a.badge > 9 ? "9+" : a.badge}
            </span>
          ) : null;
        if ("onClick" in a) {
          return (
            <button
              key={key}
              type="button"
              onClick={a.onClick}
              className={className}
              style={{ fontFamily: sans }}
            >
              {a.label}
              {badge}
            </button>
          );
        }
        return (
          <Link key={key} href={a.href} className={className} style={{ fontFamily: sans }}>
            {a.label}
            {badge}
          </Link>
        );
      })}
    </div>
  );
}
