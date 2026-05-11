"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { vaultDetailTitleClass, vaultInsetPanelClass, vaultPlaidDetailCardClass } from "@/lib/vaultDetailPlaid";
import type { VerificationRequest } from "@/types/dokimos";
import { dedupeAttributeKeysForDisplay } from "@/lib/verificationRequestDisplay";

const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

type VaultRequestsDetailProps = {
  pendingRequests: VerificationRequest[];
  requestsLoading: boolean;
  onReviewRequest: (req: VerificationRequest) => void;
};

export function VaultRequestsDetail({
  pendingRequests,
  requestsLoading,
  onReviewRequest,
}: VaultRequestsDetailProps) {
  return (
    <div className="w-full">
      <div className={vaultPlaidDetailCardClass}>
        <div className="px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-10">
          <h2 className={vaultDetailTitleClass} style={{ fontFamily: sans }}>
            Pending requests
          </h2>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
          {requestsLoading ? (
            <div
              className={`${vaultInsetPanelClass} px-4 py-10 text-center text-[14px] text-slate-500 sm:px-5`}
              style={{ fontFamily: sans }}
            >
              Loading requests…
            </div>
          ) : pendingRequests.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center sm:px-6`}
            >
              <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" strokeWidth={1.5} aria-hidden />
              <p className="text-[15px] font-medium text-slate-700" style={{ fontFamily: sans }}>
                Nothing pending
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500" style={{ fontFamily: sans }}>
                When an organization asks for a verified proof, it will show up here.
              </p>
            </div>
          ) : (
            <div className={`overflow-hidden ${vaultInsetPanelClass}`}>
              <ul className="divide-y divide-slate-100">
                {pendingRequests.map((req) => {
                  const fieldCount = dedupeAttributeKeysForDisplay(req.requestedAttributes ?? []).length;
                  return (
                  <li key={req.requestId}>
                    <button
                      type="button"
                      onClick={() => onReviewRequest(req)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-100/60 sm:px-5"
                      style={{ fontFamily: sans }}
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-slate-900">
                          {req.verifierName || "Verification request"}
                        </p>
                        <p className="mt-0.5 text-[13px] text-slate-500">
                          {fieldCount} {fieldCount === 1 ? "field" : "fields"} requested
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-medium text-emerald-700">Review →</span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!requestsLoading && pendingRequests.length > 0 ? (
            <Link
              href="/app/vault"
              className="block text-center text-[13px] font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
              style={{ fontFamily: sans }}
            >
              Open full activity &amp; history
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
