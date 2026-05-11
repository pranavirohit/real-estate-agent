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
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { HowDokimosProtectsContent } from "@/components/dokimos/HowDokimosProtectsContent";
import { dokimosSectionLabelClass } from "@/lib/dokimosLayout";

/** Plus Jakarta Sans — same as marketing / vault hero (`next/font` → `--font-landing-sans`). */
const plusJakartaSans = "var(--font-landing-sans), system-ui, sans-serif" as const;

type HowItWorksModalContextValue = {
  openHowItWorks: () => void;
  closeHowItWorks: () => void;
};

const HowItWorksModalContext = createContext<HowItWorksModalContextValue | null>(
  null
);

export function useHowItWorksModal(): HowItWorksModalContextValue {
  const ctx = useContext(HowItWorksModalContext);
  if (!ctx) {
    throw new Error("useHowItWorksModal must be used within HowItWorksModalProvider");
  }
  return ctx;
}

export function useHowItWorksModalOptional(): HowItWorksModalContextValue | null {
  return useContext(HowItWorksModalContext);
}

export function HowItWorksModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || "";
  const router = useRouter();

  const openHowItWorks = useCallback(() => setIsOpen(true), []);

  const closeHowItWorks = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/app/how-it-works" || pathname === "/app/how-it-works/") {
      router.push("/app/vault");
    }
  }, [pathname, router]);

  const value = useMemo(
    () => ({ openHowItWorks, closeHowItWorks }),
    [openHowItWorks, closeHowItWorks]
  );

  return (
    <HowItWorksModalContext.Provider value={value}>
      {children}
      <HowItWorksModalInner isOpen={isOpen} onClose={closeHowItWorks} />
    </HowItWorksModalContext.Provider>
  );
}

function HowItWorksModalInner({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[min(92dvh,900px)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1 pr-2">
            <p
              className={`${dokimosSectionLabelClass} text-[11px] tracking-[0.12em]`}
              style={{ fontFamily: plusJakartaSans }}
            >
              Help
            </p>
            <h2
              id="how-it-works-modal-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px]"
              style={{ fontFamily: plusJakartaSans }}
            >
              How Dokimos protects you
            </h2>
            <p
              className="mt-2 max-w-prose text-[13px] leading-relaxed text-slate-600 sm:text-[14px]"
              style={{ fontFamily: plusJakartaSans }}
            >
              A short walkthrough of verification—from upload to sharing proof on your terms.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <div className="mx-auto max-w-2xl pb-4">
            <HowDokimosProtectsContent
              omitMainHeading
              showTechnicalDetailsButton
              sansFontStack={plusJakartaSans}
              headingFontStack={plusJakartaSans}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
