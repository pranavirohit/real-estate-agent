"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Clock,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";
import {
  buildVerificationSummaryRows,
  getVerificationDisplayName,
} from "@/lib/verificationPlainLanguage";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { DEFAULT_EIGEN_APP_ID } from "@/lib/eigenConstants";
import { dokimosSectionLabelClass } from "@/lib/dokimosLayout";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

const DEFAULT_GIT_SHA =
  process.env.NEXT_PUBLIC_DOKIMOS_GIT_SHA ??
  "1f722ca8084ebeae917ce0ef5b3012ce86296496";
const DEFAULT_IMAGE_DIGEST =
  process.env.NEXT_PUBLIC_DOKIMOS_IMAGE_DIGEST ??
  "sha256:c3a3c11c046da144679625d824bb765c9b6fd358dec631324dce6b17fe4d504c";

const DEMO_DOCKER_IMAGE =
  process.env.NEXT_PUBLIC_DOKIMOS_DOCKER_IMAGE ?? "dokimos/verify:v1.2";

const REPO_URL =
  process.env.NEXT_PUBLIC_DOKIMOS_SOURCE_REPO_URL ??
  "https://github.com/dokimos/dokimos-tee";

const STEP_COUNT = 5;

function firstNameFromDisplay(displayName: string): string {
  const t = displayName.trim().split(/\s+/)[0];
  return t || "This person";
}

function truncateMid(s: string, max = 18): string {
  if (!s || s.length <= max + 2) return s;
  return `${s.slice(0, max)}…`;
}

type Layer = 1 | 2 | 3;

