"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Copy,
} from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";

interface Step3WalletProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

export default function Step3Wallet({
  attestation,
  onNext,
}: Step3WalletProps) {
  const [showProof, setShowProof] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(attestation.signer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eigenDashboardUrl =
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(
      attestation.eigen?.appId ?? DEFAULT_EIGEN_APP_ID
    );

  const appIdPreview =
    typeof attestation.eigen?.appId === "string"
      ? attestation.eigen.appId.slice(0, 10)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Check the Wallet
        </h2>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <h3 className="mb-2 font-semibold text-indigo-900">
          What is this address?
        </h3>
        <p className="mb-3 text-sm text-indigo-800">
          Dokimos signs attestations with a dedicated wallet derived from the
          deployment configuration. You can treat it like a public
          &quot;signing identity&quot; for the service.
        </p>
        <p className="text-sm text-indigo-800">
          <strong>Think of it as:</strong> A stamp that corresponds to a
          specific key—verifiers can confirm signatures against that address.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-800">
          Wallet that signed this attestation:
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 break-all rounded border border-slate-200 bg-white px-3 py-2 font-mono text-sm">
            {attestation.signer}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">How to verify</h3>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              1
            </span>
            <span>
              Click &quot;View on EigenCloud Dashboard&quot; below to open your
              deployment page.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              2
            </span>
            <span>
              Scroll down to find the <strong>Derived Addresses</strong>{" "}
              section.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              3
            </span>
            <div className="min-w-0 flex-1">
              <span>
                Under &quot;EVM Addresses,&quot; look for the{" "}
                <strong>first address</strong> in the list:
              </span>
              <code className="mt-1 block break-all rounded border border-indigo-200 bg-indigo-50 px-2 py-1 font-mono text-xs">
                {attestation.signer}
              </code>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              4
            </span>
            <span>
              Confirm the first derived address matches the signer address above.
            </span>
          </li>
        </ol>
      </div>

      <details className="rounded-lg border border-slate-200">
        <summary className="cursor-pointer p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          What are &quot;Derived Addresses&quot;?
        </summary>
        <div className="space-y-2 border-t border-slate-200 px-3 pb-3 pt-2 text-sm text-slate-600">
          <p>
            <strong>Derived Addresses</strong> are wallet addresses
            mathematically generated from a single master secret (a mnemonic seed
            phrase) stored in EigenCloud&apos;s Key Management Service.
          </p>
          <p>
            From one mnemonic, you can derive <strong>multiple addresses</strong>{" "}
            using different &quot;derivation paths.&quot; This is called a
            Hierarchical Deterministic (HD) wallet.
          </p>
          <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
            <p className="font-mono text-xs text-slate-700">
              Mnemonic → Address 0 (index 0)
              <br />
              Mnemonic → Address 1 (index 1)
              <br />
              Mnemonic → Address 2 (index 2)
              <br />
              …
            </p>
          </div>
          <p>
            <strong>Why multiple addresses?</strong> Your app could use
            different addresses for different purposes (signing, receiving
            funds, etc.). Dokimos uses the{" "}
            <strong>first address (index 0)</strong> for signing attestations.
          </p>
          <p>
            <strong>What this proves:</strong> The signing wallet is
            cryptographically derived from your EigenCloud deployment&apos;s
            mnemonic—not a random wallet on your laptop. The private key was
            generated inside the TEE and never leaves.
          </p>
        </div>
      </details>

      <a
        href={eigenDashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <span>View on EigenCloud Dashboard</span>
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>

      <div className="rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setShowProof(!showProof)}
          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-50"
          aria-expanded={showProof}
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
                <p className="font-semibold text-slate-900">
                  The same wallet shows up in two places
                </p>
                <p className="mt-1">
                  In Step 1 you checked the signature from wallet{" "}
                  <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                    {attestation.signer.slice(0, 10)}…
                  </code>
                  . On EigenCloud, that <strong>exact</strong> address should be
                  the <strong>first</strong> row under Derived Addresses → EVM
                  Addresses. When both match, you know this is the real signing
                  wallet for this deployment—not an address we invented on the
                  spot.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">
                  The wallet belongs to this EigenCloud app
                </p>
                <p className="mt-1">
                  EigenCloud can create <strong>several</strong> addresses from
                  one securely stored secret (you&apos;ll see them listed under
                  Derived Addresses). Dokimos signs with the <strong>first</strong>{" "}
                  one. The secret never leaves the protected environment, so we
                  can&apos;t simply point at a random wallet and call it ours—it
                  has to line up with what EigenCloud shows for this app.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">
                  You can double-check without trusting us alone
                </p>
                <p className="mt-1">
                  {appIdPreview != null ? (
                    <>
                      Your EigenCloud page includes an App ID (
                      <code className="rounded bg-slate-100 px-1 font-mono text-xs">
                        {appIdPreview}…
                      </code>
                      ). You can use the dashboard and public Eigen tools to
                      confirm the deployment is real, open the address list, and
                      see that the signer matches—step by step, on your own.
                    </>
                  ) : (
                    <>
                      On your EigenCloud dashboard you can open the deployment,
                      view the address list, and confirm the signer matches what
                      you see here—no need to take our word for it when the
                      same numbers appear in EigenCloud&apos;s own UI.
                    </>
                  )}
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
          Continue to Step 4 →
        </button>
      </div>
    </div>
  );
}
