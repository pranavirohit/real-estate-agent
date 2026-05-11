import { Suspense } from "react";
import { OnboardingFlow } from "@/components/dokimos/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[100dvh] w-full bg-gray-100" aria-hidden />}
    >
      <OnboardingFlow />
    </Suspense>
  );
}
