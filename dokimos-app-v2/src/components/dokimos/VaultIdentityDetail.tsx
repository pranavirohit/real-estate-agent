"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { VaultCredentialRowList } from "@/components/dokimos/VaultVerifiedAttributeList";
import {
  VAULT_DEMO_ATTRIBUTES,
  formatVaultAttributeDisplay,
  groupVaultAttributes,
  sortIdentityEntries,
} from "@/lib/vaultAttributes";
import {
  vaultDetailTitleClass,
  vaultInsetPanelClass,
  vaultPlaidDetailCardClass,
} from "@/lib/vaultDetailPlaid";
import type { AttestationData } from "@/types/dokimos";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultIdentityDetailProps = {
  attestationData: AttestationData | null;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  hasEncryptedId: boolean;
  reVerifyLoading: boolean;
  reVerifyError: string | null;
  onReVerify: () => void;
};

export function VaultIdentityDetail({
  attestationData,
  sessionStatus,
  hasEncryptedId,
  reVerifyLoading,
  reVerifyError,
  onReVerify,
}: VaultIdentityDetailProps) {
  const attributes = useMemo(
    () => attestationData?.attributes ?? VAULT_DEMO_ATTRIBUTES,
    [attestationData]
  );

  const documentTypeHeading = useMemo(() => {
    const v = attributes.documentType;
    if (typeof v !== "string" || !v.trim() || v === "Unknown") return null;
    return formatVaultAttributeDisplay("documentType", v);
  }, [attributes]);

  const cardAttributeEntries = useMemo(
    () => Object.entries(attributes).filter(([k]) => k !== "documentType"),
    [attributes]
  );

  const groupedAttributes = useMemo(
    () => groupVaultAttributes(cardAttributeEntries as [string, string | boolean][]),
    [cardAttributeEntries]
  );

  const primaryEntries = useMemo(
    () => sortIdentityEntries(groupedAttributes.identity),
    [groupedAttributes.identity]
  );

  const additionalEntries = useMemo(
    () =>
      [
        ...groupedAttributes.document,
        ...groupedAttributes.eligibility,
        ...groupedAttributes.other,
      ] as [string, string | boolean][],
    [groupedAttributes]
  );

  const timestamp = attestationData?.timestamp
    ? new Date(attestationData.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  return (
    <div className="w-full">
      <div className={vaultPlaidDetailCardClass}>
        <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-10">
          <h2 className={vaultDetailTitleClass} style={{ fontFamily: sans }}>
            Your verified identity
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
          <div className={`overflow-hidden ${vaultInsetPanelClass} px-4 py-4 sm:px-5`}>
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-sm ring-2 ring-emerald-500/20">
                <Check size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[15px] font-semibold text-emerald-900" style={{ fontFamily: sans }}>
                  Identity verified
                </p>
                <p className="mt-0.5 text-[13px] text-slate-600" style={{ fontFamily: sans }}>
                  {timestamp}
                </p>
                {attestationData?.reVerified ? (
                  <p className="mt-1 text-[12px] font-medium text-emerald-800" style={{ fontFamily: sans }}>
                    Refreshed from your stored ID (re-verification)
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <VaultCredentialRowList
            variant="embedded"
            primaryEntries={primaryEntries}
            documentTypeLabel={documentTypeHeading}
            additionalEntries={additionalEntries}
            sans={sans}
          />

          {hasEncryptedId ? (
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-4 sm:px-5">
              <h3 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                Re-verify without re-uploading
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
                Your ID image is encrypted and held in the verification service memory (demo) so you can refresh your
                attestation after a new session or device—without uploading again.
              </p>
              {sessionStatus === "authenticated" ? (
                <button
                  type="button"
                  onClick={onReVerify}
                  disabled={reVerifyLoading}
                  className="mt-4 h-12 min-h-[44px] w-full rounded-lg border border-slate-200 bg-white text-[14px] font-semibold text-emerald-900 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontFamily: sans }}
                >
                  {reVerifyLoading ? "Re-verifying…" : "Re-verify identity"}
                </button>
              ) : (
                <p className="mt-3 text-[13px] text-slate-600" style={{ fontFamily: sans }}>
                  Sign in with Google to re-verify using your stored ID.
                </p>
              )}
              {reVerifyError ? (
                <p className="mt-3 text-[13px] text-red-600" role="alert" style={{ fontFamily: sans }}>
                  {reVerifyError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
