"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowLeft, Send, Loader2, ShieldCheck, X } from "lucide-react";
import {
  fallbackMockListings,
  type AgentListing,
} from "@/lib/agentListings";
import { parseRentalSearchQuery } from "@/lib/parseRentalSearchQuery";

type ChatMsg = { role: "user" | "assistant"; text: string };
type Phase = "chat" | "awaiting-approval" | "submitted" | "error";

const AGENT_ID = "nostos-rental-agent";
const WORKFLOW_ID = "rental_application";

function ListingCard({
  listing,
  selected,
  disabled,
  onSelect,
}: {
  listing: AgentListing;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full rounded-2xl border p-4 text-left transition-all disabled:opacity-50"
      style={{
        background: selected ? "var(--nostos-accent-soft)" : "var(--nostos-surface)",
        borderColor: selected ? "var(--nostos-accent)" : "var(--nostos-border)",
        outline: selected ? "2px solid var(--nostos-accent)" : "none",
        outlineOffset: "-1px",
      }}
    >
      <p
        className="font-semibold leading-snug"
        style={{ color: "var(--nostos-ink)", fontSize: "0.875rem" }}
      >
        {listing.address}
      </p>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--nostos-accent)", fontWeight: 600 }}
      >
        {listing.price}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
        {[
          listing.beds && `${listing.beds} bd`,
          listing.baths && `${listing.baths} ba`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </button>
  );
}

function ApprovalSheet({
  listing,
  onApprove,
  onCancel,
  loading,
}: {
  listing: AgentListing;
  onApprove: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 shadow-2xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md sm:rounded-3xl sm:bottom-8"
        style={{ background: "var(--nostos-surface)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--nostos-accent-soft)" }}
          >
            <ShieldCheck
              className="h-5 w-5"
              style={{ color: "var(--nostos-accent)" }}
            />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto rounded-full p-1 transition-opacity hover:opacity-60"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" style={{ color: "var(--nostos-muted)" }} />
          </button>
        </div>

        <h2
          id="approval-title"
          className="text-xl leading-snug"
          style={{
            fontFamily: "var(--font-nostos-serif), Georgia, serif",
            color: "var(--nostos-ink)",
          }}
        >
          Confirm your identity to apply
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
          {listing.address.split(",")[0]} is asking to confirm who you are.
        </p>

        <div
          className="my-5 rounded-xl p-4"
          style={{ background: "var(--nostos-canvas)", border: "1px solid var(--nostos-border)" }}
        >
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--nostos-ink-secondary)" }}
          >
            They will receive
          </p>
          {["Your full name", "That you are over 18", "Your address"].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <div
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: "var(--nostos-accent)" }}
              />
              <p className="text-sm" style={{ color: "var(--nostos-ink)" }}>
                {item}
              </p>
            </div>
          ))}
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--nostos-muted)" }}
          >
            They will not receive your ID photo or any other documents.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--nostos-border-strong)",
              color: "var(--nostos-ink)",
              background: "var(--nostos-surface)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: "var(--nostos-accent)" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Approve
          </button>
        </div>
      </div>
    </>
  );
}

