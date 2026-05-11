"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft } from "lucide-react";
import type { VerificationRequest } from "@/types/dokimos";
import type { WizardAttestation } from "@/components/verifier/verification-wizard/wizardAttestation";
import Step1Signature from "@/components/verifier/verification-wizard/Step1Signature";
import Step2Hardware from "@/components/verifier/verification-wizard/Step2Hardware";
import Step3Wallet from "@/components/verifier/verification-wizard/Step3Wallet";
import Step4Code from "@/components/verifier/verification-wizard/Step4Code";
import Step5Summary from "@/components/verifier/verification-wizard/Step5Summary";

interface VerificationWizardProps {
  request: VerificationRequest;
  open: boolean;
  onClose: () => void;
}

export default function VerificationWizard({
  request,
  open,
  onClose,
}: VerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mounted]);

  if (!open) return null;

  const attestation = request.attestation as WizardAttestation | null | undefined;
  const overlayClass =
    "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";

  if (!attestation || typeof attestation !== "object") {
    const noAttestationUi = (
      <div
        className={overlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-wizard-title"
      >
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
          <h2
            id="verification-wizard-title"
            className="text-lg font-semibold text-slate-900"
          >
            No attestation yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            This verification doesn&apos;t have a signed attestation. Complete the
            flow first, then try again.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-lg bg-dokimos-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-dokimos-accentHover"
          >
            Close
          </button>
        </div>
      </div>
    );
    if (!mounted) return null;
    return createPortal(noAttestationUi, document.body);
  }

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    onClose();
  };

  const wizardUi = (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-wizard-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Go back one step"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">
                Step {currentStep} of {totalSteps}
              </p>
              <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-dokimos-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium text-dokimos-accent tabular-nums">
              {Math.round(progress)}%
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close verification wizard"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h2 id="verification-wizard-title" className="sr-only">
            Independent verification wizard
          </h2>
          {currentStep === 1 && (
            <Step1Signature attestation={attestation} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <Step2Hardware attestation={attestation} onNext={handleNext} />
          )}
          {currentStep === 3 && (
            <Step3Wallet attestation={attestation} onNext={handleNext} />
          )}
          {currentStep === 4 && (
            <Step4Code attestation={attestation} onNext={handleNext} />
          )}
          {currentStep === 5 && (
            <Step5Summary attestation={attestation} onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(wizardUi, document.body);
}
