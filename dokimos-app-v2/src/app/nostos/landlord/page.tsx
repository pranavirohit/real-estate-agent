"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { RentalApplicationRecord, VerificationRequest } from "@/types/dokimos";
import VerificationWizard from "@/components/verifier/VerificationWizard";
import { MOCK_RENTAL_LISTINGS } from "@/lib/agentListings";
import { DEMO_CONSUMER_ACCOUNTS } from "@/lib/demoConsumerAccounts";

type EnrichedApp = RentalApplicationRecord & { tourDate?: string };

const PROPERTY_PHOTOS: Array<{ keywords: string[]; url: string }> = [
  { keywords: ["flatbush", "park slope"], url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&fit=crop" },
  { keywords: ["wythe", "williamsburg"], url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop" },
  { keywords: ["nostrand", "bed-stuy", "bedford"], url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&fit=crop" },
  // Marcy Ave, Williamsburg — industrial-chic loft with exposed concrete and large windows
  { keywords: ["marcy"], url: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&fit=crop" },
  // Gates Ave, Bed-Stuy — warm pre-war interior with hardwood floors and high ceilings
  { keywords: ["gates"], url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop" },
  // Prospect Park SW, Park Slope — bright, airy living room with large windows and natural light
  { keywords: ["prospect"], url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop" },
];
const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&fit=crop";

function propertyPhoto(address: string): string {
  const lower = address.toLowerCase();
  return PROPERTY_PHOTOS.find((p) => p.keywords.some((k) => lower.includes(k)))?.url ?? FALLBACK_PHOTO;
}

const PROPERTY_META: Array<{ keywords: string[]; price: string; beds: string }> = [
  { keywords: ["flatbush"], price: "$2,950/mo", beds: "2 bd · 2 ba" },
  { keywords: ["wythe"], price: "$2,800/mo", beds: "2 bd · 1 ba" },
  { keywords: ["nostrand"], price: "$2,650/mo", beds: "2 bd · 1 ba" },
  { keywords: ["marcy"], price: "$2,750/mo", beds: "1 bd · 1 ba" },
  { keywords: ["gates"], price: "$2,500/mo", beds: "2 bd · 1 ba" },
  { keywords: ["prospect"], price: "$3,200/mo", beds: "2 bd · 2 ba" },
];

function propertyMeta(address: string): { price: string; beds: string } | null {
  const lower = address.toLowerCase();
  return PROPERTY_META.find((m) => m.keywords.some((k) => lower.includes(k))) ?? null;
}

const JANICE_EMAIL =
  DEMO_CONSUMER_ACCOUNTS.find((a) => a.name === "Janice Sample")?.email.toLowerCase().trim() ??
  "janice.sample802@gmail.com";

/** Wythe / Nostrand / Flatbush — Janice-only slots; extras stay full demos (below). */
function coreListingAddress(l: (typeof MOCK_RENTAL_LISTINGS)[number]): string {
  return `${l.title}, ${l.neighborhood}`;
}

function isJaniceRentalApp(app: EnrichedApp): boolean {
  const email = String(app.userId).trim().toLowerCase();
  if (email === JANICE_EMAIL) return true;
  const n = (app.applicantName ?? "").trim().toLowerCase();
  return n === "janice sample" || (n.includes("janice") && n.includes("sample"));
}

/** Pre-renter-flow: property card exists but no Janice row yet. */
function corePendingPlaceholder(listingId: string, listingAddress: string): EnrichedApp {
  return {
    applicationId: `showcase-pending-${listingId}`,
    listingId,
    listingAddress,
    userId: "",
    applicantName: undefined,
    attestationRequestId: `showcase-pending-${listingId}`,
    attestation: null,
    status: "submitted",
    submittedAt: new Date(0).toISOString(),
    tourDate: undefined,
  };
}

function isPendingApplicantSlot(app: EnrichedApp): boolean {
  return app.applicationId.startsWith("showcase-pending-");
}

function newestJaniceAppForListingKey(
  dedupedLive: EnrichedApp[],
  listingKey: string
): EnrichedApp | undefined {
  const matches = dedupedLive.filter(
    (r) => normalizeListingAddress(r.listingAddress) === listingKey && isJaniceRentalApp(r)
  );
  matches.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  return matches[0];
}

/** Three extra Brooklyn listings — full demo applicants (always). */
const SHOWCASE_EXTRA_DEMOS: EnrichedApp[] = [
  {
    applicationId: "showcase-extra-marcy",
    listingId: "showcase-marcy",
    listingAddress: "88 Marcy Ave, Apt 5C, Williamsburg, Brooklyn",
    userId: "alex.rivera@example.com",
    applicantName: "Alex Rivera",
    attestationRequestId: "showcase-extra-marcy",
    attestation: null,
    status: "submitted",
    submittedAt: new Date("2026-05-10T14:00:00Z").toISOString(),
    tourDate: new Date("2026-05-24T15:00:00Z").toISOString(), // 11:00 AM ET
  },
  {
    applicationId: "showcase-extra-gates",
    listingId: "showcase-gates",
    listingAddress: "412 Gates Ave, Apt 2R, Bedford-Stuyvesant, Brooklyn",
    userId: "marcus.webb@example.com",
    applicantName: "Marcus Webb",
    attestationRequestId: "showcase-extra-gates",
    attestation: null,
    status: "submitted",
    submittedAt: new Date("2026-05-09T11:00:00Z").toISOString(),
    tourDate: new Date("2026-05-25T14:00:00Z").toISOString(), // 10:00 AM ET
  },
  {
    applicationId: "showcase-extra-prospect",
    listingId: "showcase-prospect",
    listingAddress: "55 Prospect Park SW, Apt 6A, Park Slope, Brooklyn",
    userId: "priya.nair@example.com",
    applicantName: "Priya Nair",
    attestationRequestId: "showcase-extra-prospect",
    attestation: null,
    status: "submitted",
    submittedAt: new Date("2026-05-08T09:30:00Z").toISOString(),
    tourDate: new Date("2026-05-26T13:30:00Z").toISOString(), // 9:30 AM ET
  },
];

function normalizeListingAddress(addr: string): string {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable grid order: three primary listings, then Marcy / Gates / Prospect. */
const SHOWCASE_GRID_ORDER_KEYS: string[] = [
  ...MOCK_RENTAL_LISTINGS.map((l) =>
    normalizeListingAddress(`${l.title}, ${l.neighborhood}`)
  ),
  ...SHOWCASE_EXTRA_DEMOS.map((r) => normalizeListingAddress(r.listingAddress)),
];

function showcaseGridOrderIndex(address: string): number {
  const k = normalizeListingAddress(address);
  const i = SHOWCASE_GRID_ORDER_KEYS.indexOf(k);
  return i === -1 ? SHOWCASE_GRID_ORDER_KEYS.length + 1 : i;
}

/** Hide stale sandbox / QA rows that sometimes linger in the TEE in-memory store. */
function isSandboxListingAddress(address: string): boolean {
  const a = address.trim().toLowerCase();
  if (!a) return true;
  if (/\b123\s+test\b/i.test(address)) return true;
  if (/\btest\s+st(reet)?\b/.test(a) && /\b123\b/.test(a)) return true;
  if (a.includes("placeholder")) return true;
  return false;
}

/** Collapse duplicate bookings for the same listing + tenant (keeps the newest row). */
function dedupeByListingAndTenant(apps: EnrichedApp[]): EnrichedApp[] {
  const m = new Map<string, EnrichedApp>();
  for (const app of apps) {
    const k = `${app.listingAddress.trim().toLowerCase()}::${String(app.userId).trim().toLowerCase()}`;
    const prev = m.get(k);
    if (
      !prev ||
      new Date(app.submittedAt).getTime() >= new Date(prev.submittedAt).getTime()
    ) {
      m.set(k, app);
    }
  }
  return [...m.values()];
}

/**
 * Six-property board: Marcy / Gates / Prospect always show demo applicants.
 * Wythe / Nostrand / Flatbush stay empty until Janice's rental rows appear; then her card + tour from the workflow.
 */
function buildLandlordMarketingApps(liveFromApi: EnrichedApp[]): EnrichedApp[] {
  const filtered = liveFromApi.filter((r) => !isSandboxListingAddress(r.listingAddress));
  const deduped = dedupeByListingAndTenant(filtered);

  const coreRows: EnrichedApp[] = MOCK_RENTAL_LISTINGS.map((l) => {
    const address = coreListingAddress(l);
    const listingKey = normalizeListingAddress(address);
    const liveJanice = newestJaniceAppForListingKey(deduped, listingKey);
    if (liveJanice) {
      return {
        ...liveJanice,
        listingAddress: address,
        applicantName: liveJanice.applicantName ?? "Janice Sample",
      };
    }
    return corePendingPlaceholder(l.id, address);
  });

  return [...coreRows, ...SHOWCASE_EXTRA_DEMOS];
}

function formatTourDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

function formatTourTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }) + " Eastern";
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toVerificationRequest(app: EnrichedApp): VerificationRequest {
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
  app: EnrichedApp;
  onClose: () => void;
  onVerify: () => void;
}) {
  const name = app.applicantName ?? app.userId;
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl shadow-2xl sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-3xl"
        style={{ background: "var(--nostos-surface)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        {/* Header */}
        <div
          className="px-6 pb-5 pt-6"
          style={{ borderBottom: "1px solid var(--nostos-border)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--nostos-accent)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="detail-title"
                className="text-2xl leading-snug"
                style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
              >
                {name}
              </h2>
              {app.userId && app.userId !== name && (
                <a
                  href={`mailto:${app.userId}`}
                  className="mt-0.5 block text-sm"
                  style={{ color: "var(--nostos-accent)" }}
                >
                  {app.userId}
                </a>
              )}
            </div>
            <span
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
            >
              Identity Verified
            </span>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {/* Verified by Nostos */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--nostos-canvas)", border: "1px solid var(--nostos-border)" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--nostos-muted)" }}
            >
              Verified by Nostos
            </p>
            {[
              "Full name confirmed",
              "Age 18+ confirmed",
              "Current address confirmed",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 py-1">
                <div
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "#dcfce7" }}
                >
                  <span style={{ color: "#16a34a", fontSize: "11px", fontWeight: 700 }}>✓</span>
                </div>
                <p className="text-sm" style={{ color: "var(--nostos-ink)" }}>{item}</p>
              </div>
            ))}
            <p className="mt-3 text-xs" style={{ color: "var(--nostos-muted)" }}>
              Signed inside secure hardware. Verified {formatShortDate(app.submittedAt)}.
            </p>
          </div>

          {/* Tour details */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--nostos-canvas)", border: "1px solid var(--nostos-border)" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--nostos-muted)" }}
            >
              Tour details
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
              {app.listingAddress}
            </p>
            {app.tourDate ? (
              <div className="mt-2">
                <p className="text-sm font-semibold leading-tight" style={{ color: "var(--nostos-ink)" }}>
                  {formatTourDay(app.tourDate)}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                  {formatTourTime(app.tourDate)}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--nostos-muted)" }}>
                —
              </p>
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--nostos-muted)" }}>
              Application received {formatShortDate(app.submittedAt)}
            </p>
          </div>

          {/* Still yours to collect */}
          <div
            className="rounded-xl p-4"
            style={{ border: "1px solid var(--nostos-border)" }}
          >
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--nostos-muted)" }}
            >
              Still yours to collect
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--nostos-ink-secondary)" }}>
              Nostos confirms identity — not financial qualification. You still need to gather:
            </p>
            <ul className="mt-2 space-y-1">
              {["Credit report", "Income / employment verification", "Landlord references"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                  <span style={{ color: "var(--nostos-border-strong)" }}>—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col gap-3 px-6 pb-6 sm:flex-row"
          style={{ borderTop: "1px solid var(--nostos-border)", paddingTop: "1.25rem" }}
        >
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--nostos-accent)", color: "var(--nostos-accent)", background: "var(--nostos-accent-soft)" }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Verify proof yourself
          </button>
        </div>
      </div>
    </>
  );
}

