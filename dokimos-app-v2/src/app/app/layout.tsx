"use client";

import { Suspense } from "react";
import { AppShellLayout } from "@/components/dokimos/AppShellLayout";
import { RequestNotificationsProvider } from "@/contexts/RequestNotificationsContext";
import { HowItWorksModalProvider } from "@/contexts/HowItWorksModalContext";
import { AppRouteGuard } from "./AppRouteGuard";

function AppShellWithTabs({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full bg-[#FAFAF9]" aria-hidden />
      }
    >
      <AppRouteGuard>
        <HowItWorksModalProvider>
          <RequestNotificationsProvider>
            <AppShellWithTabs>{children}</AppShellWithTabs>
          </RequestNotificationsProvider>
        </HowItWorksModalProvider>
      </AppRouteGuard>
    </Suspense>
  );
}
