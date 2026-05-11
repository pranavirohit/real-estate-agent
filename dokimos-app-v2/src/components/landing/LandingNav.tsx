"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const frostedPill =
  "flex h-[clamp(56px,7vh,76px)] shrink-0 items-center rounded-[40px] border border-white/50 bg-[hsla(0,0%,100%,0.82)] shadow-[0_8px_40px_rgba(71,85,105,0.1),0_4px_16px_rgba(13,148,136,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md";

/** Center links: on the page background (no frosted bar) on large screens */
const navLinkClass =
  "whitespace-nowrap rounded-full px-[clamp(0.65rem,0.9vw,1rem)] py-[clamp(0.45rem,0.7vh,0.65rem)] text-[clamp(0.88rem,0.6vw+0.58rem,1.14rem)] font-medium text-slate-100 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:bg-transparent lg:text-white/95 lg:drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] lg:hover:bg-white/5 lg:hover:text-teal-200";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-[100] pt-[clamp(1.35rem,3.2vh,2.35rem)]">
      <div className="pointer-events-auto mx-auto w-full max-w-[clamp(980px,88vw,1680px)] px-[clamp(1rem,3vw,3rem)]">
        <div className="relative flex w-full items-center gap-[clamp(0.65rem,1.5vw,1rem)]">
          <div className={`${frostedPill} px-[clamp(0.9rem,1.2vw,1.5rem)]`}>
            <Link
              href="/"
              className="flex min-w-0 items-center gap-[clamp(0.45rem,0.8vw,0.75rem)] py-2 text-[clamp(0.9rem,0.65vw+0.55rem,1.35rem)] font-bold tracking-tight text-slate-900"
            >
              <span className="flex h-[clamp(30px,3.2vh,38px)] w-[clamp(30px,3.2vh,38px)] items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-slate-900 text-[clamp(0.65rem,0.9vw,0.85rem)] font-bold text-white shadow-[0_6px_20px_rgba(13,148,136,0.32)]">
                D
              </span>
              Dokimos
            </Link>
          </div>

          <nav
            className={`font-landing absolute left-0 right-0 top-[calc(100%+10px)] z-50 flex flex-col gap-1 rounded-2xl border border-white/15 bg-slate-950/92 p-3 shadow-[0_16px_48px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:static lg:z-auto lg:flex lg:flex-1 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-center lg:gap-0.5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
              open ? "flex" : "hidden lg:flex"
            }`}
            aria-label="Primary"
          >
            <a href="#product" className={navLinkClass} onClick={() => setOpen(false)}>
              Product
            </a>
            <a href="#how-it-works" className={navLinkClass} onClick={() => setOpen(false)}>
              How it works
            </a>
            <Link href="/integration" className={navLinkClass} onClick={() => setOpen(false)}>
              Developers
            </Link>
            <Link href="/business" className={navLinkClass} onClick={() => setOpen(false)}>
              For business
            </Link>
          </nav>

          <div className="ml-auto flex h-[clamp(56px,7vh,76px)] shrink-0 items-center gap-[clamp(0.4rem,0.8vw,0.9rem)] lg:ml-0">
            <Link
              href="/#footer"
              className="hidden sm:inline-flex h-[clamp(38px,4.4vh,48px)] items-center rounded-full px-[clamp(0.75rem,1.2vw,1.1rem)] text-[clamp(0.78rem,0.52vw+0.55rem,1.02rem)] font-semibold text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-colors hover:text-teal-200"
            >
              Contact
            </Link>
            <Link
              href="/login?callbackUrl=/onboarding"
              className="inline-flex h-[clamp(38px,4.4vh,48px)] items-center gap-1.5 rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 px-[clamp(1rem,1.5vw,1.5rem)] text-[clamp(0.78rem,0.52vw+0.55rem,1.02rem)] font-semibold text-white shadow-[0_8px_28px_rgba(13,148,136,0.32),inset_0_1px_0_rgba(255,255,255,0.22)] transition-[transform,box-shadow,filter] hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(13,148,136,0.4)]"
            >
              Log in
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-white/90 shadow-sm transition-shadow hover:bg-white/10 hover:shadow-md lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
