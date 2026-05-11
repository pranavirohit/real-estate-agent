"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react";
import type { RentalApplicationRecord, VerificationRequest } from "@/types/dokimos";
import VerificationWizard from "@/components/verifier/VerificationWizard";

function toVerificationRequest(app: RentalApplicationRecord): VerificationRequest {
  return {
    requestId: app.attestationRequestId,
    verifierId: "nostos_landlord",
    verifierName: "Brooklyn Properties LLC",
    verifierEmail: "broker@brooklyn-properties.demo",
    userEmail: app.userId,
    requestedAttributes: ["name", "ageOver18", "address", "documentValid"],
    workflow: "rental_application",
    status: "approved",
    createdAt: app.submittedAt,
    completedAt: app.submittedAt,
    attestation: app.attestation,
  };
}

function DetailDrawer({
  app,
  onClose,
  onVerify,
}: {
  app: RentalApplicationRecord;
  onClose: () => void;
  onVerify: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:rounded-3xl sm:bottom-8"
        style={{ background: "var(--nostos-surface)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
          >
            Identity Verified
          </span>
        </div>

        <h2
          id="detail-title"
          className="mt-3 text-2xl leading-snug"
          style={{
            fontFamily: "var(--font-nostos-serif), Georgia, serif",
            color: "var(--nostos-ink)",
          }}
        >
          {app.applicantName ?? app.userId}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
          {app.listingAddress}
        </p>

        <dl
          className="mt-5 space-y-3 rounded-xl p-4 text-sm"
          style={{ background: "var(--nostos-canvas)", border: "1px solid var(--nostos-border)" }}
        >
          {[
            { label: "Application ID", value: <span className="font-mono text-xs">{app.applicationId}</span> },
            { label: "Submitted", value: new Date(app.submittedAt).toLocaleString() },
            { label: "Listing", value: app.listingAddress },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt style={{ color: "var(--nostos-muted)", fontSize: "0.75rem" }}>{label}</dt>
              <dd style={{ color: "var(--nostos-ink)" }}>{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs" style={{ color: "var(--nostos-muted)" }}>
          This identity receipt was signed inside secure hardware. You can confirm it yourself without contacting Nostos.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--nostos-border-strong)", color: "var(--nostos-ink)" }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: "var(--nostos-accent)" }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Verify proof
          </button>
        </div>
      </div>
    </>
  );
}

export default function NostosLandlord() {
  const [rows, setRows] = useState<RentalApplicationRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<RentalApplicationRecord | null>(null);
  const [wizardRequest, setWizardRequest] = useState<VerificationRequest | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const { data } = await axios.get<RentalApplicationRecord[]>("/api/rental-applications");
      setRows(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch {
      setLoadError("Could not load applications. Is the verification server running?");
    }
  }, []);

  useEffect(() => {
    void fetchApps();
    const t = setInterval(() => void fetchApps(), 12000);
    return () => clearInterval(t);
  }, [fetchApps]);

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* Top bar */}
        <nav
          className="flex items-center justify-between border-b px-6 py-4 sm:px-10"
          style={{ borderColor: "var(--nostos-border)", background: "var(--nostos-surface)" }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/nostos"
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
              style={{ color: "var(--nostos-ink-secondary)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <span
              className="text-lg tracking-tight"
              style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
            >
              Nostos
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--nostos-ink-secondary)" }}>
            Brooklyn Properties LLC
          </span>
        </nav>

        <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-10 sm:px-6">
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--nostos-accent)" }}
          >
            Landlord dashboard
          </p>
          <h1
            className="text-3xl"
            style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
          >
            Applications
          </h1>
          <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
            Every application includes a verified identity receipt. Tap a row to review details and verify the proof yourself.
          </p>

          {loadError && (
            <p className="mt-4 text-sm text-red-600">{loadError}</p>
          )}

          <div
            className="mt-8 overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--nostos-border)", background: "var(--nostos-surface)" }}
          >
            {rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm" style={{ color: "var(--nostos-muted)" }}>
                  No applications yet.{" "}
                  <Link
                    href="/nostos/find"
                    className="font-semibold underline"
                    style={{ color: "var(--nostos-accent)" }}
                  >
                    Complete a flow from the renter side
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--nostos-border)" }}>
                {rows.map((app) => (
                  <li key={app.applicationId}>
                    <button
                      type="button"
                      onClick={() => setDetailApp(app)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors"
                      style={{ background: "transparent" }}
                      onMouseOver={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "var(--nostos-canvas)")
                      }
                      onMouseOut={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                          style={{ background: "var(--nostos-accent)" }}
                        >
                          {(app.applicantName ?? app.userId).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
                            {app.applicantName ?? app.userId}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                            {app.listingAddress}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
                          >
                            Verified
                          </span>
                          <p className="mt-1 text-right text-xs" style={{ color: "var(--nostos-muted)" }}>
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4" style={{ color: "var(--nostos-muted)" }} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {detailApp && (
        <DetailDrawer
          app={detailApp}
          onClose={() => setDetailApp(null)}
          onVerify={() => {
            setWizardRequest(toVerificationRequest(detailApp));
            setDetailApp(null);
          }}
        />
      )}

      {wizardRequest && (
        <VerificationWizard
          key={wizardRequest.requestId}
          request={wizardRequest}
          open
          onClose={() => setWizardRequest(null)}
        />
      )}
    </>
  );
}
