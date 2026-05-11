"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AttestationData, VerificationRequest } from "@/types/dokimos";
import {
  STORAGE_ATTESTATION,
  STORAGE_ID_IMAGE,
  STORAGE_ONBOARDING_COMPLETE,
} from "@/types/dokimos";

type DokimosAppContextValue = {
  attestationData: AttestationData | null;
  setAttestationData: (v: AttestationData | null) => void;
  storedImageData: string | null;
  setStoredImageData: (v: string | null) => void;
  selectedRequest: VerificationRequest | null;
  setSelectedRequest: (v: VerificationRequest | null) => void;
  markOnboardingComplete: () => void;
  isOnboardingComplete: () => boolean;
};

const DokimosAppContext = createContext<DokimosAppContextValue | null>(null);

export function DokimosAppProvider({ children }: { children: ReactNode }) {
  const [attestationData, setAttestationDataState] =
    useState<AttestationData | null>(null);

  const setAttestationData = useCallback((v: AttestationData | null) => {
    setAttestationDataState(v);
    try {
      if (typeof window !== "undefined") {
        if (v) {
          localStorage.setItem(STORAGE_ATTESTATION, JSON.stringify(v));
          console.log("💾 Attestation saved to localStorage");
        } else {
          localStorage.removeItem(STORAGE_ATTESTATION);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_ATTESTATION);
      if (stored) {
        const parsed = JSON.parse(stored) as AttestationData;
        setAttestationDataState(parsed);
        console.log("✅ Loaded attestation from localStorage");
      }
    } catch (err) {
      console.error("Failed to parse stored attestation:", err);
    }
  }, []);

  const [storedImageData, setStoredImageDataState] = useState<string | null>(null);

  const setStoredImageData = useCallback((v: string | null) => {
    setStoredImageDataState(v);
    try {
      if (typeof window !== "undefined") {
        if (v) localStorage.setItem(STORAGE_ID_IMAGE, v);
        else localStorage.removeItem(STORAGE_ID_IMAGE);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const img = localStorage.getItem(STORAGE_ID_IMAGE);
      if (img) setStoredImageDataState(img);
    } catch {
      /* ignore */
    }
  }, []);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);

  const markOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_ONBOARDING_COMPLETE, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const isOnboardingComplete = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) === "1";
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      attestationData,
      setAttestationData,
      storedImageData,
      setStoredImageData,
      selectedRequest,
      setSelectedRequest,
      markOnboardingComplete,
      isOnboardingComplete,
    }),
    [
      attestationData,
      setAttestationData,
      storedImageData,
      setStoredImageData,
      selectedRequest,
      setSelectedRequest,
      markOnboardingComplete,
      isOnboardingComplete,
    ]
  );

  return (
    <DokimosAppContext.Provider value={value}>
      {children}
    </DokimosAppContext.Provider>
  );
}

export function useDokimosApp() {
  const ctx = useContext(DokimosAppContext);
  if (!ctx) {
    throw new Error("useDokimosApp must be used within DokimosAppProvider");
  }
  return ctx;
}
