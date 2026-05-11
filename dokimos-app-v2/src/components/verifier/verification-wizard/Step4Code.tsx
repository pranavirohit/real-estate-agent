"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Code,
} from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

interface Step4CodeProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

const GITHUB_URL =
  process.env.NEXT_PUBLIC_DOKIMOS_SOURCE_REPO_URL ??
  "https://github.com/dokimos/dokimos-tee";

export default function Step4Code({ attestation, onNext }: Step4CodeProps) {
  const [showProof, setShowProof] = useState(true);
  const [showHow, setShowHow] = useState(false);

  const eigenDashboardUrl =
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(
      attestation.eigen?.appId ?? DEFAULT_EIGEN_APP_ID
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Verify the Code
        </h2>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-semibold text-emerald-900">
          What are reproducible builds?
        </h3>
        <p className="mt-2 text-sm text-emerald-900/90">
          Reproducible builds mean independent parties can rebuild the same
          artifact from the same source and dependencies and compare outputs
          (often digests or hashes).
        </p>
        <p className="mt-2 text-sm text-emerald-900/90">
          <strong>Think of it as:</strong> two cooks following the same recipe
          should produce the same dish—if not, something changed.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">You can review:</p>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {`Source code on GitHub`}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Follow the repository linked below for the current project.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Deployment metadata on EigenCloud
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Use the dashboard to compare published artifacts with your review
              expectations.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Your own rebuild process
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Advanced users can follow internal runbooks to reproduce builds.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Code className="h-4 w-4" aria-hidden />
          <span>View source on GitHub</span>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <a
          href={eigenDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <span>View EigenCloud dashboard</span>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowHow(!showHow)}
          className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <span>How to rebuild (advanced)</span>
          {showHow ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>

        {showHow && (
          <div className="space-y-2 rounded-b-lg border-t border-slate-200 bg-slate-900 px-3 py-3 font-mono text-xs text-slate-100">
            <p className="text-slate-400"># Clone</p>
            <p>git clone {GITHUB_URL}</p>
            <p className="pt-2 text-slate-400"># Install & build (example)</p>
            <p>cd dokimos-tee &amp;&amp; npm install</p>
            <p className="pt-2 text-slate-400"># Compare digests with EigenCloud</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
        >
          <span className="font-semibold text-slate-900">What this proves</span>
          {showProof ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          )}
        </button>

        {showProof && (
          <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-2 text-sm text-slate-700">
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Transparent process</p>
                <p className="mt-1">
                  Open source and published deployment metadata support audits.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Independent review</p>
                <p className="mt-1">
                  Teams can validate artifacts without relying on a single
                  vendor narrative.
                </p>
              </div>
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
          Continue to Step 5 →
        </button>
      </div>
    </div>
  );
}
