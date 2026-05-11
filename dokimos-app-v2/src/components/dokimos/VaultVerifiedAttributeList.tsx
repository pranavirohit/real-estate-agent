"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { formatVaultAttributeDisplay, labelForVaultAttributeKey } from "@/lib/vaultAttributes";

type RowProps = {
  label: string;
  sans: string;
  children: ReactNode;
};

function CredentialRow({ label, sans, children }: RowProps) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4 px-4 py-3 sm:min-h-[52px] sm:px-5">
      <span className="shrink-0 text-[13px] text-slate-500" style={{ fontFamily: sans }}>
        {label}
      </span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}

type VaultCredentialRowListProps = {
  /** Primary profile fields (name, DOB, nationality), ordered. */
  primaryEntries: [string, string | boolean][];
  /** Optional document / ID type row (from attestation). */
  documentTypeLabel?: string | null;
  /** Remaining checks: document dates, age gates, etc. No section titles — flat list. */
  additionalEntries: [string, string | boolean][];
  sans: string;
  /**
   * `embedded` — same inset “upload zone” treatment as onboarding (`rounded-xl border border-slate-200 bg-slate-50/80`).
   * `standalone` (default) — full white card with shadow (hub column).
   */
  variant?: "standalone" | "embedded";
};

/**
 * Vault-aligned credential presentation: label/value rows (no card grid, no section headings).
 */
export function VaultCredentialRowList({
  primaryEntries,
  documentTypeLabel,
  additionalEntries,
  sans,
  variant = "standalone",
}: VaultCredentialRowListProps) {
  const renderValue = (key: string, value: string | boolean) => {
    const display = formatVaultAttributeDisplay(key, value);
    const isVerified = typeof value === "boolean" && value;
    const isFailedBool = typeof value === "boolean" && !value;
    return (
      <span
        className={`block text-[15px] font-medium leading-snug ${
          isVerified ? "text-emerald-700" : isFailedBool ? "text-amber-800" : "text-slate-900"
        }`}
        style={{ fontFamily: sans }}
      >
        {typeof value === "boolean" && value ? (
          <span className="inline-flex items-center justify-end gap-1.5">
            <Check className="inline h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
            {display}
          </span>
        ) : (
          display
        )}
      </span>
    );
  };

  const hasAdditional = additionalEntries.length > 0;
  const hasPrimaryBlock =
    primaryEntries.length > 0 || (documentTypeLabel != null && documentTypeLabel.trim() !== "");

  if (!hasPrimaryBlock && !hasAdditional) return null;

  const primaryBlock =
    hasPrimaryBlock ? (
      <div className="divide-y divide-slate-100">
        {primaryEntries.map(([key, value], idx) => (
          <CredentialRow key={`p-${key}-${idx}`} label={labelForVaultAttributeKey(key)} sans={sans}>
            {renderValue(key, value)}
          </CredentialRow>
        ))}
        {documentTypeLabel ? (
          <CredentialRow label="Document Type" sans={sans}>
            <span className="text-[15px] font-medium text-slate-900" style={{ fontFamily: sans }}>
              {documentTypeLabel}
            </span>
          </CredentialRow>
        ) : null}
      </div>
    ) : null;

  const shellClass =
    variant === "embedded"
      ? "overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80"
      : "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04]";

  return (
    <div className={shellClass} style={{ fontFamily: sans }}>
      {primaryBlock}

      {hasAdditional ? (
        <div
          className={`divide-y divide-slate-100 ${variant === "embedded" ? "bg-slate-100/70" : "bg-[#FAFAF9]"} ${hasPrimaryBlock ? "border-t border-slate-200/80" : ""}`}
        >
          {additionalEntries.map(([key, value], idx) => (
            <CredentialRow
              key={`a-${key}-${idx}`}
              label={labelForVaultAttributeKey(key)}
              sans={sans}
            >
              {renderValue(key, value)}
            </CredentialRow>
          ))}
        </div>
      ) : null}
    </div>
  );
}