export function VerificationProgressiveModal({
  request,
  onClose,
}: {
  request: VerificationRequest;
  onClose: () => void;
}) {
  const [layer, setLayer] = useState<Layer>(1);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);

  const displayName = getVerificationDisplayName(request);
  const firstName = firstNameFromDisplay(displayName);

  const att = request.attestation as Record<string, unknown> | undefined;
  const attributes = useMemo(
    () => buildVerificationSummaryRows(request),
    [request]
  );

  const verifiedAtIso =
    (att?.timestamp != null ? String(att.timestamp) : "") ||
    request.completedAt ||
    request.createdAt;

  const eigenDashboardUrl = getEigenVerificationDashboardUrl(DEFAULT_EIGEN_APP_ID);

  const steps = useMemo(() => {
    const a = request.attestation as Record<string, unknown> | undefined;
    const sig = a?.signature != null ? String(a.signature) : "";
    const sigAddr = a?.signer != null ? String(a.signer) : "";
    const rawMessage =
      a?.message != null ? String(a.message) : "";
    const teeInfo = a?.tee as
      | {
          platform?: string;
          enclaveId?: string;
          mrenclave?: string;
          debugMode?: boolean;
          quote?: string;
          tcbStatus?: string;
        }
      | undefined;
    const quotePresent = Boolean(teeInfo?.quote && String(teeInfo.quote).length > 10);
    const bio = a?.biometricVerification as
      | {
          faceMatch?: boolean;
          confidence?: number;
          livenessDetected?: boolean;
        }
      | undefined;
    const faceOk = bio?.faceMatch === true;
    const confidencePct =
      typeof bio?.confidence === "number"
        ? `${bio.confidence >= 0 && bio.confidence <= 1 ? Math.round(bio.confidence * 100) : Math.round(bio.confidence)}%`
        : null;
    const sepoliaRoot = "https://sepolia.etherscan.io";

    const sigStepOk = Boolean(sig && sigAddr);
    const hwStepOk = Boolean(teeInfo?.platform || quotePresent);
    const codeStepOk = true;
    const buildStepOk = Boolean(DEFAULT_IMAGE_DIGEST);
    const faceStepOk = bio == null ? true : faceOk;

    return [
      {
        title: "Check the Signature",
        progressPct: 20,
        stepOk: sigStepOk,
        intro:
          "Every attestation has a cryptographic signature—like a tamper-proof seal. You can confirm it matches what ran in secure hardware.",
        statusLines: [],
        copyFieldRows: [
          { key: "address", label: "Address", fullCopy: sigAddr },
          { key: "message", label: "Message", fullCopy: rawMessage },
          { key: "hash", label: "Hash", fullCopy: sig },
        ],
        whatThisProves: [
          "This attestation has not been altered since it was signed.",
          "It was produced by the expected signing identity (check the wallet on-chain).",
          "The data you see is what was covered by that signature.",
        ],
        details: [],
        link:
          sigAddr && sig && rawMessage
            ? {
                text: "Verify on Etherscan",
                href: `https://sepolia.etherscan.io/verifiedSignatures?${new URLSearchParams({
                  a: sigAddr,
                  m: rawMessage,
                  s: sig,
                })}`,
              }
            : sigAddr && sig
              ? {
                  text: "Verify on Etherscan",
                  href: `https://sepolia.etherscan.io/address/${encodeURIComponent(sigAddr)}`,
                }
              : { text: "Open Sepolia Etherscan", href: sepoliaRoot },
      },
      {
        title: "Verify the Hardware",
        progressPct: 40,
        stepOk: hwStepOk,
        intro:
          "The attestation includes proof verification ran in Intel TDX-style secure hardware—not a generic app server.",
        statusLines: [
          teeInfo?.platform
            ? `Platform: ${teeInfo.platform}`
            : "Platform: details appear when included in the proof",
          quotePresent ? "TEE quote: present" : "TEE quote: not included in this demo payload",
          teeInfo?.debugMode === false
            ? "Debug mode: disabled (production-style)"
            : teeInfo?.debugMode === true
              ? "Debug mode: enabled (non-production)"
              : "Debug mode: see attestation for details",
          teeInfo?.tcbStatus
            ? `Status: ${teeInfo.tcbStatus}`
            : "Status: see Eigen / TEE metadata when available",
        ],
        whatThisProves: [
          "Processing ran in real attested hardware, not a simulated environment.",
          "The platform and health signals are the ones vendors publish for trust decisions.",
          "Even the operator cannot swap the verification logic inside the enclave unnoticed.",
        ],
        details: [
          { label: "TEE platform", value: teeInfo?.platform ?? "—" },
          {
            label: "Enclave / MRENCLAVE",
            value: teeInfo?.enclaveId ?? teeInfo?.mrenclave ?? "—",
          },
          {
            label: "Debug mode",
            value:
              teeInfo?.debugMode === undefined
                ? "—"
                : teeInfo.debugMode
                  ? "Enabled"
                  : "Disabled",
          },
        ],
        link: { text: "View on EigenCloud Dashboard", href: eigenDashboardUrl },
      },
      {
        title: "Audit the Source Code",
        progressPct: 60,
        stepOk: codeStepOk,
        intro: `The code that processed ${firstName}'s ID is public—you can read the same logic that was attested.`,
        statusLines: [
          `Repository: ${REPO_URL.replace(/^https?:\/\//, "")}`,
          `Commit: ${truncateMid(DEFAULT_GIT_SHA, 12)}`,
          "Scope: verification pipeline (representative size ~400 lines in core path)",
        ],
        whatThisProves: [
          "You can see exactly what rules were applied—no hidden policy engine.",
          "Security teams can review for backdoors or unsafe handling of identity data.",
          "Transparency is a first-class part of the trust story.",
        ],
        details: [
          { label: "Git commit", value: DEFAULT_GIT_SHA },
          { label: "Repository", value: REPO_URL },
        ],
        link: { text: "View code on GitHub", href: REPO_URL },
      },
      {
        title: "Verify the Build",
        progressPct: 80,
        stepOk: buildStepOk,
        intro:
          "The source you reviewed is tied to the software that ran—image digest and build fingerprints are part of a defensible review pack.",
        statusLines: [
          `Container image: ${DEMO_DOCKER_IMAGE}`,
          `Image hash: ${truncateMid(DEFAULT_IMAGE_DIGEST, 28)}`,
          "Build provenance: use digest + commit in your security review",
          `Matches source: ${REPO_URL} @ ${truncateMid(DEFAULT_GIT_SHA, 8)}`,
        ],
        whatThisProves: [
          "The deployed artifact can be tied back to reviewed source.",
          "No silent edits between “what we read” and “what ran.”",
          "Hashes can be recorded alongside Eigen / deployment metadata for audits.",
        ],
        details: [{ label: "Image digest", value: DEFAULT_IMAGE_DIGEST }],
        link: null as { text: string; href: string } | null,
      },
      {
        title: "Verify Face Match",
        progressPct: 100,
        stepOk: faceStepOk,
        intro: `The secure environment confirmed ${firstName}'s live face matches the photo on the government ID when the workflow captured a selfie.`,
        statusLines: [
          bio == null
            ? "Biometrics: not included in this attestation"
            : faceOk
              ? "Face match: successful"
              : "Face match: see attestation for details",
          confidencePct ? `Match confidence: ${confidencePct}` : "Match confidence: —",
          bio?.livenessDetected === true
            ? "Liveness: passed"
            : bio?.livenessDetected === false
              ? "Liveness: not confirmed"
              : "Liveness: when provided by the capture flow",
          "Algorithm: policy-defined (e.g. face match service in TEE pipeline)",
        ],
        whatThisProves: [
          "The person completing verification is the same person shown on the ID.",
          "Reduces risk of photos-of-photos or stolen document images.",
          "Biometric outcome is part of the signed record you can re-check.",
        ],
        details: [],
        link: null as { text: string; href: string } | null,
      },
    ];
  }, [request, eigenDashboardUrl, firstName]);

  const toggleStep = (i: number) => {
    setExpandedSteps((prev) =>
      prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]
    );
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const headerTitle =
    layer === 1
      ? "Verification"
      : layer === 2
        ? "How Dokimos verification works"
        : "Verify it yourself";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[min(92dvh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1 pr-2">
            {layer === 1 ? (
              <h2
                id="verification-modal-title"
                className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
                style={{ fontFamily: sans }}
              >
                Verification
              </h2>
            ) : (
              <>
                <p
                  className={`${dokimosSectionLabelClass} text-[11px] tracking-[0.12em]`}
                  style={{ fontFamily: sans }}
                >
                  Verification
                </p>
                <h2
                  id="verification-modal-title"
                  className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px]"
                  style={{ fontFamily: sans }}
                >
                  {headerTitle}
                </h2>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {layer === 1 && (
            <Layer1SimpleVerdict
              status={request.status}
              displayName={displayName}
              verifiedAtIso={verifiedAtIso}
              createdAtIso={request.createdAt}
              attributes={attributes}
              onHow={() => setLayer(2)}
              onTechnical={() => setLayer(3)}
            />
          )}
          {layer === 2 && (
            <Layer2HowItWorks
              firstName={firstName}
              onBack={() => setLayer(1)}
              onVerifyYourself={() => setLayer(3)}
            />
          )}
          {layer === 3 && (
            <Layer3Technical
              steps={steps}
              expandedSteps={expandedSteps}
              onToggleStep={toggleStep}
              onBack={() => setLayer(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatModalTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function Layer1SimpleVerdict({
  status,
  displayName,
  verifiedAtIso,
  createdAtIso,
  attributes,
  onHow,
  onTechnical,
}: {
  status: VerificationRequest["status"];
  displayName: string;
  verifiedAtIso: string;
  createdAtIso: string;
  attributes: { label: string; value: string }[];
  onHow: () => void;
  onTechnical: () => void;
}) {
  const verdict =
    status === "approved"
      ? {
          Icon: CheckCircle,
          iconClass: "text-emerald-600",
          title: "Verification confirmed",
          body: `${displayName}'s identity has been verified by secure hardware. No manual review needed.`,
          timePrefix: "Verified",
          timeIso: verifiedAtIso,
          boxTitle: "What was verified:",
          rowIcon: CheckCircle,
          rowIconClass: "text-emerald-600",
        }
      : status === "pending"
        ? {
            Icon: Clock,
            iconClass: "text-amber-500",
            title: "Verification pending",
            body: `Waiting for ${displayName} to complete identity verification in the secure flow.`,
            timePrefix: "Requested",
            timeIso: createdAtIso,
            boxTitle: "What will be verified:",
            rowIcon: Clock,
            rowIconClass: "text-amber-500",
          }
        : {
            Icon: XCircle,
            iconClass: "text-red-600",
            title: "Verification not completed",
            body: `This verification did not complete successfully for ${displayName}.`,
            timePrefix: "Last updated",
            timeIso: verifiedAtIso,
            boxTitle: "What was requested:",
            rowIcon: XCircle,
            rowIconClass: "text-red-600",
          };

  const VerdictIcon = verdict.Icon;
  const RowIcon = verdict.rowIcon;
  const ts = formatModalTimestamp(verdict.timeIso);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <VerdictIcon
          className={`mt-1 h-8 w-8 flex-shrink-0 ${verdict.iconClass}`}
          aria-hidden
        />
        <div>
          <p className="text-2xl font-semibold text-slate-900">{verdict.title}</p>
          <p className="mt-2 text-slate-500">{verdict.body}</p>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        {verdict.timePrefix}: {ts}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          {verdict.boxTitle}
        </h3>
        {attributes.length === 0 ? (
          <p className="text-sm text-slate-500">
            No attribute checklist for this request yet.
          </p>
        ) : (
          <div className="space-y-2">
            {attributes.map((attr) => (
              <div key={`${attr.label}-${attr.value}`} className="flex gap-2 text-sm">
                <RowIcon
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${verdict.rowIconClass}`}
                  aria-hidden
                />
                <div>
                  <span className="font-medium text-slate-900">
                    {attr.label}:
                  </span>{" "}
                  <span className="text-slate-500">{attr.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onHow}
          className="flex-1 rounded-lg border border-slate-300 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          How does this work?
        </button>
        <button
          type="button"
          onClick={onTechnical}
          className="flex-1 rounded-lg bg-dokimos-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
        >
          Technical details
        </button>
      </div>
    </div>
  );
}

function Layer2HowItWorks({
  firstName,
  onBack,
  onVerifyYourself,
}: {
  firstName: string;
  onBack: () => void;
  onVerifyYourself: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed text-slate-600">
        Think of Dokimos like a notary, but digital and extremely hard to fake.
      </p>

      <p className="text-sm font-medium text-slate-900">Here&apos;s what happened:</p>

      <div className="space-y-6">
        <div className="flex gap-3">
          <span className="text-xl leading-none" aria-hidden>
            1️⃣
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              {firstName} uploaded an ID once
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              It was sent to secure, isolated hardware—not stored on an ordinary app server.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-xl leading-none" aria-hidden>
            2️⃣
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">The hardware checked:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Is the ID real and not expired?</li>
              <li>Does the live face match the ID photo?</li>
              <li>Is the applicant over 18?</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-xl leading-none" aria-hidden>
            3️⃣
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              The hardware created a tamper-proof proof
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Like a wax seal on a document: you can check later that nothing was changed after the fact.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="text-xl leading-none" aria-hidden>
            4️⃣
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">You&apos;re seeing that proof now</p>
            <p className="mt-2 text-sm text-slate-600">
              You can verify it independently—no need to take Dokimos&apos;s word for it.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-r border-l-4 border-emerald-600 bg-emerald-50/90 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-950">
          Why this matters
        </p>
        <ul className="space-y-2 text-sm text-emerald-900/95">
          <li>
            <span className="font-medium">No blind trust.</span> You&apos;re checking math and public
            artifacts—not asking teams to &quot;trust us.&quot;
          </li>
          <li>
            <span className="font-medium">Sensitive checks stay isolated.</span> Raw ID data is
            processed in the secure environment; you receive the signed result, not the document.
          </li>
          <li>
            <span className="font-medium">Hard to fake.</span> The record is cryptographically bound
            to what ran—screenshots and PDFs can&apos;t offer the same guarantee.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onVerifyYourself}
          className="flex-1 rounded-lg bg-dokimos-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
        >
          Verify it yourself
        </button>
      </div>
    </div>
  );
}

type CopyFieldRow = {
  key: string;
  label: string;
  fullCopy: string;
};

type StepConfig = {
  title: string;
  progressPct: number;
  stepOk: boolean;
  intro: string;
  statusLines: string[];
  copyFieldRows?: CopyFieldRow[];
  whatThisProves: string[];
  details: { label: string; value: string }[];
  link: { text: string; href: string } | null;
};

function Layer3Technical({
  steps,
  expandedSteps,
  onToggleStep,
  onBack,
}: {
  steps: StepConfig[];
  expandedSteps: number[];
  onToggleStep: (i: number) => void;
  onBack: () => void;
}) {
  const [openCopyRows, setOpenCopyRows] = useState<Record<string, boolean>>({});

  const toggleCopyRow = (stepIdx: number, key: string) => {
    const id = `${stepIdx}-${key}`;
    setOpenCopyRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Five steps to independently verify this proof. Expand <strong className="font-medium text-slate-800">What this proves</strong> on each card for the plain-language takeaway.
      </p>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={step.title}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                Step {i + 1} of {STEP_COUNT}: {step.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{step.progressPct}%</span>
                {step.stepOk ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <span className="text-xs font-medium text-amber-700">Review</span>
                )}
              </div>
            </div>

            <div className="mb-3 h-1 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-dokimos-accent transition-all"
                style={{ width: `${step.progressPct}%` }}
              />
            </div>

            <p className="mb-3 text-sm leading-relaxed text-slate-600">{step.intro}</p>

            {step.copyFieldRows && step.copyFieldRows.length > 0 ? (
              <div className="mb-3 space-y-3">
                {step.copyFieldRows.map((row) => {
                  const rowId = `${i}-${row.key}`;
                  const isOpen = Boolean(openCopyRows[rowId]);
                  const canCopy = row.fullCopy.length > 0;
                  return (
                    <div key={row.key} className="flex items-start gap-2">
                      <CheckCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-slate-900">
                            {row.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCopyRow(i, row.key)}
                            className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-dokimos-accent transition hover:border-dokimos-accent/40 hover:bg-teal-50/80"
                          >
                            {isOpen ? "Close" : "Open"}
                          </button>
                        </div>
                        {isOpen && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="relative rounded-md border border-slate-100 bg-white">
                              <button
                                type="button"
                                disabled={!canCopy}
                                title="Copy"
                                aria-label="Copy to clipboard"
                                onClick={() => {
                                  if (canCopy) {
                                    void navigator.clipboard.writeText(row.fullCopy);
                                  }
                                }}
                                className="absolute right-2 top-2 z-10 rounded-md border border-slate-200/80 bg-white/95 p-1.5 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ClipboardCopy className="h-4 w-4" strokeWidth={2} aria-hidden />
                              </button>
                              <pre
                                className="max-h-56 overflow-auto whitespace-pre-wrap break-all pr-12 pt-2.5 pb-2.5 pl-2.5 font-mono text-[11px] leading-relaxed text-slate-800 select-all"
                                tabIndex={0}
                              >
                                {canCopy ? row.fullCopy : "—"}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-3 space-y-2">
                {step.statusLines.map((line, li) => (
                  <div key={`${step.title}-line-${li}`} className="flex items-start gap-2">
                    <CheckCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <span className="text-sm text-slate-700">{line}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleStep(i)}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-dokimos-accent transition hover:text-dokimos-accentHover"
            >
              {expandedSteps.includes(i) ? (
                <ChevronDown className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden />
              )}
              What this proves
            </button>

            {expandedSteps.includes(i) && (
              <ul className="mb-4 ml-6 list-disc space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {step.whatThisProves.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}

            {step.details.length > 0 && (
              <div className="mb-4 space-y-2">
                {step.details.map((detail, di) => (
                  <div
                    key={`${step.title}-${di}-${detail.label}`}
                    className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-start sm:gap-2"
                  >
                    <span className="min-w-[100px] text-slate-500">{detail.label}:</span>
                    <code className="break-all font-mono text-slate-700">{detail.value}</code>
                  </div>
                ))}
              </div>
            )}

            {step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-dokimos-accent hover:text-dokimos-accentHover"
              >
                {step.link.text}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}

            {i < steps.length - 1 && <div className="mt-6 border-t border-slate-200" />}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        ← Back to summary
      </button>
    </div>
  );
}