export default function NostosFind() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email ?? null;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "What are you looking for? Tell me the neighborhood, bedrooms, budget, and anything else that matters.",
    },
  ]);
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingListing, setPendingListing] = useState<AgentListing | null>(null);
  const [phase, setPhase] = useState<Phase>("chat");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushMsg = (role: ChatMsg["role"], text: string) =>
    setMessages((m) => [...m, { role, text }]);

  const fetchListings = async (userMessage: string) => {
    const parsed = parseRentalSearchQuery(userMessage);
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        location: parsed.location,
        maxPrice: String(parsed.maxPrice),
        beds: String(parsed.beds),
      });
      const res = await fetch(`/api/listings?${params}`);
      const raw = await res.text();
      let data: { listings?: AgentListing[] } = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
      const next = Array.isArray(data.listings) && data.listings.length > 0
        ? data.listings.slice(0, 6)
        : fallbackMockListings();
      setListings(next);
      pushMsg("assistant", `Here ${next.length === 1 ? "is one match" : `are ${next.length} places`} that fit. Tap one to apply.`);
    } catch {
      const fallback = fallbackMockListings();
      setListings(fallback);
      pushMsg("assistant", "I couldn't reach live listings right now, but here are some demo homes you can apply to.");
    } finally {
      setListingsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!userEmail || !pendingListing) return;
    setApprovalLoading(true);
    try {
      const { data } = await axios.post<{ requestId: string }>("/api/agent-verify", {
        userId: userEmail,
        workflowId: WORKFLOW_ID,
        agentId: AGENT_ID,
      });
      setRequestId(data.requestId);
      setSelectedId(pendingListing.id);
      setPendingListing(null);
      setPhase("awaiting-approval");
      pushMsg("assistant", "Request sent to Dokimos. Waiting for your approval in your vault...");
    } catch {
      setError("Could not start verification. Try again.");
      setPendingListing(null);
      setPhase("error");
    } finally {
      setApprovalLoading(false);
    }
  };

  useEffect(() => {
    if (phase !== "awaiting-approval" || !requestId || !userEmail || !selectedId) return;
    const listing = listings.find((l) => l.id === selectedId);
    if (!listing) return;

    const tick = async () => {
      try {
        const { data } = await axios.get<{ status: string; attestation: unknown }>(
          `/api/agent-verify/${encodeURIComponent(requestId)}`
        );
        if (data.status === "approved" && data.attestation) {
          stopPoll();
          try {
            const sub = await axios.post("/api/rental-application", {
              listingId: listing.id,
              userId: userEmail,
              attestationRequestId: requestId,
              listingAddress: listing.address,
            });
            setReceipt(sub.data.applicationId as string);
            setPhase("submitted");
            pushMsg("assistant", `Your application to ${listing.address.split(",")[0]} is in. The landlord has your verified identity receipt.`);
          } catch {
            setPhase("error");
            setError("Verification succeeded but submission failed. Try again.");
          }
        } else if (data.status === "denied") {
          stopPoll();
          setPhase("error");
          pushMsg("assistant", "The request was not approved. You can try again from your vault.");
        }
      } catch { /* keep polling */ }
    };

    void tick();
    pollRef.current = setInterval(() => void tick(), 2500);
    return () => stopPoll();
  }, [phase, requestId, userEmail, selectedId, listings, stopPoll]);

  const onSend = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    pushMsg("user", t);
    const lower = t.toLowerCase();
    if (
      lower.includes("find") ||
      lower.includes("search") ||
      lower.includes("looking") ||
      lower.includes("bedroom") ||
      lower.includes("brooklyn") ||
      lower.includes("want")
    ) {
      void fetchListings(t);
    } else {
      pushMsg("assistant", "Try describing what you're looking for — neighborhood, number of bedrooms, and your budget.");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--nostos-accent)" }} />
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex min-h-dvh flex-col">
        <nav className="flex items-center gap-4 px-6 py-5 sm:px-10">
          <Link href="/nostos" className="flex items-center gap-2 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
          >
            Nostos
          </span>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <h1
            className="text-3xl"
            style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
          >
            Sign in to continue
          </h1>
          <p className="mt-3 max-w-sm text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
            Nostos uses your Dokimos account to verify your identity on your behalf when you apply.
          </p>
          <Link
            href="/login?callbackUrl=/nostos/find"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white"
            style={{ background: "var(--nostos-accent)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const inputDisabled = listingsLoading || phase === "awaiting-approval";

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* Top bar */}
        <nav
          className="flex items-center justify-between border-b px-6 py-4 sm:px-10"
          style={{ borderColor: "var(--nostos-border)", background: "var(--nostos-surface)" }}
        >
          <div className="flex items-center gap-4">
            <Link href="/nostos" className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60" style={{ color: "var(--nostos-ink-secondary)" }}>
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
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </div>
            <span className="text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
              {session?.user?.name?.split(" ")[0] ?? userEmail}
            </span>
          </div>
        </nav>

        {/* Chat area */}
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6">
          <div className="flex-1 space-y-4 overflow-y-auto pb-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "var(--nostos-accent)", color: "#fff" }
                      : { background: "var(--nostos-surface)", color: "var(--nostos-ink)", border: "1px solid var(--nostos-border)" }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}

            {listingsLoading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--nostos-surface)", color: "var(--nostos-ink-secondary)", border: "1px solid var(--nostos-border)" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--nostos-accent)" }} />
                  Searching listings...
                </div>
              </div>
            )}

            {phase === "awaiting-approval" && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--nostos-surface)", color: "var(--nostos-ink-secondary)", border: "1px solid var(--nostos-border)" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--nostos-accent)" }} />
                  Waiting for approval in your Dokimos vault...
                </div>
              </div>
            )}

            {phase === "submitted" && receipt && (
              <div
                className="rounded-2xl border p-4"
                style={{ background: "var(--nostos-accent-soft)", borderColor: "var(--nostos-accent)" }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: "var(--nostos-accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
                    Application submitted
                  </p>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                  Application ID:{" "}
                  <span className="font-mono">{receipt}</span>
                </p>
                <Link
                  href="/nostos/landlord"
                  className="mt-3 inline-block text-xs font-semibold underline"
                  style={{ color: "var(--nostos-accent)" }}
                >
                  View in landlord dashboard
                </Link>
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-red-600">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Listing cards */}
          {listings.length > 0 && phase === "chat" && (
            <div className="my-4 grid gap-3 sm:grid-cols-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  selected={selectedId === l.id}
                  disabled={inputDisabled}
                  onSelect={() => {
                    setSelectedId(l.id);
                    setPendingListing(l);
                  }}
                />
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="mt-2 flex gap-2 rounded-2xl border p-2"
            style={{ background: "var(--nostos-surface)", borderColor: "var(--nostos-border)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
              placeholder="2 bedroom in Brooklyn under $3,000..."
              disabled={inputDisabled}
              className="flex-1 bg-transparent px-2 text-sm outline-none disabled:opacity-40"
              style={{ color: "var(--nostos-ink)" }}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={inputDisabled || !input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40"
              style={{ background: "var(--nostos-accent)" }}
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Approval bottom sheet */}
      {pendingListing && (
        <ApprovalSheet
          listing={pendingListing}
          onApprove={handleApprove}
          onCancel={() => { setPendingListing(null); setSelectedId(null); }}
          loading={approvalLoading}
        />
      )}
    </>
  );
}
