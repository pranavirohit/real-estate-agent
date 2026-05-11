"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Image from "next/image";
import axios from "axios";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle,
  XCircle,
  Shield,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Timer,
  Search,
  Filter,
  Download,
  Plus,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Code,
  Info,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  Send,
  LayoutGrid,
  ClipboardList,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  dokimosCardClass,
  dokimosPrimaryButtonClass,
  dokimosSecondaryButtonClass,
  dokimosSectionLabelClass,
} from "@/lib/dokimosLayout";
import { BUSINESS_DEMO_REQUESTS } from "@/components/verifier/businessDemoData";
import VerificationWizard from "@/components/verifier/VerificationWizard";
import {
  getVerificationDisplayName as displayNameForRequest,
  resolveVerificationDisplayName,
  VERIFICATION_DISPLAY_NAME_FALLBACK,
} from "@/lib/verificationPlainLanguage";
import type { VerificationRequest } from "@/types/dokimos";
import { postVerificationRequest } from "@/lib/verifierLiveRequest";
import { formatVerificationActivityRelativeTime } from "@/lib/verificationActivityTime";

interface VerifierSession {
  verifierId: string;
  companyName: string;
  email: string;
}

/** Lucide icon key for program cards */
type ProgramIconKey = "userCheck" | "car" | "shield";

/** Business-facing verification program (maps to a workflow ID for API / filtering) */
interface VerificationProgram {
  id: string;
  workflowId: string;
  name: string;
  iconKey: ProgramIconKey;
  /** e.g. "For: New driver applications" */
  audienceDescription: string;
  /** Human-readable lines for "What gets verified" */
  displayAttributes: string[];
  compliance: string;
  stats: {
    thisMonth: number;
    approvalRate: number;
    avgTime: string;
  };
  status: "active" | "inactive";
}

/** Create-workflow modal: attribute keys match TEE /verify attribute names */
const WORKFLOW_ATTRIBUTE_OPTIONS: {
  key: string;
  title: string;
  description: string;
}[] = [
  {
    key: "name",
    title: "Full Name",
    description: "Legal name from government ID",
  },
  {
    key: "dateOfBirth",
    title: "Date of Birth",
    description: "Full birthdate (ISO in attestation; derived age thresholds available)",
  },
  {
    key: "nationality",
    title: "Nationality",
    description: "Country of citizenship (full name, e.g. United States)",
  },
  {
    key: "address",
    title: "Address",
    description: "Mailing or residential address from ID or supplemental check",
  },
  {
    key: "documentType",
    title: "Document Type",
    description: "Driver's License, Passport, National ID Card",
  },
  {
    key: "documentExpiryDate",
    title: "Document Expiry Date",
    description: "When the ID expires (ISO date in proof)",
  },
  {
    key: "notExpired",
    title: "Document Not Expired",
    description: "Government ID is currently valid",
  },
  {
    key: "ageOver18",
    title: "Age Over 18",
    description: "Derived from date of birth on ID",
  },
  {
    key: "ageOver21",
    title: "Age Over 21",
    description: "Derived from date of birth on ID",
  },
];

type TabType = 'overview' | 'verifications' | 'workflows';

/** Seeded TEE verifier for Airbnb — matches `src/index.ts` demo accounts (`airbnb_prod`). */
const AIRBNB_DEMO_SESSION: VerifierSession = {
  verifierId: "airbnb_prod",
  companyName: "Airbnb",
  email: "verify@airbnb.com",
};

/** Live TEE/API rows plus optimistic sends only — no bundled demo seed. */
function mergeLiveAndOptimisticRequests(
  liveRequests: VerificationRequest[],
  optimisticRequests: VerificationRequest[]
): VerificationRequest[] {
  const liveIds = new Set(liveRequests.map((r) => r.requestId));
  const optimisticOnly = optimisticRequests.filter((o) => !liveIds.has(o.requestId));
  return [...liveRequests, ...optimisticOnly];
}

function mergeVerifierTableRows(
  liveRequests: VerificationRequest[],
  optimisticRequests: VerificationRequest[]
): VerificationRequest[] {
  const merged = mergeLiveAndOptimisticRequests(liveRequests, optimisticRequests);
  const liveIds = new Set(liveRequests.map((r) => r.requestId));
  const optimisticIds = new Set(
    optimisticRequests.filter((o) => !liveIds.has(o.requestId)).map((o) => o.requestId)
  );
  const demoOnly = BUSINESS_DEMO_REQUESTS.filter(
    (d) => !liveIds.has(d.requestId) && !optimisticIds.has(d.requestId)
  );
  return [...merged, ...demoOnly];
}

