"use client";

import Link from "next/link";

export default function NostosLanding() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span
          className="text-xl tracking-tight"
          style={{
            fontFamily: "var(--font-nostos-serif), Georgia, serif",
            color: "var(--nostos-ink)",
          }}
        >
          Nostos
        </span>
        <Link
          href="/nostos/landlord"
          style={{ color: "var(--nostos-ink-secondary)", fontSize: "0.875rem", fontWeight: 500 }}
          className="transition-opacity hover:opacity-70"
        >
          For landlords
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-16 text-center sm:px-10">
        <p
          className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--nostos-accent)" }}
        >
          New York City rentals
        </p>

        <h1
          className="mx-auto max-w-2xl text-5xl leading-[1.08] tracking-tight sm:text-6xl md:text-7xl"
          style={{
            fontFamily: "var(--font-nostos-serif), Georgia, serif",
            color: "var(--nostos-ink)",
          }}
        >
          The last time you&rsquo;ll send your passport to a stranger.
        </h1>

        <p
          className="mx-auto mt-7 max-w-md text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--nostos-ink-secondary)" }}
        >
          Verify your identity once. Apply to any apartment in seconds.
          Landlords get proof. You keep your documents.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/nostos/find"
            className="inline-flex h-14 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white shadow-sm transition-colors"
            style={{
              background: "var(--nostos-accent)",
            }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "var(--nostos-accent-hover)")
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "var(--nostos-accent)")
            }
          >
            Find your apartment
          </Link>
          <Link
            href="/nostos/landlord"
            className="inline-flex h-14 items-center justify-center rounded-xl border px-8 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--nostos-border-strong)",
              color: "var(--nostos-ink)",
              background: "var(--nostos-surface)",
            }}
          >
            I&rsquo;m a landlord
          </Link>
        </div>

        {/* Trust line */}
        <p
          className="mt-8 text-xs"
          style={{ color: "var(--nostos-muted)" }}
        >
          Identity secured by verifiable hardware &mdash; no documents stored,
          no middlemen trusted.
        </p>

        {/* How it works strip */}
        <div
          className="mx-auto mt-20 grid max-w-2xl gap-6 text-left sm:grid-cols-3"
          style={{ borderTop: "1px solid var(--nostos-border)", paddingTop: "3rem" }}
        >
          {[
            {
              step: "01",
              title: "Verify once",
              body: "Complete a one-time ID check. Your documents are processed in secure hardware and never stored.",
            },
            {
              step: "02",
              title: "Search and apply",
              body: "Tell us what you're looking for. When you apply, we confirm your identity in the background.",
            },
            {
              step: "03",
              title: "Landlords verify independently",
              body: "Every application includes a cryptographic proof landlords can check themselves, without calling us.",
            },
          ].map((item) => (
            <div key={item.step}>
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: "var(--nostos-accent)" }}
              >
                {item.step}
              </p>
              <h3
                className="mb-2 text-base font-semibold"
                style={{ color: "var(--nostos-ink)" }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--nostos-ink-secondary)" }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
