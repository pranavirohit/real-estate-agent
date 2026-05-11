"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";
import { DokimosPageChrome } from "@/components/dokimos/DokimosPageChrome";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

function SettingsLinkRow({
  title,
  subtitle,
  onClick,
  external,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  external?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-left transition-colors hover:border-teal-200 hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
      style={{ fontFamily: sans }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-[13px] text-slate-500">{subtitle}</div>
      </div>
      {external ? (
        <ExternalLink size={18} className="shrink-0 text-slate-400" aria-hidden />
      ) : (
        <ChevronRight size={20} className="shrink-0 text-slate-400" aria-hidden />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { openHowItWorks } = useHowItWorksModal();
  const { data: session, status } = useSession();
  const { attestationData } = useDokimosApp();
  const eigenUrl = getEigenVerificationDashboardUrl();

  const email = useMemo(() => {
    if (session?.user?.email) return session.user.email;
    try {
      const raw = localStorage.getItem("dokimos_user");
      if (raw) {
        const u = JSON.parse(raw) as { email?: string };
        return u.email ?? null;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, [session?.user?.email]);

  const lastVerified = attestationData?.timestamp
    ? new Date(attestationData.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <DokimosPageChrome role="settings" title="Settings" description="Account, vault status, and help.">
      <div style={{ fontFamily: sans }}>
      <section className="mt-0">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Account
        </h2>
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
          <p className="text-[13px] text-slate-500">Email</p>
          <p className="mt-1 text-[15px] font-medium text-slate-900">
            {status === "loading" ? "…" : email ?? "Not signed in"}
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
          >
            Log out
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Identity vault
        </h2>
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
          <p className="text-[15px] font-semibold text-emerald-800">Status: Verified ✓</p>
          {lastVerified ? (
            <p className="mt-2 text-[13px] text-slate-600">Last verified: {lastVerified}</p>
          ) : (
            <p className="mt-2 text-[13px] text-slate-600">Complete onboarding to verify your identity.</p>
          )}
          <button
            type="button"
            onClick={() => window.open(eigenUrl, "_blank", "noopener,noreferrer")}
            className="mt-4 text-[14px] font-medium text-dokimos-accent underline decoration-dokimos-accent/30 underline-offset-4 hover:decoration-dokimos-accent"
          >
            View attestation details →
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          Help &amp; information
        </h2>
        <div className="flex flex-col gap-2">
          <SettingsLinkRow
            title="How Dokimos works"
            subtitle="Learn about secure ID verification"
            onClick={openHowItWorks}
          />
          <SettingsLinkRow
            title="View TEE attestation"
            subtitle="Verify the cryptographic proof"
            onClick={() => window.open(eigenUrl, "_blank", "noopener,noreferrer")}
            external
          />
          <SettingsLinkRow
            title="Privacy policy"
            subtitle="How we protect your data"
            onClick={() => router.push("/app/privacy")}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          About
        </h2>
        <p className="text-[14px] text-slate-600">Version 0.1.0</p>
      </section>
      </div>
    </DokimosPageChrome>
  );
}
