"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Screen03Vault } from "@/components/DokimosFlow";
import { useDokimosApp } from "@/contexts/DokimosAppContext";

export default function VaultIdentityPage() {
  const { attestationData } = useDokimosApp();
  const router = useRouter();

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-dokimos-productCanvas" aria-hidden />}>
      <Screen03Vault
        showHeaderBack
        attestationData={attestationData}
        onBack={() => router.push("/app/vault")}
      />
    </Suspense>
  );
}
