"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

interface Step2HardwareProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

export default function Step2Hardware({
  attestation,
  onNext,
}: Step2HardwareProps) {
  /** Collapsed by default so the step is not overwhelming */
  const [showProofDetails, setShowProofDetails] = useState(false);

  const eigenDashboardUrl =
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(
      attestation.eigen?.appId ?? DEFAULT_EIGEN_APP_ID
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-slate-900">
          Verify the Infrastructure Platform
        </h2>
        <p className="text-slate-600">
          Confirm this deployment runs on Intel TDX secure hardware by checking
          EigenCloud.
        </p>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="mb-2 font-semibold text-indigo-900">What is Intel TDX?</h3>
        <p className="mb-3 text-sm text-indigo-800">
          Intel TDX (Trust Domain Extensions) is a security feature built into
          Intel processors. It creates an isolated, protected space inside the
          chip where data can be processed without other software on the host
          reading what happens inside.
        </p>
        <p className="text-sm text-indigo-800">
          <strong>Think of it as:</strong> a lockbox inside a computer. Even if
          someone breaks into the server, they cannot open this lockbox without
          keys that only the secure hardware has. Your ID is processed inside
          that boundary.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700"
            aria-hidden
          />
          <div>
            <h4 className="mb-1 font-semibold text-yellow-950">
              Per-transaction attestation pending
            </h4>
            <p className="text-sm text-yellow-900/95">
              This attestation does not include per-transaction TEE quote data;
              that depends on platform APIs still in development. You{" "}
              <strong>can</strong> still verify the <strong>infrastructure</strong>{" "}
              (deployment on Intel TDX, measurements on EigenCloud) on the
              dashboard below.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">
          How to verify the infrastructure
        </h3>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              1
            </span>
            <span>
              Click &quot;View on EigenCloud Dashboard&quot; below to open the
              deployment verification page.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              2
            </span>
            <span>
              Confirm <strong>Platform</strong> is listed as{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                Intel TDX
              </code>{" "}
              (not Shielded VM or another type).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              3
            </span>
            <div className="min-w-0 flex-1">
              <span>Check that measurements are present on the dashboard:</span>
              <ul className="ml-4 mt-2 list-disc space-y-1 text-slate-600">
                <li>
                  <strong>MRTD:</strong> code / deployment measurement (fingerprint
                  of what is deployed)
                </li>
                <li>
                  <strong>RTMR0–3:</strong> runtime measurements (state validation)
                </li>
                <li>
                  <strong>Platform status:</strong> hardware verification passed
                  (wording may vary by EigenCloud UI)
                </li>
              </ul>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              4
            </span>
            <span>
              <strong>This shows:</strong> the deployment&apos;s infrastructure is
              running on genuine Intel TDX-class hardware as published by EigenCloud.
            </span>
          </li>
        </ol>
      </div>

      <div className="flex justify-center sm:justify-start">
        <a
          href={eigenDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Shield className="h-5 w-5 shrink-0" aria-hidden />
          <span>View on EigenCloud Dashboard</span>
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowProofDetails(!showProofDetails)}
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
          aria-expanded={showProofDetails}
        >
          <span className="font-semibold text-slate-900">
            What this proves (and what&apos;s pending)
          </span>
          {showProofDetails ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          )}
        </button>

        {showProofDetails && (
          <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                What you can verify today
              </h4>
              <ul className="ml-7 list-disc space-y-2 text-sm text-slate-700">
                <li>
                  The deployment is registered and its platform type (e.g. Intel
                  TDX) is visible on EigenCloud.
                </li>
                <li>
                  Infrastructure-level measurements (e.g. MRTD, RTMRs) are shown
                  for independent review.
                </li>
                <li>
                  You can tie Dokimos to that deployment via App ID and public
                  dashboard—without trusting only in-app copy.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-orange-900">
                <XCircle className="h-5 w-5 shrink-0 text-orange-600" aria-hidden />
                Not proven by this attestation payload yet
              </h4>
              <ul className="ml-7 list-disc space-y-2 text-sm text-slate-700">
                <li>
                  That <em>this specific</em> HTTP response carried a fresh,
                  Intel-verified quote for this transaction (per-transaction
                  endpoints are still evolving).
                </li>
                <li>
                  That a raw TEE quote in <em>this</em> JSON is
                  cryptographically validated end-to-end in the wizard (not until
                  the platform exposes it consistently).
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-sm text-sky-950">
                <strong>The gap:</strong> Infrastructure-level attestation on
                EigenCloud is what you can check today. Per-transaction TDX quotes
                inside each attestation are not fully exposed yet; when they are,
                this flow can add quote verification without changing the overall
                story—swap in real fields and verification steps.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-dokimos-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
        >
          Continue to Step 3 →
        </button>
      </div>
    </div>
  );
}