/** Demo dashboard for `/business` — polls TEE for real rows, merges with demo + send-panel optimistic. */
export function VerifierDashboard() {
  const session = AIRBNB_DEMO_SESSION;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [liveRequests, setLiveRequests] = useState<VerificationRequest[]>([]);
  /** Rows from “Send request” until the next poll includes them (or superseded by live). */
  const [optimisticRequests, setOptimisticRequests] = useState<VerificationRequest[]>([]);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  /** When set, Verifications tab filters to this workflow ID */
  const [workflowFilter, setWorkflowFilter] = useState<string | null>(null);

  const mergedRequests = useMemo(
    () => mergeVerifierTableRows(liveRequests, optimisticRequests),
    [liveRequests, optimisticRequests]
  );

  /** Hide rows whose only resolvable label is the digit-placeholder fallback (“Verified applicant”). */
  const dashboardRequests = useMemo(() => {
    const fb = VERIFICATION_DISPLAY_NAME_FALLBACK.toLowerCase();
    return mergedRequests.filter(
      (r) => displayNameForRequest(r).toLowerCase() !== fb
    );
  }, [mergedRequests]);

  /** Overview “Recent activity” — synced with verifier API only (same source as TEE `requests` store). */
  const recentActivityRequests = useMemo(() => {
    const merged = mergeLiveAndOptimisticRequests(liveRequests, optimisticRequests);
    const fb = VERIFICATION_DISPLAY_NAME_FALLBACK.toLowerCase();
    const filtered = merged.filter(
      (r) => displayNameForRequest(r).toLowerCase() !== fb
    );
    return [...filtered]
      .sort((a, b) => {
        const ta = new Date(a.completedAt || a.createdAt).getTime();
        const tb = new Date(b.completedAt || b.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }, [liveRequests, optimisticRequests]);

  useEffect(() => {
    const verifierId = encodeURIComponent(session.verifierId);
    const url = `/api/requests/verifier/${verifierId}`;

    const fetchLive = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const data: unknown = await response.json();
        const list: VerificationRequest[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              Array.isArray((data as { requests?: unknown }).requests)
            ? (data as { requests: VerificationRequest[] }).requests
            : [];
        setLiveRequests(list);
      } catch (e) {
        console.error("Failed to poll verifier requests:", e);
      }
    };

    void fetchLive();
    const pollInterval = setInterval(() => void fetchLive(), 10000);
    return () => clearInterval(pollInterval);
  }, [session.verifierId]);

  const programs: VerificationProgram[] = [
    {
      id: "host_verification",
      workflowId: "host_verification",
      name: "Host Verification",
      iconKey: "userCheck",
      audienceDescription:
        "Verify identity and eligibility for hosts listing properties",
      displayAttributes: [
        "Government-issued ID",
        "Age 18+ verification",
        "Address confirmation",
        "Full name verification",
      ],
      compliance:
        "Host identity and eligibility checks; obligations vary by region (e.g. short-term rental rules).",
      stats: { thisMonth: 1247, approvalRate: 98, avgTime: "2m 18s" },
      status: "active",
    },
    {
      id: "guest_verification",
      workflowId: "guest_verification",
      name: "Guest Identity Check",
      iconKey: "car",
      audienceDescription:
        "Verify guest identity before booking confirmation",
      displayAttributes: [
        "Government-issued ID",
        "Age 18+ verification",
        "Full name verification",
      ],
      compliance: "Booking and trust & safety policies for guest identity.",
      stats: { thisMonth: 3891, approvalRate: 99, avgTime: "1m 48s" },
      status: "active",
    },
  ];

  const navItems: {
    id: TabType;
    label: string;
    Icon: typeof LayoutGrid;
  }[] = [
    { id: "overview", label: "Overview", Icon: LayoutGrid },
    { id: "verifications", label: "Verifications", Icon: ClipboardList },
    { id: "workflows", label: "Programs", Icon: Layers },
  ];

  const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col lg:flex-row"
      style={{ fontFamily: sans }}
    >
      {/* Mobile: compact segmented nav */}
      <div
        className="sticky top-0 z-30 flex gap-1 border-b border-slate-200/90 bg-white/85 px-3 py-2.5 backdrop-blur-xl lg:hidden"
        role="navigation"
        aria-label="Dashboard sections"
      >
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`min-h-[44px] flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-semibold transition-all ${
              activeTab === id
                ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desktop: vault-style dark rail */}
      <aside
        className="relative hidden min-h-0 w-[min(280px,32vw)] shrink-0 flex-col self-stretch border-r border-white/10 bg-[#0b1020] lg:flex lg:h-full"
        aria-label="Business navigation"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgba(45,212,191,0.12),transparent_55%),radial-gradient(80%_60%_at_100%_100%,rgba(59,130,246,0.08),transparent)]"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/10 px-6 pb-6 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#2DD4BF] shadow-lg shadow-teal-950/40 ring-1 ring-white/15">
                <span className="text-base font-bold tracking-tight text-white">D</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Business
                </p>
                <p className="text-[15px] font-semibold text-white">Console</p>
              </div>
            </div>
          </div>

          <nav
            className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-3 py-4"
            aria-label="Primary"
          >
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] font-semibold transition-all ${
                  activeTab === id
                    ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,0.35)] ring-1 ring-teal-400/15"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${activeTab === id ? "text-teal-300" : "text-slate-500"}`}
                  strokeWidth={2}
                  aria-hidden
                />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto shrink-0 px-4 pb-8 pt-5">
            <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg shadow-inner ring-1 ring-white/10">
                  <Image
                    src="/airbnb_logo.png"
                    alt="Airbnb"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{session.companyName}</p>
                  <p className="truncate text-xs text-slate-500">{session.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main canvas — light panel aligned with consumer vault detail */}
      <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#eceef1]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(13,148,136,0.07),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.5)0%,transparent_35%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <header className="relative mb-6 lg:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-800/90">
              Business
            </p>
            <h1 className="mt-3 max-w-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-[2rem] lg:text-[2.125rem]">
              {activeTab === "overview"
                ? "Overview"
                : activeTab === "workflows"
                  ? "Programs"
                  : "Verified Users"}
            </h1>
          </header>

          <div className="space-y-0">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <OverviewTab
                    requests={dashboardRequests}
                    recentActivityRequests={recentActivityRequests}
                    programs={programs}
                    setActiveTab={setActiveTab}
                  />
                </motion.div>
              )}
              {activeTab === "verifications" && (
                <motion.div
                  key="verifications"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <VerificationsTab
                    requests={dashboardRequests}
                    programs={programs}
                    workflowFilter={workflowFilter}
                    onClearWorkflowFilter={() => setWorkflowFilter(null)}
                    onRequestCreated={(req) => {
                      setOptimisticRequests((prev) => {
                        if (prev.some((r) => r.requestId === req.requestId)) return prev;
                        return [req, ...prev];
                      });
                    }}
                  />
                </motion.div>
              )}
              {activeTab === "workflows" && (
                <motion.div
                  key="workflows"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                >
                  <WorkflowsTab
                    programs={programs}
                    showCreateWorkflow={showCreateWorkflow}
                    setShowCreateWorkflow={setShowCreateWorkflow}
                    setActiveTab={setActiveTab}
                    setWorkflowFilter={setWorkflowFilter}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({
  requests,
  recentActivityRequests,
  programs,
  setActiveTab,
}: {
  requests: VerificationRequest[];
  /** From TEE/API + optimistic only; not demo-seeded. */
  recentActivityRequests: VerificationRequest[];
  programs: VerificationProgram[];
  setActiveTab: (tab: TabType) => void;
}) {
  const programName = (workflowId?: string) => {
    const id = workflowId || "host_verification";
    return programs.find((p) => p.workflowId === id)?.name ?? id;
  };

  const totalVerifications = requests.length || 1570;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const approvalRate = totalVerifications > 0 ? ((approvedCount / totalVerifications) * 100).toFixed(1) : '87.3';
  const activeWorkflowCount = programs.filter((p) => p.status === "active").length;

  const recentActivity = recentActivityRequests;

  const overviewStatCardClass =
    "rounded-2xl border border-[#0B1739] bg-[#04102A] p-5 shadow-lg shadow-black/25 sm:p-6";

  return (
    <div className="w-full max-w-full space-y-8">
      {/* Stats — 1 col phone, 2 col small tablet, 4 col from ~900px (laptop) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[900px]:grid-cols-4 min-[900px]:gap-6">
        <div className={overviewStatCardClass}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Total verifications
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums tracking-tight text-white">
            {totalVerifications.toLocaleString()}
          </p>
          <p className="mb-2 text-xs text-slate-400">This month</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={14} />
            <span>12% vs last month</span>
          </div>
        </div>

        <div className={overviewStatCardClass}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Approval rate
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums tracking-tight text-white">
            {approvalRate}%
          </p>
          <p className="mb-2 text-xs text-slate-400">Last 30 days</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={14} />
            <span>2.1% vs previous period</span>
          </div>
        </div>

        <div className={overviewStatCardClass}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Avg completion time
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums tracking-tight text-white">
            3m 12s
          </p>
          <p className="mb-2 text-xs text-slate-400">Median time to complete</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingDown size={14} />
            <span>15s faster than last month</span>
          </div>
        </div>

        <div className={overviewStatCardClass}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Active workflows
          </p>
          <p className="mb-1 text-3xl font-semibold tabular-nums tracking-tight text-white">
            {activeWorkflowCount.toLocaleString()}
          </p>
          <p className="mb-2 text-xs text-slate-400">
            {programs.length} program{programs.length === 1 ? "" : "s"} total
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <Layers size={14} />
            <span>
              {activeWorkflowCount === programs.length
                ? "All programs active"
                : `${programs.length - activeWorkflowCount} inactive`}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={dokimosCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <p className={`${dokimosSectionLabelClass}`}>Recent activity</p>
          <button 
            onClick={() => setActiveTab('verifications')}
            className="text-sm font-medium text-dokimos-accent hover:text-dokimos-accentHover transition-colors duration-150"
          >
            View all verifications →
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(req => (
              <div
                key={req.requestId}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
                        req.status === "approved"
                          ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-800"
                          : req.status === "pending"
                            ? "border-amber-500/25 bg-amber-500/15 text-amber-800"
                            : "border-red-500/25 bg-red-500/15 text-red-700"
                      }`}
                    >
                      {req.status === "approved"
                        ? "Approved"
                        : req.status === "pending"
                          ? "Pending"
                          : "Denied"}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                      {displayNameForRequest(req)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatVerificationActivityRelativeTime(
                      req.completedAt || req.createdAt
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {programName(req.workflow)} · {req.requestedAttributes.length}{" "}
                  fields
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: VERIFICATIONS
// ═══════════════════════════════════════════════════════════════════

const PENDING_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

type RowStatus = "verified" | "pending" | "denied" | "expired";

function rowStatus(req: VerificationRequest): RowStatus {
  if (req.status === "denied") return "denied";
  if (req.status === "approved") return "verified";
  if (req.status === "pending") {
    if (Date.now() - new Date(req.createdAt).getTime() > PENDING_EXPIRE_MS)
      return "expired";
    return "pending";
  }
  return "pending";
}

/** Single timestamp column: label matches mental model (verified vs requested vs decision). */
function activityDisplayForRow(req: VerificationRequest, rs: RowStatus): {
  label: string;
  iso: string;
} {
  if (rs === "verified" && req.completedAt) {
    return { label: "Verified", iso: req.completedAt };
  }
  if (rs === "denied") {
    const t = req.completedAt || req.createdAt;
    return { label: "Decision", iso: t };
  }
  return { label: "Requested", iso: req.createdAt };
}

function VerificationsTab({
  requests,
  programs,
  workflowFilter,
  onClearWorkflowFilter,
  onRequestCreated,
}: {
  requests: VerificationRequest[];
  programs: VerificationProgram[];
  workflowFilter: string | null;
  onClearWorkflowFilter: () => void;
  onRequestCreated: (req: VerificationRequest) => void;
}) {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RowStatus>("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [sortKey, setSortKey] = useState<
    "name" | "workflow" | "status" | "verified"
  >("verified");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [sendRowKey, setSendRowKey] = useState<string | null>(null);
  const [sendNotice, setSendNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const formatWorkflowName = (workflowId: string) => {
    const fromPrograms = programs.find((p) => p.workflowId === workflowId);
    if (fromPrograms) return fromPrograms.name;
    const map: Record<string, string> = {
      host_verification: "Host Verification",
      guest_verification: "Guest Identity Check",
      driver_background_check: "Driver Background Check",
      vehicle_registration: "Vehicle Registration",
      continuous_monitoring: "Continuous Driver Monitoring",
      driver_onboarding: "Driver Onboarding",
      rental_application: "Rental Application",
      account_opening: "Account Opening",
      rider_verification_high_risk: "Rider Verification - High Risk",
      restaurant_partner_onboarding: "Restaurant Partner Onboarding",
    };
    if (map[workflowId]) return map[workflowId];
    if (!workflowId.trim()) return "";
    return workflowId
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const filteredProgramName =
    workflowFilter &&
    programs.find((p) => p.workflowId === workflowFilter)?.name;

  const queueStats = useMemo(() => {
    let pending = 0;
    for (const r of requests) {
      if (rowStatus(r) === "pending") pending++;
    }
    return { pending, total: requests.length };
  }, [requests]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    dateRange !== "all" ||
    Boolean(workflowFilter);

  const showFilterChips =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    dateRange !== "all";

  const baseFiltered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();
    const weekMs = 7 * 86400000;
    const monthMs = 30 * 86400000;
    return requests.filter((req) => {
      if (workflowFilter && req.workflow !== workflowFilter) return false;
      const name = displayNameForRequest(req).toLowerCase();
      const email = req.userEmail.toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;
      if (statusFilter !== "all" && rowStatus(req) !== statusFilter)
        return false;
      const t = new Date(req.completedAt || req.createdAt).getTime();
      if (dateRange === "week" && now - t > weekMs) return false;
      if (dateRange === "month" && now - t > monthMs) return false;
      return true;
    });
  }, [requests, workflowFilter, searchQuery, statusFilter, dateRange]);

  const dedupedFiltered = useMemo(() => {
    const byName = new Map<string, VerificationRequest>();
    for (const req of baseFiltered) {
      const key = displayNameForRequest(req).trim().toLowerCase();
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, req);
        continue;
      }
      const existingTs = new Date(
        existing.completedAt || existing.createdAt
      ).getTime();
      const nextTs = new Date(req.completedAt || req.createdAt).getTime();
      if (nextTs > existingTs) {
        byName.set(key, req);
      }
    }
    return Array.from(byName.values());
  }, [baseFiltered]);

  const sortedRows = useMemo(() => {
    const list = [...dedupedFiltered];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = displayNameForRequest(a).localeCompare(displayNameForRequest(b));
      } else if (sortKey === "workflow") {
        cmp = formatWorkflowName(a.workflow || "").localeCompare(
          formatWorkflowName(b.workflow || "")
        );
      } else if (sortKey === "status") {
        cmp = rowStatus(a).localeCompare(rowStatus(b));
      } else {
        const ta = new Date(a.completedAt || a.createdAt).getTime();
        const tb = new Date(b.completedAt || b.createdAt).getTime();
        cmp = ta - tb;
      }
      return cmp * dir;
    });
    return list;
  }, [dedupedFiltered, sortKey, sortDir, programs]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);
  const pageRows = useMemo(() => {
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, totalPages]);

  const rowSendKey = (req: VerificationRequest) =>
    `${req.userEmail}\0${req.workflow ?? ""}`;

  const handleSendRequest = async (req: VerificationRequest, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSendNotice(null);
    setSendRowKey(rowSendKey(req));
    try {
      const created = await postVerificationRequest({
        userEmail: req.userEmail,
        workflow: req.workflow,
      });
      onRequestCreated(created);
      setSendNotice({
        type: "success",
        message: `Request ${created.requestId} created for ${req.userEmail}. They will see it in Pending.`,
      });
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Request failed. Is Fastify (TEE) running on TEE_ENDPOINT?";
      setSendNotice({ type: "error", message: msg });
    } finally {
      setSendRowKey(null);
    }
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "verified" ? "desc" : "asc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    const headers = [
      "Name",
      "Email",
      "Workflow",
      "Status",
      "LastActivity",
      "RequestId",
    ];
    const lines = sortedRows.map((req) => {
      const rs = rowStatus(req);
      const activity = activityDisplayForRow(req, rs);
      return [
        displayNameForRequest(req),
        req.userEmail,
        formatWorkflowName(req.workflow || ""),
        rs,
        `${activity.label}: ${activity.iso}`,
        req.requestId,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob(["\ufeff", headers.join(",") + "\n" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dokimos-verifications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (rs: RowStatus) => {
    const styles: Record<RowStatus, string> = {
      verified: "bg-emerald-500/15 text-emerald-900 ring-emerald-500/25",
      pending: "bg-amber-500/15 text-amber-900 ring-amber-500/25",
      denied: "bg-red-500/15 text-red-900 ring-red-500/25",
      expired: "bg-slate-200/80 text-slate-700 ring-slate-300",
    };
    const label =
      rs === "verified"
        ? "Verified"
        : rs === "pending"
          ? "Pending"
          : rs === "denied"
            ? "Denied"
            : "Expired";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles[rs]}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="w-full max-w-full space-y-5">
      <div className="flex flex-col gap-1">
        <p
          className={`${dokimosSectionLabelClass} mb-0`}
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          Verifications
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">
            {queueStats.pending} pending
          </span>
          <span className="text-slate-400"> · </span>
          {queueStats.total} total
          {hasActiveFilters ? (
            <>
              <span className="text-slate-400"> · </span>
              Showing {sortedRows.length.toLocaleString()} match
              {sortedRows.length === 1 ? "" : "es"}
            </>
          ) : null}
        </p>
      </div>

      {workflowFilter && filteredProgramName && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
          <span>
            Showing verifications for:{" "}
            <span className="font-semibold text-slate-900">{filteredProgramName}</span>
          </span>
          <button
            type="button"
            onClick={onClearWorkflowFilter}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50"
          >
            Show all programs
          </button>
        </div>
      )}

      {sendNotice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            sendNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-red-200 bg-red-50/80 text-red-800"
          }`}
          role={sendNotice.type === "error" ? "alert" : undefined}
        >
          {sendNotice.message}
        </div>
      ) : null}

      {/* Toolbar + table */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-accent"
          />
        </div>
        <div className="relative min-w-[11.5rem]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | RowStatus);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200/90 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 shadow-sm shadow-slate-900/[0.04] transition-colors hover:border-slate-300 hover:bg-slate-50/90 focus:border-dokimos-accent/40 focus:outline-none focus:ring-2 focus:ring-dokimos-accent/20"
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified only</option>
            <option value="pending">Pending only</option>
            <option value="denied">Denied</option>
            <option value="expired">Expired</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <div className="relative min-w-[11.5rem]">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as "all" | "week" | "month");
              setPage(1);
            }}
            aria-label="Filter by date"
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200/90 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 shadow-sm shadow-slate-900/[0.04] transition-colors hover:border-slate-300 hover:bg-slate-50/90 focus:border-dokimos-accent/40 focus:outline-none focus:ring-2 focus:ring-dokimos-accent/20"
          >
            <option value="all">All dates</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className={`${dokimosSecondaryButtonClass} inline-flex gap-2 py-2.5 text-sm`}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {showFilterChips ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Filters
          </span>
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Search: &quot;{searchQuery.trim().length > 28 ? `${searchQuery.trim().slice(0, 28)}…` : searchQuery.trim()}
              <X className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            </button>
          ) : null}
          {statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Status:{" "}
              {statusFilter === "verified"
                ? "Verified"
                : statusFilter === "pending"
                  ? "Pending"
                  : statusFilter === "denied"
                    ? "Denied"
                    : "Expired"}
              <X className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            </button>
          ) : null}
          {dateRange !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setDateRange("all");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Date: {dateRange === "week" ? "This week" : "This month"}
              <X className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`${dokimosCardClass} overflow-hidden !p-0`}>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <thead className="border-b border-[#0B1739] bg-[#04102A]">
              <tr>
                <th className="w-[17%] min-w-0 px-4 py-3 text-left align-middle lg:w-[17%]" scope="col">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" />
                  </button>
                </th>
                <th
                  className="hidden w-[17%] min-w-0 px-4 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-200 lg:table-cell lg:w-[18%]"
                  scope="col"
                >
                  Email
                </th>
                <th className="w-[19%] min-w-0 px-4 py-3 text-left align-middle lg:w-[19%]" scope="col">
                  <button
                    type="button"
                    onClick={() => toggleSort("workflow")}
                    className="inline-flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white"
                  >
                    Workflow
                    <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" />
                  </button>
                </th>
                <th className="w-[12%] min-w-0 px-4 py-3 text-left align-middle lg:w-[11%]" scope="col">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white"
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" />
                  </button>
                </th>
                <th className="w-[15%] min-w-0 px-4 py-3 text-left align-middle lg:w-[17%]" scope="col">
                  <button
                    type="button"
                    onClick={() => toggleSort("verified")}
                    title="Requested, decision, or verified time depending on status"
                    className="inline-flex w-full min-w-0 items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white"
                  >
                    <span className="truncate">Last activity</span>
                    <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" />
                  </button>
                </th>
                <th
                  className="w-[11%] min-w-0 px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-200 lg:w-[9%]"
                  scope="col"
                  title="Resend a verification request when the row is still open or can be retried"
                >
                  Send
                </th>
                <th
                  className="w-[11%] min-w-0 pl-2 pr-5 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-200 lg:w-[9%] lg:pr-6"
                  scope="col"
                >
                  Review
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((req) => {
                const rs = rowStatus(req);
                const activity = activityDisplayForRow(req, rs);
                const showSend = rs !== "verified";
                const reviewIsVerify = rs === "pending" || rs === "expired";
                return (
                  <tr
                    key={req.requestId}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => {
                      setSelectedRequest(req);
                      setVerifyModalOpen(true);
                    }}
                  >
                    <td className="w-[17%] min-w-0 px-4 py-3 align-middle font-medium text-slate-900 lg:w-[17%]">
                      <span className="block min-w-0 truncate">
                        {displayNameForRequest(req)}
                      </span>
                    </td>
                    <td
                      className="hidden w-[17%] min-w-0 truncate px-4 py-3 align-middle text-slate-600 lg:table-cell lg:w-[18%]"
                      title={req.userEmail}
                    >
                      {req.userEmail}
                    </td>
                    <td className="w-[19%] min-w-0 px-4 py-3 align-middle text-slate-700 lg:w-[19%]">
                      <span className="line-clamp-2 break-words">
                        {formatWorkflowName(req.workflow ?? "")}
                      </span>
                    </td>
                    <td className="w-[12%] min-w-0 px-4 py-3 align-middle lg:w-[11%]">
                      {statusBadge(rs)}
                    </td>
                    <td className="w-[15%] min-w-0 px-4 py-3 align-middle text-slate-600 lg:w-[17%]">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {activity.label}
                      </span>
                      <span className="whitespace-nowrap text-sm text-slate-700">
                        {new Date(activity.iso).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="w-[11%] min-w-0 px-3 py-3 align-middle lg:w-[9%]">
                      <div className="flex justify-start whitespace-nowrap">
                        {!showSend ? (
                          <span className="text-xs text-slate-400" title="Completed — resend not needed">
                            —
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => void handleSendRequest(req, e)}
                            disabled={sendRowKey === rowSendKey(req)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-dokimos-accent transition-colors hover:border-dokimos-accent/40 hover:bg-teal-50/80 disabled:opacity-50`}
                          >
                            <Send className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {sendRowKey === rowSendKey(req) ? "Sending…" : "Send"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="w-[11%] min-w-0 pl-2 pr-5 py-3 align-middle lg:w-[9%] lg:pr-6">
                      <div className="flex justify-start whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                            setVerifyModalOpen(true);
                          }}
                          title={
                            reviewIsVerify
                              ? "Open verification — user may still need to complete checks"
                              : "View verification record and proof details"
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-dokimos-accent transition-colors hover:border-dokimos-accent/40 hover:bg-teal-50/80"
                        >
                          {reviewIsVerify ? "Verify" : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          <span>
            Showing {(safePage - 1) * pageSize + 1}-
            {Math.min(safePage * pageSize, sortedRows.length)} of{" "}
            {sortedRows.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {verifyModalOpen && selectedRequest ? (
        <VerificationWizard
          key={selectedRequest.requestId}
          request={selectedRequest}
          open
          onClose={() => {
            setVerifyModalOpen(false);
            setSelectedRequest(null);
          }}
        />
      ) : null}

      {sortedRows.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center shadow-none">
          <Shield className="mx-auto mb-3 h-12 w-12 text-slate-400" />
          <p className="text-slate-500 text-sm">No verifications found</p>
          <p className="text-slate-500 text-xs mt-1">Verifications will appear here when triggered by your application</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: VERIFICATION PROGRAMS
// ═══════════════════════════════════════════════════════════════════

function WorkflowsTab({
  programs,
  showCreateWorkflow,
  setShowCreateWorkflow,
  setActiveTab,
  setWorkflowFilter,
}: {
  programs: VerificationProgram[];
  showCreateWorkflow: boolean;
  setShowCreateWorkflow: (show: boolean) => void;
  setActiveTab: (tab: TabType) => void;
  setWorkflowFilter: (id: string | null) => void;
}) {
  const [integrationOpenId, setIntegrationOpenId] = useState<string | null>(
    null
  );
  const [editingProgram, setEditingProgram] =
    useState<VerificationProgram | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrationOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`${dokimosSectionLabelClass} mb-1`} style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
            Programs
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Create custom verification programs for different use cases. Each program defines what identity attributes you need to verify.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProgram(null);
            setShowCreateWorkflow(true);
          }}
          className={`${dokimosPrimaryButtonClass} inline-flex shrink-0 gap-2 !h-11 min-h-[44px] sm:!h-12`}
        >
          <Plus size={16} />
          Create workflow
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {programs.map((program) => {
          return (
          <div
            key={program.id}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-colors duration-150 hover:border-slate-300/90"
          >
            <div className="border-b border-white/10 bg-[#0B0E14] px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-landing text-lg font-semibold text-white">
                      {program.name}
                    </h2>
                    {program.status === "active" && (
                      <span className="rounded-md px-2 py-0.5 text-xs font-semibold bg-[#D1FADF] text-[#027A48] ring-1 ring-[#027A48]/15">
                        Active
                      </span>
                    )}
                    {program.status === "inactive" && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold bg-white/10 text-slate-300 ring-1 ring-white/15">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {program.audienceDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            <div className="mb-6 grid min-w-0 grid-cols-3 divide-x divide-slate-200">
              <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1.5 text-center sm:px-3">
                <span className="text-lg font-semibold tabular-nums leading-none text-slate-900 sm:text-2xl">
                  {program.stats.thisMonth.toLocaleString()}
                </span>
                <span className="max-w-full text-[10px] leading-tight text-slate-600 sm:text-sm">
                  this month
                </span>
              </div>
              <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1.5 text-center sm:px-3">
                <span className="text-lg font-semibold tabular-nums leading-none text-emerald-600 sm:text-2xl">
                  {program.stats.approvalRate}%
                </span>
                <span className="max-w-full text-[10px] leading-tight text-slate-600 sm:text-sm">
                  approved
                </span>
              </div>
              <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1.5 text-center sm:px-3">
                <span className="text-lg font-semibold tabular-nums leading-none text-slate-900 sm:text-2xl">
                  {program.stats.avgTime}
                </span>
                <span className="max-w-full text-[10px] leading-tight text-slate-600 sm:text-sm">
                  avg time
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-700">
                What Gets Verified
              </h4>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {program.displayAttributes.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check
                        className="h-3 w-3 text-emerald-600"
                        strokeWidth={3}
                      />
                    </div>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-r border-l-4 border-green-600 bg-green-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                  strokeWidth={2}
                />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-green-900">
                    Compliance
                  </div>
                  <p className="mt-1 text-sm text-green-800">{program.compliance}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-stretch gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => {
                  setWorkflowFilter(program.workflowId);
                  setActiveTab("verifications");
                }}
                className={`${dokimosPrimaryButtonClass} min-h-[44px] min-w-[160px] flex-1 !h-auto py-2.5 text-sm`}
              >
                View verifications
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProgram(program);
                  setShowCreateWorkflow(true);
                }}
                className={`${dokimosSecondaryButtonClass} !h-auto py-2.5 text-sm`}
              >
                Edit program
              </button>
              <button
                type="button"
                onClick={() => toggleIntegration(program.id)}
                className="group inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Code className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-600" />
                <span>API</span>
                <ChevronDown
                  className={`h-3 w-3 shrink-0 text-slate-500 transition-transform duration-200 ${
                    integrationOpenId === program.id ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                integrationOpenId === program.id
                  ? "mt-4 max-h-[480px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Developer integration
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Workflow ID
                    </p>
                    <code className="block rounded-lg bg-slate-100 px-2 py-2 font-mono text-xs text-slate-900">
                      {program.workflowId}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      API endpoint
                    </p>
                    <code className="block rounded-lg bg-slate-100 px-2 py-2 font-mono text-xs text-slate-900">
                      POST /api/request-verification
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Example request
                    </p>
                    <pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 font-mono text-[11px] leading-relaxed text-slate-900">
{`curl -X POST https://your-domain.com/api/request-verification \\
  -H "Content-Type: application/json" \\
  -d '{"workflow":"${program.workflowId}","userEmail":"user@example.com"}'`}
                    </pre>
                  </div>
                  <a
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-dokimos-accent hover:text-dokimos-accentHover"
                  >
                    View full API docs
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            </div>
          </div>
          );
        })}
      </div>

      {showCreateWorkflow && (
        <ProgramModal
          key={editingProgram?.workflowId ?? "create"}
          mode={editingProgram ? "edit" : "create"}
          initialProgram={editingProgram}
          onClose={() => {
            setShowCreateWorkflow(false);
            setEditingProgram(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CREATE / EDIT PROGRAM MODAL
// ═══════════════════════════════════════════════════════════════════

function slugifyWorkflowId(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (s.slice(0, 64) || "workflow").replace(/^_+|_+$/g, "");
}

function ProgramModal({
  onClose,
  mode,
  initialProgram,
}: {
  onClose: () => void;
  mode: "create" | "edit";
  initialProgram: VerificationProgram | null;
}) {
  const [programName, setProgramName] = useState("");
  const [programKey, setProgramKey] = useState("");
  const [purposeLine, setPurposeLine] = useState("");
  const [complianceNote, setComplianceNote] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [slugManual, setSlugManual] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (mode === "edit" && initialProgram) {
      setProgramName(initialProgram.name);
      setProgramKey(initialProgram.workflowId);
      setPurposeLine(initialProgram.audienceDescription);
      setComplianceNote(initialProgram.compliance);
      setSelectedAttributes(["ageOver21", "name", "notExpired"]);
      setSlugManual(true);
    } else {
      setProgramName("");
      setProgramKey("");
      setPurposeLine("");
      setComplianceNote("");
      setSelectedAttributes([]);
      setSlugManual(false);
    }
  }, [mode, initialProgram]);

  useEffect(() => {
    if (mode === "create" && !slugManual && programName.trim()) {
      setProgramKey(slugifyWorkflowId(programName));
    }
  }, [programName, mode, slugManual]);

  const toggleAttribute = (attr: string) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter((a) => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  const handleSubmit = () => {
    if (mode === "create") {
      alert(
        `Workflow created.\n\nDevelopers use:\nworkflow: "${programKey}"\nin POST /api/request-verification` +
          (purposeLine ? `\n\nPurpose (for your team): ${purposeLine}` : "")
      );
    } else {
      alert(`Saved changes to “${programName}”.`);
    }
    onClose();
  };

  const isEdit = mode === "edit";

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            {isEdit ? "Edit verification workflow" : "Create verification workflow"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-slate-500">
            {isEdit
              ? "Update what this workflow verifies and how it appears to your team."
              : "Name the workflow, pick the attributes you need—users share only what you ask for."}
          </p>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Workflow name *
            </label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g. Host Verification"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Workflow ID (for API) *
            </label>
            <input
              type="text"
              value={programKey}
              onChange={(e) => {
                setSlugManual(true);
                setProgramKey(
                  e.target.value.toLowerCase().replace(/\s+/g, "_")
                );
              }}
              placeholder="host_verification"
              disabled={isEdit}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-accent disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-500">
              Auto-filled from the workflow name; you can edit before creating.{" "}
              {isEdit ? "ID can’t be changed after creation." : ""}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Required attributes *
            </label>
            <p className="mb-3 text-xs text-slate-500">
              Select the information you need from a verified identity.
            </p>
            <div className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
              {WORKFLOW_ATTRIBUTE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAttributes.includes(opt.key)}
                    onChange={() => toggleAttribute(opt.key)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded text-dokimos-accent focus:ring-dokimos-accent"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {opt.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {opt.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Purpose (optional)
            </label>
            <textarea
              value={purposeLine}
              onChange={(e) => setPurposeLine(e.target.value)}
              placeholder="e.g. Verify host identity before property listing"
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Compliance note (optional)
            </label>
            <textarea
              value={complianceNote}
              onChange={(e) => setComplianceNote(e.target.value)}
              placeholder="Internal compliance or policy note"
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-dokimos-accent"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`${dokimosSecondaryButtonClass} !h-auto py-2.5 text-sm`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !programName ||
              !programKey ||
              selectedAttributes.length === 0
            }
            className={`${dokimosPrimaryButtonClass} !h-auto py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isEdit ? "Save workflow" : "Create workflow"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

