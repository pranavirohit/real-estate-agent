"use client";

import { ExternalLink } from "lucide-react";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";

const DEFAULT_SANS = "var(--font-instrument-sans), system-ui, sans-serif" as const;
const serif = "var(--font-instrument-serif), Georgia, serif" as const;

type HowDokimosProtectsContentProps = {
  /** When true, omits the h1 (e.g. modal already has a title). */
  omitMainHeading?: boolean;
  /** When true, shows the Eigen "View technical details" button in the trust section. */
  showTechnicalDetailsButton?: boolean;
  /** Body/UI sans stack (default: Geist via `--font-instrument-sans`). Use `--font-landing-sans` for Plus Jakarta. */
  sansFontStack?: string;
  /** Section titles (h1 when shown, h2 blocks). Defaults to Instrument Serif. Match `sansFontStack` for all-sans (e.g. Plus Jakarta in the How it works modal). */
  headingFontStack?: string;
};

const STEPS: {
  n: number;
  title: string | null;
  body: string;
  /** Optional second paragraph (step 1: encrypted context). */
  extra?: string;
}[] = [
  {
    n: 1,
    title: "You upload your ID",
    body: "Your document is sent over an encrypted connection to a secure processor.",
    extra:
      "That means the data is protected in transit between your device and the processor, similar to when you pay or sign in somewhere sensitive online, so someone listening in along the way can't read it.",
  },
  {
    n: 2,
    title: "Your document and face are verified",
    body:
      "Your ID and selfie are handled in a secure space built for identity checks. The system checks that your document is valid and that your face matches. Your images aren't kept as regular files that could be opened or browsed later like a normal upload.",
  },
  {
    n: 3,
    title: "You get proof",
    body:
      "You receive a credential you can use to approve requests. It's not a full copy of your ID saved for everyday viewing.",
  },
  {
    n: 4,
    title: "Share on your terms",
    body: "Approve age or identity checks without re-uploading your document every time.",
  },
];

export function HowDokimosProtectsContent({
  omitMainHeading = false,
  showTechnicalDetailsButton = true,
  sansFontStack = DEFAULT_SANS,
  headingFontStack,
}: HowDokimosProtectsContentProps) {
  const eigenUrl = getEigenVerificationDashboardUrl();
  const sans = sansFontStack;
  const headingFont = headingFontStack ?? serif;

  return (
    <>
      {!omitMainHeading && (
        <h1
          className="text-center text-[28px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[32px]"
          style={{ fontFamily: headingFont }}
        >
          How Dokimos protects your identity
        </h1>
      )}

      <div
        className={omitMainHeading ? "mt-0 flex flex-col items-center gap-3" : "mt-8 flex flex-col items-center gap-3"}
        style={{ fontFamily: sans }}
      >
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="flex w-full max-w-md gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dokimos-accent text-[14px] font-semibold text-white"
              aria-hidden
            >
              {step.n}
            </div>
            <div>
              {step.title ? (
                <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
              ) : null}
              <p
                className={
                  step.title
                    ? "mt-1 text-[13px] leading-relaxed text-slate-600"
                    : "text-[13px] leading-relaxed text-slate-600"
                }
              >
                {step.body}
              </p>
              {step.extra ? (
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{step.extra}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[20px] font-semibold text-slate-900" style={{ fontFamily: headingFont }}>
          What happens to your ID?
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          Your ID is sent using encryption (like HTTPS: data is scrambled in transit so others can't read it)
          to a secure environment that can verify it and produce a signed result. The goal is verification,
          not keeping your document as an ordinary file for employees to open.
        </p>
        <p className="text-[14px] font-medium text-slate-800">In simple terms, the system can:</p>
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-slate-600">
          <li>Read what it needs to verify</li>
          <li>
            Produce a cryptographic attestation you can share (a compact signed record of the check, without
            your ID file)
          </li>
          <li>Follow a policy that limits what's retained after verification</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[20px] font-semibold text-slate-900" style={{ fontFamily: headingFont }}>
          What is a verified credential?
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          Instead of sending your physical ID image to every service, you can present a digital proof that
          your identity was verified, so organizations can rely on the check without receiving a copy of your
          document.
        </p>
        <p className="text-[14px] leading-relaxed text-slate-600">Depending on the request, that can mean:</p>
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-slate-600">
          <li>Proof of age without exposing your full birthdate</li>
          <li>Proof the document was verified, not the raw document itself</li>
          <li>Proof tied to cryptography rather than &quot;trust us&quot;</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3" style={{ fontFamily: sans }}>
        <h2 className="text-[20px] font-semibold text-slate-900" style={{ fontFamily: headingFont }}>
          How can I trust this?
        </h2>
        <p className="text-[14px] leading-relaxed text-slate-600">
          The verification outcome can be published together with details that let anyone double-check it
          independently, for example what code ran and when. You can open the verification dashboard to
          inspect the EigenCompute application tied to this deployment.
        </p>
        {showTechnicalDetailsButton ? (
          <button
            type="button"
            onClick={() => window.open(eigenUrl, "_blank", "noopener,noreferrer")}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-dokimos-accent px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
          >
            View technical details
            <ExternalLink size={16} aria-hidden />
          </button>
        ) : null}
      </section>
    </>
  );
}
