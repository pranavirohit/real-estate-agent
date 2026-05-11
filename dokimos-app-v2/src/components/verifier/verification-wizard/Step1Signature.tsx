"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle } from "lucide-react";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";

interface Step1SignatureProps {
  attestation: WizardAttestation;
  onNext: () => void;
}

export default function Step1Signature({
  attestation,
  onNext,
}: Step1SignatureProps) {
  const [showProof, setShowProof] = useState(true);

  const etherscanUrl =
    attestation.message && attestation.signature && attestation.signer
      ? `https://sepolia.etherscan.io/verifiedSignatures?${new URLSearchParams({
          a: attestation.signer,
          m: attestation.message,
          s: attestation.signature,
        })}`
      : "https://sepolia.etherscan.io/verifiedSignatures";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Check the Signature
        </h2>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <h3 className="font-semibold text-sky-900">What is Etherscan?</h3>
        <p className="mt-2 text-sm text-sky-900/90">
          Etherscan is like a public search engine for the Ethereum blockchain.
          Anyone can look up transactions, signatures, and wallet activity on a
          test network such as Sepolia.
        </p>
        <p className="mt-2 text-sm text-sky-900/90">
          <strong>Think of it as:</strong> a neutral place to confirm whether a
          digital signature matches a message and address—without trusting only
          us.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">How to verify</h3>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              1
            </span>
            <span>
              Click <strong>Verify on Etherscan</strong> below (opens Sepolia).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              2
            </span>
            <span>Use the three copied fields in Etherscan&apos;s signature flow.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800">
              3
            </span>
            <span>
              Confirm you see a successful verification for this message and
              signer.
            </span>
          </li>
        </ol>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <p className="mb-1 text-sm font-medium text-slate-800">
          Copy these fields into Etherscan:
        </p>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Address (signer)
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 break-all rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
              {attestation.signer}
            </code>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(attestation.signer)
              }
              className="shrink-0 rounded-lg bg-dokimos-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Message
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <code className="max-h-28 flex-1 overflow-y-auto break-all rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
              {attestation.message}
            </code>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(attestation.message)
              }
              className="h-fit shrink-0 self-start rounded-lg bg-dokimos-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Signature
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <code className="max-h-28 flex-1 overflow-y-auto break-all rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
              {attestation.signature}
            </code>
            <button
              type="button"
              onClick={() =>
                void navigator.clipboard.writeText(attestation.signature)
              }
              className="h-fit shrink-0 self-start rounded-lg bg-dokimos-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-dokimos-accentHover"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <a
        href={etherscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        <span>Verify on Etherscan</span>
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>

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
                <p className="font-semibold text-slate-900">Authentic message</p>
                <p className="mt-1">
                  The message was signed as shown—like a seal on a letter.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Tamper-evident</p>
                <p className="mt-1">
                  Changing the message would break the signature check.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <p className="font-semibold text-slate-900">Independent check</p>
                <p className="mt-1">
                  Etherscan helps you verify using public cryptography—not our
                  word alone.
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
          Continue to Step 2 →
        </button>
      </div>
    </div>
  );
}
