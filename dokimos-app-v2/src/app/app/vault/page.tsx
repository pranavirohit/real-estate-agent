"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { Screen03Vault } from "@/components/DokimosFlow";
import { ExplainerModal } from "@/components/dokimos/ExplainerModal";
import { PostVerificationModal } from "@/components/dokimos/PostVerificationModal";
import type { PostVerificationCloseSource } from "@/components/dokimos/PostVerificationModal";
import {
  STORAGE_EXPLAINER_SEEN,
  STORAGE_ONBOARDING_COMPLETE,
  STORAGE_POST_VERIFICATION_EXPLAINER_SEEN,
} from "@/types/dokimos";

export default function VaultPage() {
  const { attestationData } = useDokimosApp();
  const [showExplainer, setShowExplainer] = useState(false);
  const [showPostVerification, setShowPostVerification] = useState(false);
  const explainerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const onboardingDone = localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) === "1";
      const postSeen = localStorage.getItem(STORAGE_POST_VERIFICATION_EXPLAINER_SEEN) === "1";
      const explainerSeen = localStorage.getItem(STORAGE_EXPLAINER_SEEN) === "1";

      if (onboardingDone && !postSeen) {
        setShowPostVerification(true);
        return;
      }

      if (onboardingDone && !explainerSeen) {
        setShowExplainer(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handlePostVerificationClose = useCallback((source: PostVerificationCloseSource) => {
    setShowPostVerification(false);

    if (explainerTimeoutRef.current) {
      clearTimeout(explainerTimeoutRef.current);
      explainerTimeoutRef.current = null;
    }

    if (source === "learn-more") {
      return;
    }

    try {
      const explainerSeen = localStorage.getItem(STORAGE_EXPLAINER_SEEN) === "1";
      if (!explainerSeen) {
        explainerTimeoutRef.current = setTimeout(() => {
          setShowExplainer(true);
          explainerTimeoutRef.current = null;
        }, 500);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (explainerTimeoutRef.current) {
        clearTimeout(explainerTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <PostVerificationModal isOpen={showPostVerification} onClose={handlePostVerificationClose} />

      <ExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />

      <Screen03Vault showHeaderBack={false} attestationData={attestationData} />
    </>
  );
}
