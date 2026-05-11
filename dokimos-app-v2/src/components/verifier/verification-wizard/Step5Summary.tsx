"use client";

import { CheckCircle, ExternalLink, Download } from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

interface Step5SummaryProps {
  attestation: WizardAttestation;
  onClose: () => void;
}

export default function Step5Summary({
  attestation,
  onClose,
}: Step5SummaryProps) {
  const handleDownloadAttestation = () => {
    const dataStr = JSON.stringify(attestation, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attestation-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const eigenDashboardUrl =
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(
      attestation.eigen?.appId ?? DEFAULT_EIGEN_APP_ID
    );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle
            className="h-10 w-10 text-emerald-600"
            aria-hidden
          />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Verification walkthrough complete
        </h2>
        <p className="mt-2 text-slate-600">
          You&apos;ve stepped through the five independent checks we surface in
          this demo.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">What this walkthrough covered:</p>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            1
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Cryptographic signature
            </p>
            <p className="text-xs text-slate-600">
              Copy fields and verify on Sepolia Etherscan
            </p>
          </div>
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            2
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Hardware attestation fields
            </p>
            <p className="text-xs text-slate-600">
              Platform / quote metadata as surfaced in the payload
            </p>
          </div>
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            3
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Signer identity</p>
            <p className="text-xs text-slate-600">
              Wallet address + EigenCloud context
            </p>
          </div>
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            4
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              Source & deployment
            </p>
            <p className="text-xs text-slate-600">
              GitHub + EigenCloud dashboard links
            </p>
          </div>
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            5
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Summary</p>
            <p className="text-xs text-slate-600">
              Export JSON for your records
            </p>
          </div>
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        </div>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
        <h3 className="font-semibold text-teal-900">What this means</h3>
        <p className="mt-2 text-sm text-teal-900/90">
          This wizard is a guided tour of the same artifacts your team would use
          in a security review: signatures, hardware metadata, signer address,
          and open links for code and deployment context. Your final assurance
          still depends on your policies and any external verification you run.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleDownloadAttestation}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          <Download className="h-4 w-4" aria-hidden />
          <span>Download full attestation JSON</span>
        </button>

        <a
          href={eigenDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-100 px-4 py-3 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-200"
        >
          <span>View on EigenCloud Dashboard</span>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-dokimos-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
        >
          Done
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        You can repeat these steps any time using the attestation JSON.
      </p>
    </div>
  );
}
