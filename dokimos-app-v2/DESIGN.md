# Dokimos Design System
> **Attach this file to every AI prompt that touches UI.** It is the single source of truth for colors, type, spacing, component patterns, copy rules, and motion. If something is not in here, default to the teal accent system and Plus Jakarta Sans — never introduce a competing visual language.

---

## 1. Brand Identity & Design Philosophy

**Product:** Dokimos — "verify once, trusted everywhere" identity attestation vault.  
**Tagline:** *Verify once. Share everywhere.*  
**Core emotion:** Trust through calm clarity. Not a security product that intimidates — a utility that quietly empowers.

### Design Pillars
- **Warmth over sterility.** Stone/warm-white canvas instead of stark white. Teal instead of cold blue.
- **Confidence without friction.** Large tap targets, generous whitespace, clear hierarchy — users never hunt for the next step.
- **Typographic personality.** Instrument Serif (regular 400) reserves italic elegance for emotional moments (headlines, hero copy). The app shell runs in Plus Jakarta Sans — competent and neutral.
- **Two surfaces, one system.** Consumer flow (teal, stone, serif headlines) and verifier/business flow (navy/slate, no serif) share tokens but have distinct emotional registers.

---

## 2. Color Palette

All values live in `tailwind.config.js` (`dokimos.*`) and `:root` in `globals.css`. Never hardcode hex values inline — use Tailwind classes or CSS variables.

### Consumer Surface (primary)

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `dokimos.accent` | `bg-dokimos-accent` / `text-dokimos-accent` | `#0d9488` | Primary buttons, active tabs, links, teal detail |
| `dokimos.accentHover` | `hover:bg-dokimos-accentHover` | `#0f766e` | Button hover state |
| `dokimos.accentPressed` | `active:bg-dokimos-accentPressed` | `#115e59` | Button pressed state |
| `dokimos.accentSoft` | `bg-dokimos-accentSoft` | `#f0fdfa` | Selected rows, info panels, tinted surfaces |
| `dokimos.accentTint` | `bg-dokimos-accentTint` | `#ccfbf1` | Subtle highlights, badge backgrounds |
| `dokimos.productCanvas` | `bg-dokimos-productCanvas` | `#fafaf9` | Page canvas for `/app/*` and `/onboarding` |
| `dokimos.canvas` | `bg-dokimos-canvas` | `#f9fafb` | Generic app canvas (slightly cooler) |
| `dokimos.core` | `text-dokimos-core` | `#1a1a1a` | Body text, headings |
| `dokimos.successWarm` | — | `#059669` | Consumer success states |

### Semantic CSS Variables (for inline styles / non-Tailwind)

| Variable | Value | Meaning |
|---|---|---|
| `--dokimos-bg-primary` | `#ffffff` | Card surfaces, modals |
| `--dokimos-bg-secondary` | `#f9fafb` | Page background (global default) |
| `--dokimos-bg-tertiary` | `#f3f4f6` | Recessed panels, dividers |
| `--dokimos-text-primary` | `#1a1a1a` | Headings, labels |
| `--dokimos-text-secondary` | `#666666` | Supporting body copy |
| `--dokimos-text-tertiary` | `#999999` | Timestamps, metadata, helper text |
| `--dokimos-border-subtle` | `#e5e7eb` | Card borders, dividers |
| `--dokimos-border-strong` | `#d1d5db` | Inputs, active borders |
| `--dokimos-accent` | `#0d9488` | — |
| `--dokimos-accent-soft` | `#f0fdfa` | — |

### Verifier / Business Surface (secondary)

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `dokimos.navy` | `bg-dokimos-navy` / `text-dokimos-navy` | `#0F1B4C` | Verifier accent, business page headers |
| `dokimos.successCool` | — | `#10B981` | Verifier success / verified badge |