export default function NostosLandlord() {
  const [rows, setRows] = useState<EnrichedApp[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<EnrichedApp | null>(null);
  const [wizardRequest, setWizardRequest] = useState<VerificationRequest | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const { data } = await axios.get<EnrichedApp[]>("/api/rental-applications");
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

  // Group applications by listing address; canonical six-property grid order, then tour date tie-break.
  const allApps = buildLandlordMarketingApps(rows);
  const applicantRows = allApps.filter((a) => !isPendingApplicantSlot(a));
  const groups = Object.entries(
    allApps.reduce<Record<string, EnrichedApp[]>>((acc, app) => {
      const key = app.listingAddress;
      if (!acc[key]) acc[key] = [];
      acc[key].push(app);
      return acc;
    }, {})
  ).sort(([addrA, appsA], [addrB, appsB]) => {
    const oa = showcaseGridOrderIndex(addrA);
    const ob = showcaseGridOrderIndex(addrB);
    if (oa !== ob) return oa - ob;
    const aDate = appsA.find((r) => r.tourDate)?.tourDate ?? appsA[0].submittedAt;
    const bDate = appsB.find((r) => r.tourDate)?.tourDate ?? appsB[0].submittedAt;
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  const totalApplicants = applicantRows.length;
  const propertyCount = allApps.length;
  const allVerified =
    applicantRows.length > 0 &&
    applicantRows.every((r) => r.status === "submitted");

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* Nav */}
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

        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
          {/* Page header */}
          <div>
            <h1
              className="text-4xl"
              style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
            >
              Applications
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
              Every applicant has been identity-verified by Nostos.
            </p>
          </div>

          {/* Stats strip */}
          {allApps.length > 0 && (
            <div
              className="mt-6 flex flex-col gap-5 rounded-xl px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
              style={{
                background: "var(--nostos-canvas)",
                border: "1px solid var(--nostos-border)",
              }}
            >
              {[
                {
                  value: propertyCount,
                  label: "Properties",
                  gradient:
                    "linear-gradient(145deg, #b45309 0%, #ea580c 45%, #fdba74 100%)",
                  shadow: "0 6px 20px rgba(180, 83, 9, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)",
                },
                {
                  value: totalApplicants,
                  label: "Applicants",
                  gradient:
                    "linear-gradient(145deg, #9a3412 0%, #c2410c 40%, #fca5a5 100%)",
                  shadow: "0 6px 20px rgba(154, 52, 18, 0.26), inset 0 1px 0 rgba(255,255,255,0.35)",
                },
                {
                  value: totalApplicants,
                  label: "ID Verified",
                  gradient: allVerified
                    ? "linear-gradient(145deg, #047857 0%, #059669 45%, #6ee7b7 100%)"
                    : "linear-gradient(145deg, #57534e 0%, #78716c 50%, #d6d3d1 100%)",
                  shadow: allVerified
                    ? "0 6px 20px rgba(4, 120, 87, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)"
                    : "0 6px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-1 flex-col items-center gap-2 border-[var(--nostos-border)] sm:flex-row sm:justify-center sm:gap-3 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                >
                  <div
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-[2.125rem] font-semibold tabular-nums leading-none tracking-tight text-white sm:h-[4.5rem] sm:w-[4.5rem] sm:text-4xl"
                    style={{
                      fontFamily: "var(--font-nostos-serif), Georgia, serif",
                      background: stat.gradient,
                      boxShadow: stat.shadow,
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <p
                    className="text-center text-[11px] font-medium uppercase leading-tight tracking-[0.12em] sm:text-left sm:text-xs"
                    style={{ color: "var(--nostos-muted)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {loadError && (
            <p className="mt-4 text-sm text-red-600">{loadError}</p>
          )}

          {/* Property card grid */}
          <div className="mt-10">
            {groups.length === 0 ? (
              <div
                className="overflow-hidden rounded-2xl border px-6 py-16 text-center"
                style={{ borderColor: "var(--nostos-border)", background: "var(--nostos-surface)" }}
              >
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map(([address, apps]) => {
                  const photo = propertyPhoto(address);
                  return (
                    <div
                      key={address}
                      className="overflow-hidden rounded-2xl"
                      style={{
                        border: "1px solid var(--nostos-border)",
                        background: "var(--nostos-surface)",
                      }}
                    >
                      {/* Property photo */}
                      <img
                        src={photo}
                        alt={address}
                        className="block h-44 w-full object-cover"
                      />

                      {/* Property info */}
                      <div className="px-4 pb-0 pt-4">
                        <p
                          className="text-sm font-semibold leading-snug"
                          style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
                        >
                          {address}
                        </p>
                        {(() => {
                          const meta = propertyMeta(address);
                          return meta ? (
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className="rounded px-1.5 py-0.5 text-xs font-semibold"
                                style={{ background: "var(--nostos-canvas)", color: "var(--nostos-ink)", border: "1px solid var(--nostos-border)" }}
                              >
                                {meta.price}
                              </span>
                              <span className="text-xs" style={{ color: "var(--nostos-muted)" }}>
                                {meta.beds}
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Divider */}
                      <div className="mx-4 my-3" style={{ height: 1, background: "var(--nostos-border)" }} />

                      {/* Applicants */}
                      <div className="space-y-3 px-4 pb-4">
                        <p
                          className="text-xs font-semibold uppercase"
                          style={{ color: "var(--nostos-muted)", letterSpacing: "0.1em" }}
                        >
                          {apps.some((a) => isPendingApplicantSlot(a))
                            ? "Awaiting applicant"
                            : apps.length === 1
                              ? "1 Applicant"
                              : `${apps.length} Applicants`}
                        </p>

                        {apps.map((app) => {
                          if (isPendingApplicantSlot(app)) {
                            return (
                              <div
                                key={app.applicationId}
                                className="rounded-xl p-3 text-left"
                                style={{
                                  background: "var(--nostos-canvas)",
                                  border: "1px solid var(--nostos-border)",
                                }}
                              >
                                <p className="text-sm leading-snug" style={{ color: "var(--nostos-ink-secondary)" }}>
                                  No applicant yet. Complete the renter workflow for this listing to show Janice Sample with her tour time.
                                </p>
                                <div className="mt-2.5">
                                  <p
                                    className="mb-1 text-xs font-semibold uppercase"
                                    style={{ color: "var(--nostos-muted)", letterSpacing: "0.08em" }}
                                  >
                                    Upcoming Tour
                                  </p>
                                  <p className="text-xs italic" style={{ color: "var(--nostos-muted)" }}>
                                    To be scheduled
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          const name = app.applicantName ?? app.userId;
                          const initials = name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                          return (
                            <button
                              key={app.applicationId}
                              type="button"
                              onClick={() => setDetailApp(app)}
                              className="w-full rounded-xl p-3 text-left transition-colors"
                              style={{ background: "var(--nostos-canvas)", border: "1px solid var(--nostos-border)" }}
                              onMouseOver={(e) =>
                                ((e.currentTarget as HTMLElement).style.borderColor = "var(--nostos-accent)")
                              }
                              onMouseOut={(e) =>
                                ((e.currentTarget as HTMLElement).style.borderColor = "var(--nostos-border)")
                              }
                            >
                              {/* Name row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                    style={{ background: "var(--nostos-accent)" }}
                                  >
                                    {initials}
                                  </div>
                                  <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
                                    {name}
                                  </p>
                                </div>
                                <span
                                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
                                >
                                  Verified
                                </span>
                              </div>

                              {/* Tour block */}
                              <div className="mt-2.5">
                                <p
                                  className="mb-1 text-xs font-semibold uppercase"
                                  style={{ color: "var(--nostos-muted)", letterSpacing: "0.08em" }}
                                >
                                  Upcoming Tour
                                </p>
                                {app.tourDate ? (
                                  <>
                                    <p className="text-sm font-semibold leading-tight" style={{ color: "var(--nostos-ink)" }}>
                                      {formatTourDay(app.tourDate)}
                                    </p>
                                    <p className="mt-0.5 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                                      {formatTourTime(app.tourDate)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs italic" style={{ color: "var(--nostos-muted)" }}>
                                    To be scheduled
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailApp && !isPendingApplicantSlot(detailApp) && (
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
