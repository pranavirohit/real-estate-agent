import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingNav } from "./LandingNav";
import { DokimosBrandBackdrop } from "@/components/dokimos/DokimosBrandBackdrop";

/**
 * Marketing surface: restrained “Plaid-style” canvas — 2 neutrals + 1 accent hue,
 * only two radial blobs + one base gradient + whisper grid (premium, not noisy).
 */
export function DokimosLanding() {
  return (
    <div
      id="main-content"
      className="font-landing relative isolate min-h-[100dvh] overflow-x-hidden text-slate-100"
    >
      <DokimosBrandBackdrop className="-z-20" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(255,255,255,0.08),transparent_55%)]"
        aria-hidden
      />

      <LandingNav />

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-6.5rem)] w-full max-w-[clamp(980px,88vw,1680px)] items-center px-[clamp(1rem,3vw,3rem)] pb-[clamp(2rem,5vh,6rem)] pt-[clamp(5.35rem,10.5vh,9.35rem)] md:min-h-[calc(100dvh-7rem)]">
        {/* Hero — keep only top nav + hero shown in screenshot */}
        <section className="grid w-full gap-[clamp(2rem,4vw,5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <h1 className="text-[clamp(2.4rem,5vw,5.1rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white drop-shadow-[0_8px_24px_rgba(2,6,23,0.45)]">
              The last time you&apos;ll ever have to upload your ID
            </h1>
            <p className="mt-[clamp(2.25rem,4.25vh,3.75rem)] max-w-[42rem] text-[clamp(1.05rem,1.35vw,1.65rem)] leading-[1.5] text-slate-200/90">
              Verify once in a protected environment. Approve what you share, per request. Prove
              outcomes with cryptography—not just a checkbox.
            </p>
            <div className="mt-[clamp(1.85rem,3.5vh,3.5rem)] flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login?callbackUrl=/onboarding"
                className="inline-flex h-[clamp(48px,5.2vh,64px)] min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 px-[clamp(1.25rem,2.4vw,2.6rem)] text-[clamp(1rem,1.15vw,1.25rem)] font-semibold text-white shadow-[0_8px_32px_rgba(13,148,136,0.35),0_4px_12px_rgba(15,118,110,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(13,148,136,0.42),0_6px_16px_rgba(15,118,110,0.3)] active:translate-y-0"
              >
                For Individuals
                <ArrowRight className="h-[clamp(16px,1.2vw,22px)] w-[clamp(16px,1.2vw,22px)]" strokeWidth={2.5} />
              </Link>
              <Link
                href="/business"
                className="inline-flex h-[clamp(48px,5.2vh,64px)] min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-slate-700 via-dokimos-navy to-slate-950 px-[clamp(1.25rem,2.4vw,2.6rem)] text-[clamp(1rem,1.15vw,1.25rem)] font-semibold text-white shadow-[0_8px_32px_rgba(15,27,76,0.48),0_4px_12px_rgba(2,6,23,0.32),0_0_22px_rgba(15,27,76,0.4),0_0_48px_rgba(15,27,76,0.22),inset_0_1px_0_rgba(255,255,255,0.16)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,27,76,0.55),0_6px_16px_rgba(2,6,23,0.36),0_0_30px_rgba(15,27,76,0.48),0_0_60px_rgba(15,27,76,0.26)] active:translate-y-0"
              >
                For Businesses
                <ArrowRight className="h-[clamp(16px,1.2vw,22px)] w-[clamp(16px,1.2vw,22px)]" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          <HeroVisual />
        </section>
      </main>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[clamp(520px,44vw,840px)] lg:mx-0 lg:max-w-none">
      <div className="rounded-3xl border border-white/60 bg-white/70 p-2 shadow-[0_20px_60px_rgba(71,85,105,0.12),0_8px_24px_rgba(13,148,136,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-teal-100/80 px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shadow-sm" />
          </div>
          <div className="ml-2 flex-1 rounded-full bg-slate-100/90 px-3 py-1.5 text-center text-[11px] text-slate-600 shadow-inner">
            app.dokimos.com
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-2xl border border-teal-100/80 bg-gradient-to-br from-white to-teal-50/40 p-4 shadow-[0_8px_24px_rgba(71,85,105,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800/85">
              Identity vault
            </p>
            <p className="mt-3 text-[22px] font-bold text-slate-900">Verified</p>
            <p className="mt-4 text-[12px] font-medium text-slate-600">Janice Sample</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              123 Main St, San Francisco, CA
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/80 p-4 shadow-[0_8px_24px_rgba(251,191,36,0.12)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/80">
              Pending request
            </p>
            <p className="mt-2 text-[14px] font-semibold text-slate-900">Acme Corp</p>
            <p className="mt-1 text-[12px] text-slate-600">3 fields requested</p>
            <div className="mt-4 h-9 rounded-xl bg-gradient-to-r from-slate-800 to-teal-900 text-center text-[12px] font-semibold leading-9 text-white shadow-[0_6px_20px_rgba(15,23,42,0.35)]">
              Review
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/25 to-teal-600/15 blur-3xl lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 hidden h-28 w-28 rounded-full bg-gradient-to-tr from-slate-400/20 to-transparent blur-2xl lg:block"
        aria-hidden
      />
    </div>
  );
}

