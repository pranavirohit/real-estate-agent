"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { vaultDetailTitleClass, vaultInsetPanelClass, vaultPlaidDetailCardClass } from "@/lib/vaultDetailPlaid";
import { formatVerificationActivityRelativeTime } from "@/lib/verificationActivityTime";
import type { VerificationRequest } from "@/types/dokimos";
import {
  formatVerificationAttributeKey,
  getCompanyBadgeColor,
  getDisplayedAttributeKeys,
  isExcludedFromConsumerActivityList,
} from "@/lib/verificationRequestDisplay";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultActivityDetailProps = {
  allRequests: VerificationRequest[];
};

export function VaultActivityDetail({ allRequests }: VaultActivityDetailProps) {
  const approvedRequests = useMemo(() => {
    return [...allRequests]
      .filter((r) => r.status === "approved")
      .filter((r) => !isExcludedFromConsumerActivityList(r))
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.createdAt).getTime() -
          new Date(a.completedAt || a.createdAt).getTime()
      )
      .slice(0, 12);
  }, [allRequests]);

  return (
    <div className="w-full">
      <div className={vaultPlaidDetailCardClass}>
        <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-10">
          <h2 className={vaultDetailTitleClass} style={{ fontFamily: sans }}>
            Activity
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
          <div className={`overflow-hidden ${vaultInsetPanelClass}`}>
            {approvedRequests.length === 0 ? (
              <p
                className="px-4 py-8 text-center text-[14px] text-slate-500 sm:px-5"
                style={{ fontFamily: sans }}
              >
                When you approve a verification request, it will appear here with what was shared and when.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {approvedRequests.map((r) => {
                  const initial = (r.verifierName ?? "?").charAt(0).toUpperCase();
                  const badgeColor = getCompanyBadgeColor(r.verifierName ?? "");
                  const lowerVerifier = (r.verifierName ?? "").toLowerCase();
                  const showAirbnbLogo = lowerVerifier.includes("airbnb");
                  const showCoinbaseLogo = lowerVerifier.includes("coinbase");
                  const showUberLogo = lowerVerifier.includes("uber");
                  const showUpworkLogo = lowerVerifier.includes("upwork");
                  const keys = getDisplayedAttributeKeys(r);
                  const labels = keys.map(formatVerificationAttributeKey);
                  const whenIso = r.completedAt || r.createdAt;
                  const when = formatVerificationActivityRelativeTime(whenIso);

                  return (
                    <li key={r.requestId}>
                      <div className="flex items-start gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                        {showAirbnbLogo ? (
                          <Image
                            src="/airbnb_logo.png"
                            alt="Airbnb"
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : showCoinbaseLogo ? (
                          <Image
                            src="/coinbase-logo-icon.webp"
                            alt="Coinbase"
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : showUberLogo ? (
                          <Image
                            src="/uber.svg"
                            alt="Uber"
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full bg-white object-cover p-1 shadow-sm"
                          />
                        ) : showUpworkLogo ? (
                          <Image
                            src="/upwork-square-logo-icon-png-701751694968615sgotnnc8sf.png"
                            alt="Upwork"
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white shadow-sm"
                            style={{ backgroundColor: badgeColor, fontFamily: sans }}
                            aria-hidden
                          >
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[15px] font-semibold leading-snug text-slate-900"
                            style={{ fontFamily: sans }}
                          >
                            {r.verifierName || "Organization"}
                          </p>
                          {labels.length > 0 ? (
                            <ul className="mt-2 space-y-1.5" aria-label="Verified attributes">
                              {labels.map((label) => (
                                <li
                                  key={label}
                                  className="flex items-start gap-2 text-[13px] leading-snug text-slate-600"
                                >
                                  <Check
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                                    strokeWidth={2.5}
                                    aria-hidden
                                  />
                                  <span style={{ fontFamily: sans }}>{label}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-slate-600">
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                                strokeWidth={2.5}
                                aria-hidden
                              />
                              <span style={{ fontFamily: sans }}>Verification approved</span>
                            </div>
                          )}
                        </div>
                        <time
                          dateTime={whenIso}
                          className="max-w-[7.5rem] shrink-0 pt-0.5 text-right text-[12px] leading-snug text-slate-500 sm:max-w-none sm:text-[13px]"
                          style={{ fontFamily: sans }}
                          title={new Date(whenIso).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        >
                          {when}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
