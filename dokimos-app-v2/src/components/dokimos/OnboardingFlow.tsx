"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import {
  Screen02BLiveness,
  Screen02UploadOrCapture,
  Screen02VerifyProcessing,
} from "@/components/DokimosFlow";
import { DokimosErrorBoundary } from "@/components/dokimos/DokimosErrorBoundary";

/**
 * Linear onboarding: government ID upload → liveness → TEE verify → `/app/vault`.
 * Optional `?step=0|1|2`. Legacy `?step=3|4|5` from the old 6-step flow maps to 0|1|2.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const { setAttestationData, setStoredImageData, markOnboardingComplete } = useDokimosApp();

  const [step, setStep] = useState(0);

  const advanceStep = useCallback(() => {
    setStep((s) => (s < 2 ? s + 1 : s));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => (s > 0 ? s - 1 : s));
  }, []);

  const finishVerification = useCallback(() => {
    markOnboardingComplete();
    router.push("/app/vault");
  }, [markOnboardingComplete, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setStep(0);
  };

  /** Apply ?step= at most once so advancing the flow cannot be reset by the same URL. */
  const urlStepAppliedRef = useRef(false);
  useLayoutEffect(() => {
    if (urlStepAppliedRef.current) return;
    if (stepParam == null || stepParam === "") {
      urlStepAppliedRef.current = true;
      return;
    }
    const n = parseInt(stepParam, 10);
    if (Number.isNaN(n)) {
      urlStepAppliedRef.current = true;
      return;
    }
    let mapped: number;
    if (n >= 0 && n <= 2) mapped = n;
    else if (n >= 3 && n <= 5) mapped = n - 3;
    else {
      urlStepAppliedRef.current = true;
      return;
    }
    urlStepAppliedRef.current = true;
    setStep(mapped);
  }, [stepParam]);

  let content: ReactNode;
  switch (step) {
    case 0:
      content = (
        <Screen02UploadOrCapture
          key="02"
          onNext={advanceStep}
          onBack={() => router.push("/")}
          setStoredImageData={(d) => setStoredImageData(d)}
        />
      );
      break;
    case 1:
      content = <Screen02BLiveness key="02b" onNext={advanceStep} onBack={goBack} />;
      break;
    case 2:
      content = (
        <Screen02VerifyProcessing
          key="02c"
          onBack={goBack}
          onSuccess={finishVerification}
          setAttestationData={(d) => setAttestationData(d)}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <>
      <DokimosErrorBoundary>
        <div className="relative min-h-[100dvh] w-full overflow-y-auto bg-gray-100">{content}</div>
      </DokimosErrorBoundary>

      {process.env.NODE_ENV === "development" && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] max-w-[calc(100vw-2rem)]">
          <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="text-center font-medium text-gray-600">
              Onboarding {step + 1} / 3
            </div>
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="rounded-lg bg-gray-100 px-3 py-2 text-gray-800 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (step < 2) advanceStep();
                else finishVerification();
              }}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-white"
            >
              {step < 2 ? "Next →" : "Finish → app"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
