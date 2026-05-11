"use client";

import { usePathname } from "next/navigation";
import { dokimosCanvasClass } from "@/lib/dokimosLayout";

type AppShellLayoutProps = {
  children: React.ReactNode;
  /** Optional header above scroll (e.g. review back bar). */
  topBar?: React.ReactNode;
};

export function AppShellLayout({ children, topBar }: AppShellLayoutProps) {
  const pathname = usePathname() || "";

  /** Full-width: vault split layout only. Business dashboard is capped + guttered. */
  const vaultFullBleed = pathname.startsWith("/app/vault");
  const businessShell = pathname.startsWith("/business");

  const mainWidthClass = vaultFullBleed
    ? "w-full max-w-none"
    : businessShell
      ? "w-full max-w-none px-0"
      : "max-w-[600px] lg:max-w-5xl";

  return (
    <div
      className={`relative flex min-h-[100dvh] w-full flex-1 flex-col pt-[env(safe-area-inset-top)] ${dokimosCanvasClass}`}
    >
      {topBar}
      <div
        className={`mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${mainWidthClass}`}
      >
        {/*
          Business dashboard: no outer scroll — VerifierDashboard uses a fixed-height rail + scrolling main.
          h-full + flex-1 so aside/main fill the shell (avoids white gap under the rail).
        */}
        <div
          className={
            businessShell
              ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