> **Rule:** Never use `#4F46E5` (indigo). It was replaced by teal (`#0d9488`) in the consumer journey. Indigo may appear in legacy files — do not re-introduce it. `verifierAccent` (navy `#0F1B4C`) is allowed only on `/business` and verifier-facing screens.

---

## 3. Typography System

### Font Families

| Variable | Family | Weights loaded | CSS variable |
|---|---|---|---|
| `font-sans` (default) | **Plus Jakarta Sans** | 400, 500, 600, 700 | `--font-landing-sans` |
| `font-serif` | **Instrument Serif** | 400 (italic personality built-in) | `--font-instrument-serif` |
| `font-mono` | system `ui-monospace` | — | — |

**Rule:** Plus Jakarta Sans is the workhorse. It handles all UI chrome: buttons, labels, nav, body copy, page titles in `/app/*`. Instrument Serif is a *punctuation mark* — use it for emotional marketing headlines, hero text, and testimonials. Never mix serif into form labels, table cells, or dashboard content.

### Type Scale

| Role | Class / CSS | Size | Weight | Tracking |
|---|---|---|---|---|
| Marketing hero (serif) | `font-serif text-5xl` or larger | 48–72px | 400 | default |
| Marketing H2 (serif or sans) | `font-serif text-4xl` / `text-3xl font-semibold` | 36–42px | 400 / 600 | tight (`-0.02em`) |
| Page title (app shell) | `text-2xl font-semibold tracking-tight` → `sm:text-[28px]` | 24–30px | 600 | `-0.02em` |
| Verifier page title | `.dokimos-verifier-page-title` | 28px | 400 | `-0.02em` |
| Section eyebrow / label | `text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-800/80` | 11–12px | 600 | `0.08em` |
| Body copy | `text-[14px] leading-relaxed text-slate-600` | 14px | 400 | — |
| Supporting / meta | `text-[13px] text-slate-500` | 13px | 400 | — |
| Helper / timestamp | `text-[12px] text-slate-400` | 12px | 400 | — |
| Button label | `text-[14px] font-semibold` → `sm:text-[15px]` | 14–15px | 600 | — |
| Badge / pill | `text-[12px] font-bold` | 11–12px | 700 | — |

> **Anti-pattern:** Do not use `text-xl`, `text-lg`, or `text-base` for app UI. Use explicit px sizes (`text-[14px]`, `text-[13px]`) for precision across screen densities.

---

## 4. Spacing & Layout Tokens

Dokimos uses Tailwind's default 4px grid. Standard patterns:

| Context | Value |
|---|---|
| Page horizontal padding | `px-4 sm:px-5 md:px-6` |
| Page top padding (below top bar) | `pt-2 sm:pt-3` |
| Page bottom padding (safe area) | `pb-[max(1.5rem,env(safe-area-inset-bottom))]` |
| Card internal padding | `p-5 sm:p-6` |
| Section vertical gap | `space-y-8` |
| Card vertical gap (items inside) | `space-y-4` or `gap-4` |
| Card border radius | `rounded-2xl` |
| Button border radius | `rounded-xl` |
| Pill / badge border radius | `rounded-full` |

### Max Widths
- Prose / description: `max-w-prose`
- Narrow app content: `max-w-sm` (360px) — used in verification flows
- App shell content: no hard max; flows within `AppShellLayout` constraints

---

## 5. Component Patterns

Import shared classes from `@/lib/dokimosLayout` — never rewrite them inline.

### 5.1 Buttons

**Primary button** (`dokimosPrimaryButtonClass`):
```
inline-flex h-12 min-h-[44px] items-center justify-center rounded-xl
bg-dokimos-accent px-4 text-[14px] font-semibold text-white shadow-sm
transition-colors hover:bg-dokimos-accentHover active:bg-dokimos-accentPressed
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-dokimos-accent sm:h-14 sm:text-[15px]
```
- Color: teal fill, white text
- Full-width on mobile in flows: add `w-full`
- Never use `bg-indigo-*` or `bg-blue-*` on primary buttons

