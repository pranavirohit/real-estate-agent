"use client";

import Link from "next/link";

export default function NostosLanding() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">

      {/* ── Left panel: all content (50% on lg) ── */}
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">

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
        <main className="flex flex-1 flex-col justify-center px-6 pb-20 pt-12 sm:px-10 lg:pb-16 lg:pt-8">
          <p
            className="mb-5 text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--nostos-accent)" }}
          >
            New York City rentals
          </p>

          <h1
            className="max-w-none text-5xl leading-[1.08] tracking-tight sm:text-6xl"
            style={{
              fontFamily: "var(--font-nostos-serif), Georgia, serif",
              color: "var(--nostos-ink)",
            }}
          >
            The rental search that listens, then lines up tours around when you&rsquo;re free.
          </h1>

          <p
            className="mt-7 max-w-none text-base leading-relaxed"
            style={{ color: "var(--nostos-ink-secondary)" }}
          >
            Tell us what you&rsquo;re looking for in plain language. Nostos finds listings that fit,
            coordinates tours when you&rsquo;re free, and verifies you once so you&rsquo;re not stuck redoing
            the same steps for every landlord.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/nostos/find"
              className="inline-flex h-14 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white shadow-sm transition-colors"
              style={{ background: "var(--nostos-accent)" }}
              onMouseOver={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--nostos-accent-hover)")
              }
              onMouseOut={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "var(--nostos-accent)")
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

          <p className="mt-7 max-w-none text-xs leading-relaxed" style={{ color: "var(--nostos-muted)" }}>
            EigenCloud-backed hardware keeps verification off scattered email threads. One enrollment,
            many applications, with visibility into what landlords received.
          </p>

          {/* How it works strip */}
          <div
            className="mt-16 grid gap-6 sm:grid-cols-3"
            style={{
              borderTop: "1px solid var(--nostos-border)",
              paddingTop: "2.5rem",
            }}
          >
            {[
              {
                step: "01",
                title: "Describe what you want",
                body: "Browse NYC rentals or tell the assistant your budget, neighborhoods, and move date. Shortlist units that actually fit.",
              },
              {
                step: "02",
                title: "Tours, coordinated for you",
                body: "The agent proposes times, aligns with landlords, and cuts down email back-and-forth so you get on the calendar faster.",
              },
              {
                step: "03",
                title: "Apply once, verified once",
                body: "When you apply, Nostos runs identity in secure hardware (EigenCloud) so you are not repeating uploads. Landlords get only what they need, and you keep visibility into what was shared.",
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
                <p className="text-sm leading-relaxed" style={{ color: "var(--nostos-ink-secondary)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ── Right panel: NYC map (50% on lg) ── */}
      <div className="relative h-64 w-full shrink-0 overflow-hidden lg:h-auto lg:flex-1 lg:sticky lg:top-0 lg:max-h-dvh">
        {/* Warm color overlay to match Nostos palette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(247,245,242,0.18) 0%, rgba(194,65,12,0.06) 100%)",
            mixBlendMode: "multiply",
          }}
          aria-hidden
        />
        {/* Left fade so the map bleeds into the content panel gently */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 hidden lg:block"
          style={{
            background: "linear-gradient(to right, var(--nostos-canvas), transparent)",
          }}
          aria-hidden
        />
        <iframe
          title="New York City map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-74.0900%2C40.6200%2C-73.8800%2C40.8100&layer=mapnik"
          className="h-full w-full border-0"
          loading="lazy"
          style={{
            filter: "sepia(0.3) saturate(0.75) brightness(1.08) contrast(0.93)",
          }}
        />
      </div>

    </div>
  );
}
