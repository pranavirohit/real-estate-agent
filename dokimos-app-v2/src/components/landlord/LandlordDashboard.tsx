"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  dokimosCardClass,
  dokimosPrimaryButtonClass,
  dokimosSectionLabelClass,
} from "@/lib/dokimosLayout";
import type {
  RentalApplicationRecord,
  VerificationRequest,
} from "@/types/dokimos";
import VerificationWizard from "@/components/verifier/VerificationWizard";

function toVerificationRequest(
  app: RentalApplicationRecord
): VerificationRequest {
  return {
    requestId: app.attestationRequestId,
    verifierId: "realestate_prod",
    verifierName: "Brooklyn Properties LLC",
    verifierEmail: "broker@brooklyn-properties.demo",
    userEmail: app.userId,
    requestedAttributes: ["name", "ageOver18", "address", "notExpired"],
    workflow: "rental_application",
    status: "approved",
    createdAt: app.submittedAt,
    completedAt: app.submittedAt,
    attestation: app.attestation,
  };
}

export function LandlordDashboard() {
  const [rows, setRows] = useState<RentalApplicationRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<RentalApplicationRecord | null>(
    null
  );
  const [wizardRequest, setWizardRequest] = useState<VerificationRequest | null>(
    null
  );

  const fetchApps = useCallback(async () => {
    try {
      const { data } = await axios.get<RentalApplicationRecord[]>(
        "/api/rental-applications"
      );
      setRows(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch {
      setLoadError(
        "Could not load applications. Is the verification server running?"
      );
    }
  }, []);

  useEffect(() => {
    void fetchApps();
    const t = setInterval(() => void fetchApps(), 12000);
    return () => clearInterval(t);
  }, [fetchApps]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`${dokimosSectionLabelClass} mb-1`}>Landlord demo</p>
          <h1
            className="font-serif text-3xl text-slate-900"
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            Brooklyn Properties LLC
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Applications submitted through the rental agent include a Dokimos
            identity receipt. Open a row to review details and verify the proof
            yourself.
          </p>
        </div>
        <Link
          href="/agent"
          className="text-sm font-medium text-dokimos-accent hover:text-dokimos-accentHover"
        >
          Back to rental agent
        </Link>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600">{loadError}</p>
      ) : null}

      <div className={`${dokimosCardClass} overflow-hidden !p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">
                  Applicant
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700">
                  Listing
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700">
                  Submitted
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No applications yet. Complete a flow from the{" "}
                    <Link href="/agent" className="text-dokimos-accent underline">
                      rental agent
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                rows.map((app) => (
                  <tr
                    key={app.applicationId}
                    className="cursor-pointer hover:bg-slate-50/80"
                    onClick={() => setDetailApp(app)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {app.applicantName ?? app.userId}
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-slate-700">
                      <span className="line-clamp-2">{app.listingAddress}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(app.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/20">
                        Submitted
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailApp ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setDetailApp(null)}
          />
          <div
            className="relative z-[91] mb-0 w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landlord-detail-title"
          >
            <h2
              id="landlord-detail-title"
              className="font-serif text-xl text-slate-900"
              style={{ fontFamily: "var(--font-instrument-serif), serif" }}
            >
              Application details
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Application ID</dt>
                <dd className="font-mono text-slate-900">
                  {detailApp.applicationId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Applicant</dt>
                <dd className="text-slate-900">
                  {detailApp.applicantName ?? detailApp.userId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Listing</dt>
                <dd className="text-slate-900">{detailApp.listingAddress}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Submitted</dt>
                <dd className="text-slate-900">
                  {new Date(detailApp.submittedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-600">
              The identity receipt below is signed inside secure hardware. You can
              confirm it without trusting Dokimos alone.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setDetailApp(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setWizardRequest(toVerificationRequest(detailApp));
                  setDetailApp(null);
                }}
                className={`${dokimosPrimaryButtonClass} flex-1`}
              >
                Verify independently
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {wizardRequest ? (
        <VerificationWizard
          key={wizardRequest.requestId}
          request={wizardRequest}
          open
          onClose={() => setWizardRequest(null)}
        />
      ) : null}
    </div>
  );
}
