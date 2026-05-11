"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { DokimosBrandBackdrop } from "@/components/dokimos/DokimosBrandBackdrop";
import { VaultActivityDetail } from "@/components/dokimos/VaultActivityDetail";
import { VaultIdentityDetail } from "@/components/dokimos/VaultIdentityDetail";
import { VaultInfoMenu } from "@/components/dokimos/VaultInfoMenu";
import { VaultRequestsDetail } from "@/components/dokimos/VaultRequestsDetail";
import type { AttestationData, VerificationRequest } from "@/types/dokimos";

export type VaultDetailView = "identity" | "requests" | "activity";

function firstNameFromSession(name: string | null | undefined): string {
  if (!name?.trim()) return "there";
  return name.trim().split(/\s+/)[0] ?? "there";
}

export type VaultNavigationDashboardProps = {
  verificationUrl?: string;
  attestationData: AttestationData | null;
  pendingRequests: VerificationRequest[];
  allRequests: VerificationRequest[];
  requestsLoading: boolean;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  hasEncryptedId: boolean;
  reVerifyLoading: boolean;
  reVerifyError: string | null;
  onReVerify: () => void;
  onReviewRequest: (req: VerificationRequest) => void;
};

export function VaultNavigationDashboard({
  verificationUrl,
  attestationData,
  pendingRequests,
  allRequests,
  requestsLoading,
  sessionStatus,
  hasEncryptedId,
  reVerifyLoading,
  reVerifyError,
  onReVerify,
  onReviewRequest,
}: VaultNavigationDashboardProps) {
  const { data: session } = useSession();
  const welcomeName = firstNameFromSession(session?.user?.name);
  const [activeView, setActiveView] = useState<VaultDetailView | null>(null);

  const navCards: {
    id: VaultDetailView;
    title: string;
    shortLabel: string;
    delay: number;
  }[] = [
    { id: "identity", title: "View your verified identity", shortLabel: "Verified identity", delay: 0 },
    { id: "requests", title: "Review pending requests", shortLabel: "Pending requests", delay: 0.1 },
    { id: "activity", title: "See approved activity", shortLabel: "Activity", delay: 0.2 },
  ];

  const handleCardActivate = (id: VaultDetailView) => {
    setActiveView((prev) => (prev === id ? null : id));
  };

  const handleBack = () => setActiveView(null);

  const sidebarCardClass = (isActive: boolean) =>
    [
      "group relative block w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 lg:p-5",
      isActive
        ? "border-white/40 bg-white/15"
        : "border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/15",
      "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4BF]",
    ].join(" ");

  const defaultCardClass =
    "group relative block w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/30 hover:bg-white/15 hover:shadow-2xl hover:shadow-black/20 cursor-pointer lg:p-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4BF]";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#0F172A] lg:flex-row lg:items-stretch">
      {/* Left rail — full width when idle; fixed width sidebar when split (desktop); hidden on small screens when detail open */}
      <div
        className={
          activeView
            ? "relative hidden min-h-0 w-full shrink-0 flex-col bg-[#0F172A] lg:flex lg:w-80 lg:max-w-[24rem] xl:w-96"
            : "relative flex min-h-[100dvh] w-full flex-1 flex-col bg-[#0F172A]"
        }
      >
        <DokimosBrandBackdrop />

        <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between p-6 lg:p-8">
            <Link
              href="/app/vault"
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d9488] to-[#2DD4BF] shadow-lg">
                <span className="text-base font-semibold text-white">D</span>
              </div>
              {!activeView ? <span className="text-lg font-semibold text-white">Dokimos</span> : null}
            </Link>

            {!activeView ? <VaultInfoMenu verificationUrl={verificationUrl} tone="onDark" /> : null}
          </header>

          <div
            className={`flex min-h-0 flex-1 flex-col px-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-6 ${
              activeView
                ? "justify-start pt-4"
                : "items-center justify-center overflow-y-auto pt-[max(0.5rem,env(safe-area-inset-top))] lg:px-8"
            }`}
          >
            <div className={activeView ? "w-full" : "w-full max-w-2xl self-center"}>
              <AnimatePresence mode="wait">
                {!activeView ? (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="mb-10 space-y-4 lg:mb-14"
                  >
                    <h1 className="font-landing text-5xl font-bold leading-[1.08] tracking-[-0.03em] text-white lg:text-6xl xl:text-7xl">
                      Welcome, {welcomeName}
                    </h1>
                    <p className="max-w-xl text-lg text-slate-300 lg:text-xl">
                      One verified identity. Trusted everywhere.
                    </p>
                  </motion.div>
                ) : (
                  <motion.h2
                    key="compact"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-6 text-xl font-medium text-white"
                  >
                    Welcome, {welcomeName}
                  </motion.h2>
                )}
              </AnimatePresence>

              <motion.div
                layout
                className={activeView ? "space-y-3" : "space-y-4"}
              >
                {navCards.map((card, index) => {
                  const isActive = activeView === card.id;
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: activeView ? 0 : index * 0.06,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCardActivate(card.id)}
                        className={activeView ? sidebarCardClass(isActive) : defaultCardClass}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {activeView && isActive ? (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-[#10B981]" aria-hidden />
                            ) : null}
                            <span
                              className={`text-left font-medium text-white ${
                                activeView ? "text-base lg:text-lg" : "text-xl lg:text-2xl"
                              }`}
                            >
                              {activeView ? card.shortLabel : card.title}
                            </span>
                          </div>
                          {(!activeView || !isActive) && (
                            <svg
                              className={`shrink-0 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white ${
                                activeView ? "h-4 w-4" : "h-6 w-6"
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          )}
                        </div>
                        {!activeView ? (
                          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
                          </div>
                        ) : null}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeView ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eceef1] lg:static lg:z-0 lg:max-w-none"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
              <div className="mx-auto flex w-full max-w-[640px] flex-col">
                <button
                  type="button"
                  onClick={handleBack}
                  className="mb-6 flex w-fit items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
                >
                  <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
                  <span
                    className="text-[15px] font-medium"
                    style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
                  >
                    Back to vault
                  </span>
                </button>

              {activeView === "identity" ? (
                <VaultIdentityDetail
                  attestationData={attestationData}
                  sessionStatus={sessionStatus}
                  hasEncryptedId={hasEncryptedId}
                  reVerifyLoading={reVerifyLoading}
                  reVerifyError={reVerifyError}
                  onReVerify={onReVerify}
                />
              ) : null}

              {activeView === "requests" ? (
                <VaultRequestsDetail
                  pendingRequests={pendingRequests}
                  requestsLoading={requestsLoading}
                  onReviewRequest={onReviewRequest}
                />
              ) : null}

              {activeView === "activity" ? (
                <VaultActivityDetail allRequests={allRequests} />
              ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export { VaultNavigationDashboard as VaultHomepage };
