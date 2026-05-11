"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";
import { Check } from "lucide-react";
import { DokimosBrandBackdrop } from "@/components/dokimos/DokimosBrandBackdrop";
import { VaultInfoMenu } from "@/components/dokimos/VaultInfoMenu";

const serif = "var(--font-instrument-serif), Georgia, serif";

type VaultHomeShellProps = {
  /** Eigen / verification dashboard link for the info menu */
  verificationUrl?: string;
  sans: string;
  children: ReactNode;
};

const heroFade = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Vault home: dark brand canvas + marketing hero + rounded light content sheet.
 */
export function VaultHomeShell({ verificationUrl, sans, children }: VaultHomeShellProps) {
  const { openHowItWorks } = useHowItWorksModal();

  return (
    <div className="relative w-full min-h-full bg-[#0F172A]">
      <DokimosBrandBackdrop />

      <div className="relative z-10 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 sm:h-[52px] sm:px-5 md:px-6">
        <div className="min-w-0 flex-1" aria-hidden />
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[17px] font-bold tracking-tight text-white"
          style={{ fontFamily: sans }}
        >
          Dokimos
        </span>
        <VaultInfoMenu verificationUrl={verificationUrl} tone="onDark" />
      </div>

      {/* Hero — gradient band, centered */}
      <div className="relative z-10 overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#0f172a] to-[#0d3d3d]/90 px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-16 md:px-8 md:pb-[60px] md:pt-20">
        <motion.div
          className="mx-auto flex max-w-[640px] flex-col items-center text-center"
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: { staggerChildren: 0.08, delayChildren: 0.06 },
            },
          }}
        >
          <motion.div variants={heroFade}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[14px] font-medium text-emerald-400">
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} aria-hidden />
              Verified
            </span>
          </motion.div>

          <motion.h1
            variants={heroFade}
            className="mt-6 max-w-[20ch] text-[32px] font-normal leading-[1.1] tracking-tight text-white sm:text-[40px] md:text-[48px]"
            style={{ fontFamily: serif }}
          >
            Your Identity Vault
          </motion.h1>

          <motion.p
            variants={heroFade}
            className="mt-4 max-w-[600px] text-[16px] leading-relaxed text-white/70 sm:text-[17px] md:text-[18px]"
            style={{ fontFamily: sans }}
          >
            One verified identity. Trusted everywhere.
          </motion.p>

          <motion.div
            variants={heroFade}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4"
          >
            <Link
              href="/app/vault"
              className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-lg bg-emerald-500 px-6 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:flex-initial sm:min-w-[200px]"
              style={{ fontFamily: sans }}
            >
              View verification activity
            </Link>
            <button
              type="button"
              onClick={openHowItWorks}
              className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-lg border border-white/30 bg-transparent px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 sm:flex-initial sm:min-w-[200px]"
              style={{ fontFamily: sans }}
            >
              How Dokimos works
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-10 mt-1 rounded-t-[28px] bg-[#F8FAFC] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-12px_48px_rgba(15,23,42,0.18)] sm:px-5 md:px-6">
        {children}
      </div>
    </div>
  );
}
