"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowLeft, Send, Loader2, ShieldCheck, X } from "lucide-react";
import { useChat } from "ai/react";
import type { ToolCall } from "ai";
import type { Message } from "ai/react";
import type { AgentListing } from "@/lib/agentListings";

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
      <p className="font-semibold leading-snug" style={{ color: "var(--nostos-ink)", fontSize: "0.875rem" }}>
        {listing.address}
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--nostos-accent)", fontWeight: 600 }}>
        {listing.price}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
        {[listing.beds && `${listing.beds} bd`, listing.baths && `${listing.baths} ba`]
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
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} aria-hidden />
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
            <ShieldCheck className="h-5 w-5" style={{ color: "var(--nostos-accent)" }} />
          </div>
          <button type="button" onClick={onCancel} className="ml-auto rounded-full p-1 transition-opacity hover:opacity-60" aria-label="Cancel">
            <X className="h-4 w-4" style={{ color: "var(--nostos-muted)" }} />
          </button>
        </div>

        <h2
          id="approval-title"
          className="text-xl leading-snug"
          style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--nostos-ink-secondary)" }}>
            They will receive
          </p>
          {["Your full name", "That you are over 18", "Your address"].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "var(--nostos-accent)" }} />
              <p className="text-sm" style={{ color: "var(--nostos-ink)" }}>{item}</p>
            </div>
          ))}
          <p className="mt-3 text-xs" style={{ color: "var(--nostos-muted)" }}>
            They will not receive your ID photo or any other documents.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold"
            style={{ borderColor: "var(--nostos-border-strong)", color: "var(--nostos-ink)", background: "var(--nostos-surface)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--nostos-accent)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingListing, setPendingListing] = useState<AgentListing | null>(null);
  const [phase, setPhase] = useState<Phase>("chat");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeListing, setActiveListing] = useState<AgentListing | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => () => stopPoll(), [stopPoll]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/nostos/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "What are you looking for? Tell me the neighborhood, bedrooms, and your budget and I'll find you some options.",
      },
    ],
    onError: (err) => console.error("[nostos/chat]", err),
    onToolCall: async ({ toolCall }: { toolCall: ToolCall<string, unknown> }) => {
      if (toolCall.toolName === "submitApplication") {
        const listing = (toolCall.args as { listing: AgentListing }).listing;
        setSelectedId(listing.id);
        setActiveListing(listing);
        setPendingListing(listing);
        return { status: "pending" };
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleApprove = async () => {
    if (!userEmail || !activeListing) return;
    setApprovalLoading(true);
    try {
      const { data } = await axios.post<{ requestId: string }>("/api/agent-verify", {
        userId: userEmail,
        workflowId: WORKFLOW_ID,
        agentId: AGENT_ID,
      });
      setRequestId(data.requestId);
      setPendingListing(null);
      setPhase("awaiting-approval");
    } catch {
      setError("Could not start verification. Try again.");
      setPendingListing(null);
      setPhase("error");
    } finally {
      setApprovalLoading(false);
    }
  };

  useEffect(() => {
    if (phase !== "awaiting-approval" || !requestId || !userEmail || !activeListing) return;

    const tick = async () => {
      try {
        const { data } = await axios.get<{ status: string; attestation: unknown }>(
          `/api/agent-verify/${encodeURIComponent(requestId)}`
        );
        if (data.status === "approved" && data.attestation) {
          stopPoll();
          try {
            const sub = await axios.post("/api/rental-application", {
              listingId: activeListing.id,
              userId: userEmail,
              attestationRequestId: requestId,
              listingAddress: activeListing.address,
            });
            setReceipt(sub.data.applicationId as string);
            setPhase("submitted");
            void append({
              role: "user",
              content: `Application submitted successfully to ${activeListing.address}.`,
            });
          } catch {
            setPhase("error");
            setError("Verification succeeded but submission failed.");
          }
        } else if (data.status === "denied") {
          stopPoll();
          setPhase("error");
        }
      } catch { /* keep polling */ }
    };

    void tick();
    pollRef.current = setInterval(() => void tick(), 2500);
    return () => stopPoll();
  }, [phase, requestId, userEmail, activeListing, stopPoll, append]);

  // Extract listings from the latest searchListings tool result in messages (ai v4: toolInvocations array)
  const latestListings: AgentListing[] = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as Message;
      if (msg.role !== "assistant") continue;
      const invocations = msg.toolInvocations ?? [];
      for (const inv of invocations) {
        if (inv.toolName === "searchListings" && inv.state === "result") {
          const result = (inv as { result?: { listings?: AgentListing[] } }).result;
          if (Array.isArray(result?.listings)) return result.listings;
        }
      }
    }
    return [];
  })();

  const inputDisabled = isLoading || phase === "awaiting-approval";

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
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}>
            Nostos
          </span>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}>
            Sign in to continue
          </h1>
          <p className="mt-3 max-w-sm text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
            Nostos uses your verified identity when you apply, so you never have to send documents to a landlord.
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
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}>
              Nostos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </div>
            <span className="text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
              {session?.user?.name?.split(" ")[0] ?? userEmail}
            </span>
          </div>
        </nav>

        {/* Chat area */}
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6">
          <div className="flex-1 space-y-4 overflow-y-auto pb-2">
            {messages.map((m) => {
              const msg = m as Message;

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{ background: "var(--nostos-accent)", color: "#fff" }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Assistant message — ai v4 uses message.content (string) + message.toolInvocations[]
              const invocations = msg.toolInvocations ?? [];
              const searchResult = invocations.find(
                (inv) => inv.toolName === "searchListings" && inv.state === "result"
              );
              const listings: AgentListing[] = searchResult
                ? ((searchResult as { result?: { listings?: AgentListing[] } }).result?.listings ?? [])
                : [];

              return (
                <div key={msg.id} className="space-y-3">
                  {msg.content && (
                    <div className="flex justify-start">
                      <div
                        className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={{ background: "var(--nostos-surface)", color: "var(--nostos-ink)", border: "1px solid var(--nostos-border)" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {listings.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {listings.map((l) => (
                        <ListingCard
                          key={l.id}
                          listing={l}
                          selected={selectedId === l.id}
                          disabled={inputDisabled}
                          onSelect={() => {
                            setSelectedId(l.id);
                            setActiveListing(l);
                            setPendingListing(l);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--nostos-surface)", color: "var(--nostos-ink-secondary)", border: "1px solid var(--nostos-border)" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--nostos-accent)" }} />
                  Searching...
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
                  Waiting for approval in your vault...
                </div>
              </div>
            )}

            {phase === "submitted" && receipt && (
              <div className="rounded-2xl border p-4" style={{ background: "var(--nostos-accent-soft)", borderColor: "var(--nostos-accent)" }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: "var(--nostos-accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>Application submitted</p>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                  Application ID: <span className="font-mono">{receipt}</span>
                </p>
                <Link href="/nostos/landlord" className="mt-3 inline-block text-xs font-semibold underline" style={{ color: "var(--nostos-accent)" }}>
                  View in landlord dashboard
                </Link>
              </div>
            )}

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <div ref={bottomRef} />
          </div>

          {/* Fallback listing cards — shown if toolInvocations didn't render inline */}
          {latestListings.length > 0 && phase === "chat" && !messages.some((m) => (m as Message).toolInvocations?.length) && (
            <div className="my-4 grid gap-3 sm:grid-cols-3">
              {latestListings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  selected={selectedId === l.id}
                  disabled={inputDisabled}
                  onSelect={() => {
                    setSelectedId(l.id);
                    setActiveListing(l);
                    setPendingListing(l);
                  }}
                />
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="mt-2 flex gap-2 rounded-2xl border p-2"
            style={{ background: "var(--nostos-surface)", borderColor: "var(--nostos-border)" }}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="2 bedroom in Brooklyn under $3,000..."
              disabled={inputDisabled}
              className="flex-1 bg-transparent px-2 text-sm outline-none disabled:opacity-40"
              style={{ color: "var(--nostos-ink)" }}
            />
            <button
              type="submit"
              disabled={inputDisabled || !input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40"
              style={{ background: "var(--nostos-accent)" }}
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>

      {/* Approval bottom sheet */}
      {pendingListing && (
        <ApprovalSheet
          listing={pendingListing}
          onApprove={handleApprove}
          onCancel={() => { setPendingListing(null); setSelectedId(null); setActiveListing(null); }}
          loading={approvalLoading}
        />
      )}
    </>
  );
}
