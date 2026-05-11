"use client";

import { useEffect } from "react";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";

/**
 * Deep links / bookmarks: open the same “How it works” overlay as in-app triggers.
 * Closing the modal navigates to `/app/vault` (see HowItWorksModalContext).
 */
export default function HowItWorksPage() {
  const { openHowItWorks } = useHowItWorksModal();

  useEffect(() => {
    openHowItWorks();
  }, [openHowItWorks]);

  return (
    <div
      className="min-h-[100dvh] w-full bg-dokimos-productCanvas"
      aria-hidden
    />
  );
}
