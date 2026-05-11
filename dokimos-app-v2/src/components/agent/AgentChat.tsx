"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  fallbackMockListings,
  type AgentListing,
} from "@/lib/agentListings";
import { parseRentalSearchQuery } from "@/lib/parseRentalSearchQuery";
import {
  dokimosCardClass,
  dokimosPrimaryButtonClass,
  dokimosSectionLabelClass,
} from "@/lib/dokimosLayout";

type ChatMsg = { role: "user" | "assistant"; text: string };

const AGENT_ID = "dokimos-rental-demo";
const WORKFLOW_ID = "rental_application";

const MAX_QUICK_PICKS = 9;

function formatListingLine(l: AgentListing, index: number): string {
  const meta = [
    `${l.beds} bd`,
    l.baths ? `${l.baths} ba` : null,
    l.sqft ? `${l.sqft.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `${index + 1}. ${l.address}\n   ${l.price}${meta ? ` | ${meta}` : ""}`;
}

export function AgentChat() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email ?? null;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Hi. Tell me what you are looking for in Brooklyn. I will suggest homes that match from live rental listings.",
    },
  ]);
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "chat" | "verifying" | "submitted" | "error"
  >("chat");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const pushAssistant = (text: string) => {
    setMessages((m) => [...m, { role: "assistant", text }]);
  };

  const pushUser = (text: string) => {
    setMessages((m) => [...m, { role: "user", text }]);
  };

  const fetchListingsForMessage = async (userMessage: string) => {
    const parsed = parseRentalSearchQuery(userMessage);
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        location: parsed.location,
        maxPrice: String(parsed.maxPrice),
        beds: String(parsed.beds),
      });
      const res = await fetch(`/api/listings?${params}`);
      const rawBody = await res.text();
      console.log("[agent] /api/listings full response:", {
        status: res.status,
        ok: res.ok,
        body: rawBody,
      });
      let data: { listings?: AgentListing[]; error?: string } = {};
      try {
        data = rawBody ? (JSON.parse(rawBody) as typeof data) : {};
      } catch {
        /* invalid JSON — same as failed json() */
      }
      let next: AgentListing[] = Array.isArray(data.listings)
        ? data.listings
        : [];

      if (!res.ok || next.length === 0) {
        console.warn(
          "[agent] Listings API fallback:",
          data.error || `HTTP ${res.status}` || "empty results"
        );
        next = fallbackMockListings();
      }

      const capped = next.slice(0, MAX_QUICK_PICKS);
      setListings(capped);

      const lines = capped.map((l, i) => formatListingLine(l, i)).join("\n\n");
      pushAssistant(
        `Here ${capped.length === 1 ? "is a place" : `are ${capped.length} places`} that match:\n\n${lines}\n\nTap **Select** on one below, or mention an address or say first, second, or third.`
      );
    } catch (e: unknown) {
      console.warn("[agent] Listings fetch failed:", e);
      const fallback = fallbackMockListings();
      setListings(fallback);
      const lines = fallback
        .map((l, i) => formatListingLine(l, i))
        .join("\n\n");
      pushAssistant(
        `Could not reach live listings. Here are demo homes you can still use:\n\n${lines}\n\nTap **Select** on one below.`
      );
    } finally {
      setListingsLoading(false);
    }
  };

  const resolveListingFromText = (raw: string): AgentListing | null => {
    const q = raw.toLowerCase();
    const pool = listings.length > 0 ? listings : fallbackMockListings();

    for (const l of pool) {
      const addr = l.address.toLowerCase();
      const words = addr.split(/[\s,]+/).filter((w) => w.length > 3);
      for (const w of words) {
        if (q.includes(w) && w.length >= 4) return l;
      }
    }

    if (q.includes("wythe") || q.includes("142")) {
      const m = pool.find(
        (p) =>
          p.address.toLowerCase().includes("wythe") ||
          p.address.includes("142")
      );
      if (m) return m;
    }
    if (q.includes("nostrand") || q.includes("67 n")) {
      const m = pool.find((p) => p.address.toLowerCase().includes("nostrand"));
      if (m) return m;
    }
    if (q.includes("flatbush") || q.includes("234")) {
      const m = pool.find((p) => p.address.toLowerCase().includes("flatbush"));
      if (m) return m;
    }

    if (q.includes("first") || q.includes("1.")) return pool[0] ?? null;
    if (q.includes("second") || q.includes("2.")) return pool[1] ?? null;
    if (q.includes("third") || q.includes("3.")) return pool[2] ?? null;

    return null;
  };

  const startVerification = async (listing: AgentListing) => {
    if (!userEmail) return;
    setPhase("verifying");
    setError(null);
    const label = listing.address.split(",")[0]?.trim() ?? listing.address;
    pushAssistant(
      `Before I submit ${label}, I need to confirm your identity with Dokimos. I am sending a verification request now. Open your Dokimos vault and approve the request from Brooklyn Properties LLC when it appears (the app checks every few seconds).`
    );

    try {
      const { data } = await axios.post<{ requestId: string }>(
        "/api/agent-verify",
        {
          userId: userEmail,
          workflowId: WORKFLOW_ID,
          agentId: AGENT_ID,
        }
      );
      setRequestId(data.requestId);
    } catch (e: unknown) {
      setPhase("error");
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : "Could not start verification.";
      setError(msg);
      pushAssistant(`Something went wrong: ${msg}`);
    }
  };

  useEffect(() => {
    if (phase !== "verifying" || !requestId || !userEmail || !selectedId) return;

    const listing = listings.find((l) => l.id === selectedId);
    if (!listing) return;

    const tick = async () => {
      try {
        const { data } = await axios.get<{
          status: string;
          attestation: unknown | null;
        }>(`/api/agent-verify/${encodeURIComponent(requestId)}`);

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
            const short =
              listing.address.split(",")[0]?.trim() ?? listing.address;
            pushAssistant(
              `Your application was submitted to ${short}. Verification receipt is attached in the system. You can share listing ID ${listing.id} with the landlord portal.`
            );
          } catch (e: unknown) {
            setPhase("error");
            const msg =
              axios.isAxiosError(e) && e.response?.data?.error
                ? String(e.response.data.error)
                : "Submit failed.";
            setError(msg);
            pushAssistant(`Verification succeeded but submission failed: ${msg}`);
          }
        } else if (data.status === "denied") {
          stopPoll();
          setPhase("error");
          pushAssistant(
            "The verification request was not approved. You can try again from your vault if you change your mind."
          );
        }
      } catch {
        /* keep polling */
      }
    };

    void tick();
    pollRef.current = setInterval(() => void tick(), 2500);
    return () => stopPoll();
  }, [phase, requestId, userEmail, selectedId, listings, stopPoll]);

  const onSend = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    pushUser(t);

    const lower = t.toLowerCase();
    const searchIntent =
      lower.includes("search") ||
      lower.includes("looking") ||
      lower.includes("bedroom") ||
      lower.includes("brooklyn") ||
      lower.includes("find");

    if (searchIntent) {
      void fetchListingsForMessage(t);
      return;
    }

    const listing = resolveListingFromText(t);
    if (
      listing &&
      (lower.includes("apply") ||
        lower.includes("select") ||
        lower.includes("this"))
    ) {
      setSelectedId(listing.id);
      void startVerification(listing);
      return;
    }

    if (selectedId && (lower.includes("apply") || lower.includes("submit"))) {
      const l = listings.find((x) => x.id === selectedId);
      if (l) void startVerification(l);
      return;
    }

    pushAssistant(
      "Try asking for a 2 bedroom in Brooklyn under $3,000, then pick a listing or say you want to apply to an address."
    );
  };

  const inputDisabled =
    phase === "verifying" || listingsLoading;

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className={`${dokimosSectionLabelClass} mb-2`}>Rental agent</p>
        <h1
          className="font-serif text-2xl text-slate-900"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          Sign in to continue
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          The agent needs your Dokimos account email so it can request identity
          verification on your behalf.
        </p>
        <Link
          href="/login?callbackUrl=/agent"
          className={`${dokimosPrimaryButtonClass} mt-8 inline-flex w-full sm:w-auto`}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-8 pt-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-dokimos-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home
        </Link>
      </div>

      <p className={`${dokimosSectionLabelClass} mb-1`}>Demo</p>
      <h1
        className="font-serif text-3xl text-slate-900"
        style={{ fontFamily: "var(--font-instrument-serif), serif" }}
      >
        Rental agent
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Search uses live rental listings when available; verification still runs
        through Dokimos.
      </p>

      <div
        className={`${dokimosCardClass} relative mt-8 flex min-h-[320px] flex-1 flex-col`}
      >
        {listingsLoading ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[2px]"
            aria-busy="true"
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-dokimos-accent" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Searching listings…
            </p>
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-dokimos-accent text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="mb-3 text-xs font-medium text-slate-500">
            {listings.length > 0
              ? "Quick picks (tap to apply)"
              : "Run a search above to load picks, or search for Brooklyn rentals."}
          </p>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {listings.map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={inputDisabled}
                onClick={() => {
                  setSelectedId(l.id);
                  pushUser(`Apply to ${l.address.split(",")[0]?.trim() ?? l.address}`);
                  void startVerification(l);
                }}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs transition-colors hover:border-dokimos-accent/50 disabled:opacity-50"
              >
                <span className="line-clamp-2 font-semibold text-slate-900">
                  {l.address}
                </span>
                <span className="mt-1 block text-slate-600">{l.price}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
              placeholder="e.g. 2 bedroom Brooklyn under $3000"
              className="min-h-[48px] flex-1 rounded-xl border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-dokimos-accent focus:outline-none focus:ring-2 focus:ring-dokimos-accent/20"
              disabled={inputDisabled}
            />
            <button
              type="button"
              onClick={() => onSend()}
              disabled={inputDisabled}
              className={`${dokimosPrimaryButtonClass} !h-12 !min-h-[48px] shrink-0 px-5`}
            >
              {listingsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      {phase === "verifying" ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Waiting for approval in Dokimos… keep this tab open.
        </p>
      ) : null}

      {phase === "submitted" && receipt ? (
        <p className="mt-4 text-center text-sm text-teal-800">
          Application ID:{" "}
          <span className="font-mono font-semibold">{receipt}</span>. Landlords
          can review it on{" "}
          <Link href="/landlord" className="font-medium text-dokimos-accent underline">
            the landlord view
          </Link>
          .
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
