"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowLeft, Calendar, CheckCircle, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { useChat } from "ai/react";
import type { Message } from "ai/react";
import type { AgentListing } from "@/lib/agentListings";
import type { ScheduledTour } from "@/app/api/schedule-tours/route";

type Phase = "chat" | "submitted" | "error";

/** Converts **bold** tokens, bullet lines, and newlines to JSX. */
function renderMarkdown(text: string) {
  const segments = text.split(/\*\*(.+?)\*\*/g);
  const nodes: React.ReactNode[] = [];

  segments.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(<strong key={i}>{part}</strong>);
      return;
    }
    const lines = part.split("\n");
    lines.forEach((line, j) => {
      const isBullet = line.trimStart().startsWith("•");
      if (isBullet) {
        const content = line.trimStart().slice(1).trim();
        nodes.push(
          <span
            key={`${i}-${j}`}
            className="mt-1.5 flex items-center gap-2"
          >
            <span
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
            >
              ›
            </span>
            <span className="italic" style={{ color: "var(--nostos-ink-secondary)" }}>{content}</span>
          </span>
        );
      } else {
        if (j > 0) nodes.push(<br key={`${i}-${j}-br`} />);
        if (line) nodes.push(<span key={`${i}-${j}`}>{line}</span>);
      }
    });
  });

  return nodes;
}

