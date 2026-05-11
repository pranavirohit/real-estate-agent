"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { Check, Shield } from "lucide-react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import type { VerificationRequest } from "@/types/dokimos";
import { workflowDisplayName } from "@/lib/workflowDisplayName";
import {
  dedupeAttributeKeysForDisplay,
  formatVerificationAttributeKey,
} from "@/lib/verificationRequestDisplay";

/** Plus Jakarta Sans — Airbnb partner title; matches marketing (`--font-landing-sans`). */
const plusJakartaSans = "var(--font-landing-sans), system-ui, sans-serif" as const;

export type VerificationRequestReviewCardProps = {
  request: VerificationRequest | null;
  onApproved: () => void;
  onDenied: () => void;
};

export function VerificationRequestReviewCard({
  request,
  onApproved,
  onDenied,
}: VerificationRequestReviewCardProps) {
  const { storedImageData, setAttestationData } = useDokimosApp();

  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!request || !storedImageData) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post("/api/approve-request", {
        requestId: request.requestId,
        approved: true,
        imageBase64: storedImageData,
      });

      if (response.data.attestation) {
        setAttestationData(response.data.attestation);
      }
      onApproved();
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!request) return;

    setSubmitting(true);
    try {
      await axios.post("/api/approve-request", {
        requestId: request.requestId,
        approved: false,
      });
      onDenied();
    } catch (error) {
      console.error("Failed to deny request:", error);
      alert("Failed to deny request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return then.toLocaleString();
  };

  if (!request) {
    return (
      <p className="text-center text-sm text-slate-600" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
        No request selected.
      </p>
    );
  }

  const companyName = request.verifierName || "Acme Brokerage";
  const companyInitial = companyName.charAt(0);
  const requestedAttrs = dedupeAttributeKeysForDisplay(
    request.requestedAttributes ?? ["name", "ageOver21", "notExpired"]
  );
  const requestTime = getRelativeTime(request.createdAt);
  const wfLabel = workflowDisplayName(request.workflow);
  const showAirbnbLogo = (request.verifierName ?? "").toLowerCase().includes("airbnb");

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-4">
        {showAirbnbLogo ? (
          <Image
            src="/airbnb_logo.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[22px] font-semibold text-gray-700">
            {companyInitial}
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <p
              className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl md:text-[26px]"
              style={{
                fontFamily: showAirbnbLogo
                  ? plusJakartaSans
                  : "var(--font-instrument-serif), Georgia, serif",
              }}
            >
              {companyName}
            </p>
            <span
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-sm"
              aria-label="Verified partner"
            >
              <Check className="h-[13px] w-[13px] text-white" strokeWidth={2.5} aria-hidden />
            </span>
          </div>
          <p
            className="text-[13px] text-gray-500"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
          >
            {wfLabel}
          </p>
          <p
            className="text-[11px] text-gray-400"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
          >
            Requested {requestTime}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#F0FDF4] p-3.5">
        <Shield size={17} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p
            className="text-[13px] leading-relaxed text-gray-700"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
          >
            {companyName} receives proof you meet these {requestedAttrs.length}{" "}
            requirements. They cannot see your ID photo or any other personal
            details.
          </p>
          <p
            className="mt-1.5 text-[11px] font-medium text-emerald-700"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
          >
            Verified by Intel TDX Secure Enclave
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200">
        <ul className="divide-y divide-gray-100">
          {requestedAttrs.map((attr, idx) => (
            <li key={idx} className="py-3.5">
              <p
                className="text-[16px] font-semibold text-gray-900"
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                {formatVerificationAttributeKey(attr)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {!storedImageData ? (
        <p
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-[13px] text-amber-900"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          Approve needs your ID on file from onboarding. If you cleared storage or
          use another device, complete identity verification again (upload your ID)
          from the vault.
        </p>
      ) : null}

      <div className="mt-6 flex min-h-[48px] flex-row gap-3 sm:min-h-[56px]">
        <button
          type="button"
          onClick={() => void handleApprove()}
          disabled={submitting || !storedImageData}
          className="flex h-12 min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-dokimos-accent text-sm font-semibold text-white transition-colors hover:bg-dokimos-accentHover disabled:opacity-50 sm:h-14 sm:text-[15px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          <Shield size={16} className="shrink-0 text-white" />
          <span className="truncate">{submitting ? "Approving..." : "Approve and Share"}</span>
        </button>

        <button
          type="button"
          onClick={() => void handleDeny()}
          disabled={submitting}
          className="h-12 min-h-[44px] min-w-0 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#EF4444] transition-colors hover:bg-gray-50 disabled:opacity-50 sm:h-14 sm:text-[15px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          {submitting ? "Processing..." : "Deny"}
        </button>
      </div>
    </div>
  );
}