**Secondary button** (`dokimosSecondaryButtonClass`):
```
inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl
border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800
transition-colors hover:bg-slate-50
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-dokimos-accent
```
- White fill, slate text, teal focus ring
- Use for "Cancel", "Back", low-commitment actions

**Hub action row** (`DokimosHubActionRow`): uses same primary/secondary classes but renders full-width on mobile with `flex-1 sm:flex-initial`. Badge count uses `bg-white/20` (primary) or `bg-red-500` (secondary).

**Destructive / danger**: `bg-red-600 hover:bg-red-700 text-white rounded-xl` — same geometry as primary.

### 5.2 Cards

**Surface card** (`dokimosCardClass` / `DokimosSurfaceCard`):
```
rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] sm:p-6
```
- Always white fill on productCanvas background
- Shadow is intentionally micro (`shadow-sm` with low opacity) — not a dramatic drop shadow
- Never add `shadow-lg` or `shadow-md` — it breaks the calm register

**Tinted info panel** (for success/trust states):
```
rounded-2xl bg-dokimos-accentSoft border border-teal-100 p-4
```

**Recessed / secondary panel**:
```
rounded-xl bg-slate-50 border border-slate-100 p-4
```

### 5.3 Section Label / Eyebrow

Use `dokimosSectionLabelClass` from `@/lib/dokimosLayout`:
```
text-[12px] font-semibold uppercase tracking-[0.08em] text-teal-800/80
```
In `DokimosPageChrome` the eyebrow is slightly tighter: `text-[11px] tracking-[0.12em]`.

**Rule:** Section labels are ALWAYS uppercase, teal-tinted, semibold. They are navigational landmarks, not decorative. Do not use them in a different color — even on the verifier surface, keep a muted version of this pattern.

### 5.4 Page Chrome (`DokimosPageChrome`)

Every `/app/*` page should open with `DokimosPageChrome`:
```tsx
<DokimosPageChrome role="hub" title="Your Vault" description="...">
  <DokimosSection title="IDENTITY">...</DokimosSection>
</DokimosPageChrome>
```
- `role` drives the eyebrow label: `hub → "Home"`, `detail → "Details"`, `flow → "Verification"`, `settings → "Account"`, `legal → "Legal"`, `business → "Business"`
- Title uses Plus Jakarta Sans semibold, NOT Instrument Serif
- Description is 14px slate-600, max-prose width
- Children have `mt-8 space-y-8` spacing

### 5.5 Demo Pages: `/agent` and `/landlord`

These are demo "partner" surfaces. They share the Dokimos token system but represent a third-party product integrating Dokimos — so they are allowed slightly more opinionated chrome.

**Required patterns for these pages:**
- Canvas: `bg-dokimos-productCanvas min-h-dvh` — same as app shell
- Top bar: render a minimal bar with a back-link (`← Back` using `ArrowLeft` from `lucide-react`) and a wordmark or page title. No full `AppShellLayout` nav — these are standalone flows.
- Card containers: use `dokimosCardClass` — no custom shadow overrides
- Chat bubbles (AgentChat): user bubbles = `bg-dokimos-accent text-white`, assistant bubbles = `bg-white border border-slate-200`
- Listing cards: `dokimosCardClass` + teal accent on selected state (`ring-2 ring-dokimos-accent bg-dokimos-accentSoft`)
- Status/phase headers: use `dokimosSectionLabelClass` for phase labels (e.g. "SEARCHING", "VERIFICATION")

---

## 6. Animation & Motion

**Dependency:** Framer Motion (`framer-motion`) is installed. Use it for meaningful transitions — not decoration.