function ThreeDots() {
  return (
    <span className="flex items-center gap-1" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--nostos-accent)",
            animation: `nostos-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes nostos-dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

function ListingCard({ listing }: { listing: AgentListing }) {
  return (
    <div
      className="w-full overflow-hidden rounded-2xl border text-left"
      style={{
        borderColor: "var(--nostos-border)",
        background: "var(--nostos-surface)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {listing.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.imageUrl}
          alt={listing.address}
          className="h-28 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="h-28 w-full"
          style={{ background: "linear-gradient(135deg, #f5f0eb 0%, #ece8e2 100%)" }}
          aria-hidden
        />
      )}
      <div className="px-3 pb-3 pt-2">
        <p className="line-clamp-2 text-xs font-semibold leading-snug" style={{ color: "var(--nostos-ink)" }}>
          {listing.address}
        </p>
        <span
          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: "var(--nostos-accent-soft)", color: "var(--nostos-accent)" }}
        >
          {listing.price}
        </span>
        <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
          {[listing.beds && `${listing.beds} bd`, listing.baths && `${listing.baths} ba`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </div>
  );
}

function ApprovalSheet({
  tours,
  onApprove,
  onCancel,
  loading,
}: {
  tours: ScheduledTour[];
  onApprove: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 shadow-2xl sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-3xl"
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
          style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
        >
          Confirm your identity to apply
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
          Your tours are booked. To complete your rental application
          {tours.length === 1
            ? ` for ${tours[0].address.split(",")[0]}`
            : ` for ${tours.length} properties`}
          , share your verified identity with the landlord.
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
          {["Your full name", "That you are over 18", "Your current address"].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <div
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: "var(--nostos-accent)" }}
              />
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
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Approve &amp; Apply
          </button>
        </div>
      </div>
    </>
  );
}

function ToursConfirmedCard({ tours }: { tours: ScheduledTour[] }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{
        background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
        border: "1px solid rgba(194,65,12,0.2)",
      }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #C2410C, #ea580c)" }}
        >
          <CheckCircle className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
            {tours.length} tour{tours.length !== 1 ? "s" : ""} confirmed
          </p>
          <p className="text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
            Calendar invites sent to your inbox
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {tours.map((tour, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(194,65,12,0.12)" }}
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #C2410C, #ea580c)" }}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: "var(--nostos-ink)" }}>
                {tour.address}
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" style={{ color: "var(--nostos-accent)" }} />
                <p className="text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                  {tour.dateLabel} · {tour.timeLabel}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NostosFind() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email ?? null;
  const userName = session?.user?.name ?? null;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Identity verification flow
  const [phase, setPhase] = useState<Phase>("chat");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [pendingVerifyTours, setPendingVerifyTours] = useState<ScheduledTour[] | null>(null);
  const [applicationIds, setApplicationIds] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const toursSeenRef = useRef(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/nostos/chat",
    body: { userEmail, userName },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Where do you commute to most days — or are you working from home?",
      },
    ],
    onError: (err) => console.error("[nostos/chat]", err),
  });

  // When scheduleTours result appears for the first time, prompt for ID verification
  useEffect(() => {
    if (toursSeenRef.current || phase !== "chat") return;
    for (const m of messages) {
      const msg = m as Message;
      if (msg.role !== "assistant") continue;
      const toursResult = (msg.toolInvocations ?? []).find(
        (inv) => inv.toolName === "scheduleTours" && inv.state === "result"
      );
      if (toursResult) {
        const tours: ScheduledTour[] =
          (toursResult as { result?: { scheduledTours?: ScheduledTour[] } }).result?.scheduledTours ?? [];
        if (tours.length > 0) {
          toursSeenRef.current = true;
          setPendingVerifyTours(tours);
        }
        break;
      }
    }
  }, [messages, phase]);

  // "Approve & Apply" — the button click IS the consent.
  // Directly registers pre-approved applications in the TEE; no vault round-trip needed.
  const handleApprove = async () => {
    if (!userEmail || !pendingVerifyTours) return;
    setApprovalLoading(true);
    try {
      const listings = pendingVerifyTours.map((t, i) => ({
        listingId: `nostos_${Date.now()}_${i}`,
        listingAddress: t.address,
        tourDate: t.viewingDate,
      }));
      const { data } = await axios.post<{ applications: Array<{ applicationId: string }> }>(
        "/api/nostos/book",
        { tenantEmail: userEmail, tenantName: userName ?? undefined, listings }
      );
      setApplicationIds((data.applications ?? []).map((a) => a.applicationId));
      setPendingVerifyTours(null);
      setPhase("submitted");
    } catch {
      setVerifyError("Could not submit applications. Try again.");
      setPhase("error");
    } finally {
      setApprovalLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (status === "loading") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 60% 0%, #fde8d8 0%, #F7F5F2 60%)" }}
      >
        <ThreeDots />
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div
        className="flex min-h-dvh flex-col"
        style={{ background: "radial-gradient(ellipse at 60% 0%, #fde8d8 0%, #F7F5F2 60%)" }}
      >
        <nav className="flex items-center gap-4 px-6 py-5 sm:px-10">
          <Link href="/nostos" className="flex items-center gap-2 text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
            <ArrowLeft className="h-4 w-4" /> Back
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
            Nostos uses your verified identity when you tour apartments, so you never have to send documents to a landlord.
          </p>
          <Link
            href="/login?callbackUrl=/nostos/find"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #C2410C, #ea580c)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: "radial-gradient(ellipse at 65% 0%, #fde8d8 0%, #F7F5F2 55%)" }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between border-b px-6 py-4 sm:px-10"
        style={{
          borderColor: "rgba(231,229,228,0.8)",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/nostos"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
            style={{ color: "var(--nostos-ink-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span
            className="text-lg tracking-tight"
            style={{ fontFamily: "var(--font-nostos-serif), Georgia, serif", color: "var(--nostos-ink)" }}
          >
            Nostos
          </span>
        </div>
        <span className="text-sm" style={{ color: "var(--nostos-ink-secondary)" }}>
          {userName?.split(" ")[0] ?? userEmail}
        </span>
      </nav>

      {/* Chat area */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6">
        <div className="flex-1 space-y-5 overflow-y-auto pb-2">
          {messages.map((m) => {
            const msg = m as Message;

            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div
                    className="max-w-[82%] rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed shadow-sm"
                    style={{ background: "linear-gradient(135deg, #C2410C, #ea580c)", color: "#fff" }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Assistant — pull out tool results for display
            const invocations = msg.toolInvocations ?? [];

            const searchResult = invocations.find(
              (inv) => inv.toolName === "searchListings" && inv.state === "result"
            );
            const listings: AgentListing[] = searchResult
              ? ((searchResult as { result?: { listings?: AgentListing[] } }).result?.listings ?? [])
              : [];

            const toursResult = invocations.find(
              (inv) => inv.toolName === "scheduleTours" && inv.state === "result"
            );
            const scheduledTours: ScheduledTour[] = toursResult
              ? ((toursResult as { result?: { scheduledTours?: ScheduledTour[] } }).result?.scheduledTours ?? [])
              : [];

            return (
              <div key={msg.id} className="space-y-3">
                {msg.content && (
                  <div className="flex justify-start">
                    <div
                      className="relative max-w-[82%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed shadow-sm"
                      style={{
                        background: "#fff",
                        color: "var(--nostos-ink)",
                        borderLeft: "3px solid var(--nostos-accent)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      }}
                    >
                      <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                    </div>
                  </div>
                )}

                {/* Listing cards grid (after search) */}
                {listings.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {listings.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                )}

                {/* Tours confirmed card — only visible after the user has approved their identity */}
                {scheduledTours.length > 0 && phase !== "chat" && (
                  <ToursConfirmedCard tours={scheduledTours} />
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-3 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm"
                style={{
                  background: "#fff",
                  color: "var(--nostos-ink-secondary)",
                  borderLeft: "3px solid var(--nostos-accent)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                }}
              >
                <ThreeDots />
                <span>Thinking…</span>
              </div>
            </div>
          )}

          {phase === "submitted" && applicationIds.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{ background: "var(--nostos-accent-soft)", borderColor: "var(--nostos-accent)" }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: "var(--nostos-accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--nostos-ink)" }}>
                  Application{applicationIds.length !== 1 ? "s" : ""} submitted with verified identity
                </p>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--nostos-ink-secondary)" }}>
                {applicationIds.length} rental application{applicationIds.length !== 1 ? "s" : ""} sent to the landlord with your verified proof.
              </p>
              <Link
                href="/nostos/landlord"
                className="mt-3 inline-block text-xs font-semibold underline"
                style={{ color: "var(--nostos-accent)" }}
              >
                View in landlord dashboard →
              </Link>
            </div>
          )}

          {phase === "error" && verifyError && (
            <p className="text-center text-sm text-red-600">{verifyError}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex gap-2 rounded-2xl border p-2 shadow-md transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-orange-200"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            borderColor: "var(--nostos-border)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
            }}
            placeholder="Type your answer…"
            disabled={isLoading}
            className="min-h-[44px] flex-1 bg-transparent px-2 text-sm outline-none disabled:opacity-40"
            style={{ color: "var(--nostos-ink)" }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #C2410C, #ea580c)" }}
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>

      {/* Identity verification bottom sheet — appears after tours are confirmed */}
      {pendingVerifyTours && phase === "chat" && (
        <ApprovalSheet
          tours={pendingVerifyTours}
          onApprove={handleApprove}
          onCancel={() => { setPendingVerifyTours(null); toursSeenRef.current = false; }}
          loading={approvalLoading}
        />
      )}
    </div>
  );
}
