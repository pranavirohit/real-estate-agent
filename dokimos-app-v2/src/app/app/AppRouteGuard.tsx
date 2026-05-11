"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { STORAGE_ONBOARDING_COMPLETE } from "@/types/dokimos";

/**
 * `/app/*`: optional onboarding gate + demo auth.
 * - `?app=1` skips onboarding and auth (dev escape hatch).
 * - Otherwise requires onboarding complete + signed-in session (redirect to `/login`).
 */
export function AppRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const skip =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("app") === "1";
    if (skip) {
      setReady(true);
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/app/vault";
      router.replace(`/login?callbackUrl=${encodeURIComponent(path)}`);
      return;
    }

    try {
      if (localStorage.getItem(STORAGE_ONBOARDING_COMPLETE) !== "1") {
        router.replace("/onboarding");
        return;
      }
    } catch {
      router.replace("/onboarding");
      return;
    }

    setReady(true);
  }, [router, status]);

  if (!ready) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#FAFAF9]" aria-hidden />
    );
  }

  return <>{children}</>;
}