### Principles
- **Purposeful motion only.** Animate to communicate state change (loading → result, step transition, success state). Do not animate static content on first render unless it is a marketing hero.
- **Duration ladder:** micro (100–150ms), standard (200–300ms), emphasis (400–500ms). Never exceed 500ms for UI feedback.
- **Easing:** prefer `ease-out` for entrances (snap in), `ease-in` for exits (fade out cleanly). Use Framer's `spring` for attention-grabbing moments (verification success, vault unlock).
- **Reduced motion:** always gate complex animations behind `prefers-reduced-motion`. The CSS marquee in `globals.css` already does this — follow the same pattern.

### Common Patterns

**Fade + slide up (page section entrance):**
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: "easeOut" }}
```

**Success pulse (attestation verified):**
```tsx
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}
```

**Chat bubble entrance:**
```tsx
initial={{ opacity: 0, x: role === "user" ? 8 : -8 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

**CSS marquee (trust pills, marketing):** use `.dokimos-pills-track` from `globals.css` — 22s linear loop, paused on `prefers-reduced-motion`.

---

## 7. Two-Surface System

Dokimos has two distinct visual surfaces that share the token system.

### Consumer Surface (`/onboarding`, `/app/*`, `/agent`, `/login`)
| Property | Value |
|---|---|
| Canvas | `bg-dokimos-productCanvas` (`#fafaf9`) |
| Accent | Teal (`#0d9488`) |
| Top bar | Minimal — wordmark left, avatar/back right |
| Page titles | Plus Jakarta Sans 600, `tracking-tight` |
| Eyebrow | Teal-tinted uppercase label |
| Hero headlines (marketing only) | Instrument Serif 400 |
| Button fill | Teal primary |
| Emotional register | Calm, warm, personal |

### Verifier / Business Surface (`/business`, `/app/requests`, verifier flows)
| Property | Value |
|---|---|
| Canvas | `bg-dokimos-canvas` or `bg-white` |
| Accent | Navy (`#0F1B4C`) for headers; teal still used for CTAs |
| Page titles | `.dokimos-verifier-page-title` — 28px / 400 weight / tight tracking |
| Eyebrow | Muted slate variant of section label |
| Hero headlines | No Instrument Serif |
| Button fill | Teal primary (same token) — navy only for brand marks |
| Emotional register | Professional, data-forward, efficient |

> **Key rule:** The verifier surface is still Dokimos. It uses the same button tokens and card shadows. Only the page title weight and the brand accent switch. Never redesign from scratch for the verifier surface — adapt tokens.

---

## 8. Copy & Tone Rules

These rules apply to ALL in-product text (labels, empty states, error messages, button copy, chat responses). Apply them even when the copy is generated by an LLM.

1. **No blockchain / crypto jargon in the consumer UI.** The word "attestation" is allowed internally but never in user-facing headlines. Use "verified", "confirmed", "trusted" instead.
2. **No em dashes (—).** Use a comma, period, or rewrite the sentence. Em dashes read as corporate and cold.
3. **No passive voice in CTAs.** "Verify your identity" not "Identity verification can be completed."
4. **Sentence case for all UI labels.** Exception: `SECTION EYEBROWS` are uppercase (that's their typographic role).
5. **Numbers over words in data displays.** "3 active listings" not "Three active listings."
6. **Friendly error messages.** "Something went wrong. Try again." not "Error 500: Internal Server Error."
7. **Demo personas stay realistic.** Landlord = "Brooklyn Properties LLC". Agent persona = neutral assistant. Do not introduce fictional celebrity names or absurd listings.
8. **No placeholder Lorem Ipsum.** Use plausible Brooklyn real estate data for demos.
9. **Addresses and listing prices.** Use realistic Brooklyn neighborhoods (Park Slope, Williamsburg, Bushwick, Crown Heights, etc.) and realistic 2024–2026 rental prices ($2,200–$5,500/mo for 1–3BRs).

---

## 9. Page-Specific Rules

### `/` — Marketing Landing (`DokimosLanding`)
- Instrument Serif for the hero headline ("Verify once.\\nTrusted everywhere.")
- Teal CTA button full-width on mobile
- Trust pill marquee using `.dokimos-pills-track`
- Section labels: teal eyebrows

### `/onboarding` and `/app/*`
- Always wrap in `AppShellLayout` (top bar + bottom nav)
- Content wrapped in `DokimosPageChrome` with correct `role`
- Canvas: `bg-dokimos-productCanvas`
- No raw full-bleed `<div>` without the chrome — every page has an eyebrow

### `/agent` — Rental AI Agent Demo
- Standalone (no `AppShellLayout`) — has its own minimal top bar
- Back link to `/` or `/app/vault` using `ArrowLeft` + `Link`
- Chat interface: assistant bubble left-aligned, user bubble right-aligned
- Quick-pick listing grid: 2-col on mobile, 3-col on sm+
- Listing card selected state: `ring-2 ring-dokimos-accent bg-dokimos-accentSoft`
- Verification phase: full-width `DokimosSurfaceCard` with teal success icon on completion
- Phase labels (SEARCHING, VERIFYING, COMPLETE) use `dokimosSectionLabelClass`

### `/landlord` — Landlord Dashboard Demo
- Standalone (no `AppShellLayout`) — minimal top bar with "Brooklyn Properties LLC" wordmark
- Table / card list of applications uses `dokimosCardClass` rows
- Status badge: `bg-dokimos-accentSoft text-teal-800 rounded-full px-2 py-0.5 text-[12px] font-semibold`
- "View attestation" action = teal primary button
- Embed `VerificationWizard` in a modal or side panel — do not navigate away

### `/business` — Verifier Landing
- Uses `verifierAccent` (navy) for the hero section
- Teal used only for CTAs
- No Instrument Serif — professional register

---

## 10. Anti-Patterns (Never Do)

- **Never** use `#4F46E5` (indigo) anywhere in the product.
- **Never** use `shadow-lg` or `shadow-xl` on cards — breaks calm register.
- **Never** use `font-serif` for app-shell UI (nav, buttons, table cells, form labels).
- **Never** use `text-xl`, `text-lg`, `text-base` for precise UI type — use explicit px.
- **Never** add a second navigation shell to demo pages — they are standalone flows.
- **Never** hardcode hex values in JSX — always use Tailwind classes or CSS variables.
- **Never** introduce a new accent color without adding it to `tailwind.config.js` and `globals.css`.
- **Never** use em dashes in copy.
- **Never** use `bg-gray-*` for canvas — use `bg-dokimos-productCanvas` or `bg-dokimos-canvas`.

---

## 11. File Map (Where Things Live)

| What | Where |
|---|---|
| Tailwind color/font tokens | `dokimos-app-v2/tailwind.config.js` |
| CSS variables + global styles | `dokimos-app-v2/src/app/globals.css` |
| Shared layout classes (buttons, cards, eyebrow) | `dokimos-app-v2/src/lib/dokimosLayout.ts` |
| Page chrome component | `dokimos-app-v2/src/components/dokimos/DokimosPageChrome.tsx` |
| Root layout + font loading | `dokimos-app-v2/src/app/layout.tsx` |
| App shell (top bar + nav) | `dokimos-app-v2/src/components/AppShellLayout.tsx` (or equivalent) |
| Marketing home | `dokimos-app-v2/src/app/page.tsx` |
| Agent demo | `dokimos-app-v2/src/app/agent/page.tsx` + `src/components/agent/AgentChat.tsx` |
| Landlord demo | `dokimos-app-v2/src/app/landlord/page.tsx` + `src/components/landlord/LandlordDashboard.tsx` |
| Business/verifier landing | `dokimos-app-v2/src/app/business/page.tsx` |
| This design system | `dokimos-app-v2/DESIGN.md` |

---

*Last updated: May 2026. Update this file whenever a token, component, or copy rule changes — before shipping the change, not after.*
