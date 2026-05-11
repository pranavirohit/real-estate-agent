# Business / Verifier / Integration — gap audit checklist

**Purpose:** Repeatable pass/fail verification that `dokimos-app-v2/` (and repo Fastify) match **[`demo-business-verifier-source-kit.md`](./demo-business-verifier-source-kit.md)**. Use before demos, after large refactors, or when mapping PRD ↔ code.

**Canonical spec:** [`demo-business-verifier-source-kit.md`](./demo-business-verifier-source-kit.md)  
**Out of scope here:** Legacy `dokimos-app/`, root prototype `app/` (unless the spec explicitly mentions them).

---

## How to use

1. Run the app per **Prerequisites** (or note **N/A** with reason).
2. Work **top to bottom**. Check each box only when **Pass if** is satisfied; record **Evidence** (path, handler name, or what you clicked).
3. Anything that fails → add a row to **Gap log** at the bottom (or link to your issue tracker).
4. When the source kit changes, update this checklist in the same PR.

---

## Prerequisites

- [ ] **Next dev:** from `dokimos-app-v2/`, `npm run dev` — port **8081** (per workspace rules).
- [ ] **Fastify (if testing live API paths):** repo root server running as your project expects (e.g. `TEE_ENDPOINT` / env vars documented in `.env*` or README).
- [ ] **Browser:** fresh load or hard refresh before UI checks.

**Evidence / notes:**

---

## A. Routes and shell (`/business`, `/integration`)

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| A1 | `/business` layout | `verifier-theme`, `bg-dokimos-verifierCanvas`, accent uses verifier tokens (see `business/layout.tsx`, `tailwind.config.js`) | [ ] | |
| A2 | Header | Shows company name, email, **Viewing as: Airbnb** (or current demo session literals) | [ ] | |
| A3 | Nav | Tabs **Overview \| Verifications \| Programs**; single-column main `max-w-7xl`; **no** sidebar; **no** logout (per spec) | [ ] | |
| A4 | `/integration` | Widget / REST API / Trust tabs work; tab state is **not** URL-driven (stateful) unless code changed | [ ] | |
| A5 | Marketing entry | `/` → **For Businesses** → `/business` | [ ] | |

---

## B. Overview tab

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| B1 | Title & subtitle | Match spec: **Host verifications** + monitor subtitle (`DokimosPageTitle`) | [ ] | |
| B2 | Stat cards (4) | Counts/fallbacks, sublabels, deltas per spec (total, approval rate, avg time static **3m 12s**, monthly cost formula) | [ ] | |
| B3 | Verifications by program | Bar rows for three programs; **this month** counts and percentages | [ ] | |
| B4 | Eigen explainer | Numbered **1–4** copy matches spec §3 | [ ] | |
| B5 | Recent activity | Title, **View all verifications →** switches to Verifications tab; row shape; empty state if applicable | [ ] | |

---

## C. Verifications tab

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| C1 | Title & subtitle | **Host Verifications** + review subtitle | [ ] | |
| C2 | Workflow filter | From Programs → **View verifications** shows chip **Showing verifications for: …** and **Show all programs** clears filter | [ ] | |
| C3 | Toolbar | Search placeholder, status options (All / Verified / Pending / Denied / **Expired**), date (All / This week / This month), **Export** | [ ] | |
| C4 | Table | Columns **Name \| Email (lg+) \| Workflow \| Status \| Date verified \| Actions (View)** | [ ] | |
| C5 | Row click | Opens **`VerificationProgressiveModal`** (not `VerifyCheckModal` unless you intentionally changed this) | [ ] | |
| C6 | Status mapping | Pending >7 days → **Expired** (`PENDING_EXPIRE_MS`) | [ ] | |
| C7 | Pagination | **Showing X–Y of Z**, **Page n / m**, chevrons | [ ] | |
| C8 | CSV export | Filename `dokimos-verifications-{YYYY-MM-DD}.csv`, BOM `\ufeff`, columns per spec | [ ] | |
| C9 | Empty state | Filtered zero rows → copy per spec | [ ] | |

---

## D. Programs tab & program modal

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| D1 | Title block | **Verification Programs** subtitle; **sans** title if spec still says `useSerifTitle={false}` on this tab | [ ] | |
| D2 | Program cards | Three programs: names, stats, **What Gets Verified**, compliance, **View verifications** / **Edit** / **API** accordion | [ ] | |
| D3 | API block | Workflow ID, **POST /api/request-verification**, **View full API docs** → `/integration` | [ ] | |
| D4 | Create workflow modal | Fields, `WORKFLOW_ATTRIBUTE_OPTIONS` keys, footers **Create workflow** / **Cancel** | [ ] | |
| D5 | Edit workflow modal | Edit copy, **Save workflow** | [ ] | |
| D6 | Submit behavior | Still **`alert()` only** (no backend persist) **or** you intentionally implemented persistence (note drift in Gap log) | [ ] | |

---

## E. `VerificationProgressiveModal` & `VerifyCheckModal`

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| E1 | Layer 1 | **Verification Confirmed**, copy, **Verified:** timestamp, **What was verified**, **How does this work?** \| **Technical Details** | [ ] | |
| E2 | Layer 2 | **How Dokimos Verification Works**, narrative, bullets, back / forward | [ ] | |
| E3 | Layer 3 | **Verify This Proof Yourself**, five steps, toggles/links, **← Back to Summary** | [ ] | |
| E4 | `VerifyCheckModal` reachability | **`setVerifyModalOpen(true)`** is still never called **or** you added a UI path (document which) | [ ] | |
| E5 | `POST /api/verify-attestation` | Only used when `VerifyCheckModal` runs (or list other callers) | [ ] | |

---

## F. `/integration` page

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| F1 | Embedded Widget tab | Header, mock **Uber driver**, CTA/disabled continue per spec | [ ] | |
| F2 | REST API tab | Test API, **Test API Call**, success prefix **✅ Workflow verification triggered!**, error **❌ Error:** | [ ] | |
| F3 | Why TEEs Matter | Columns, **How It Works** diagram, **Key Insight** | [ ] | |
| F4 | Test call payload | Includes `verifierId: 'airbnb_prod'`, `userEmail: 'janice.sample@example.com'`, `requestedAttributes`, `workflow` (e.g. `host_verification`) | [ ] | |

---

## G. Backend & BFF (code review + optional curl)

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| G1 | Fastify seeds | Demo verifiers include **verify@airbnb.com** / **airbnb_prod** / **Airbnb**; shared **`demo1234`**; users include **janice.sample@example.com** (and other demo emails) | [ ] | |
| G2 | `POST /api/request-verification` | Zod body: `verifierId`, `userEmail`, `requestedAttributes`, optional `workflow`; 404 if missing; creates `req_*` pending | [ ] | |
| G3 | Next BFF | `dokimos-app-v2/src/app/api/request-verification/route.ts` forwards to `${TEE_ENDPOINT}/api/request-verification` | [ ] | |
| G4 | `GET /api/requests/verifier/:verifierId` | Implemented and matches how you’d build a live dashboard | [ ] | |
| G5 | Verifier auth BFF | `src/app/api/auth/verifier/*` proxies exist; **`/business` still does not require login** unless you wired it (note in Gap log) | [ ] | |
| G6 | `verifyAttestation` / `POST /api/verify-attestation` | Behavior matches `src/lib/verifyAttestation.ts` and modal expectations | [ ] | |

---

## H. Live vs static dashboard data

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| H1 | `/business` data source | Table uses **`BUSINESS_DEMO_REQUESTS`** (or document new fetch) | [ ] | |
| H2 | Fastify volume seed | You understand **`seedVerifierDashboardDemos()`** is for **live** UIs, not current `/business` (per spec) | [ ] | |
| H3 | “Real” verifier view | Document what would call **`GET /api/requests/verifier/airbnb_prod`** + auth | [ ] | |

---

## I. End-to-end pipeline (cross-flow)

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| I1 | Create request | Integration test (or curl) creates pending request in Fastify store | [ ] | |
| I2 | User-side | `GET /api/requests/user/janice.sample@example.com` (or equivalent) lists request | [ ] | |
| I3 | Approve | Consumer flow **`POST /api/approve-request`** still matches demo story | [ ] | |
| I4 | Verifier refresh | You can explain gap: **dashboard does not poll** live API today | [ ] | |

---

## J. Copy & typography spot checks

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| J1 | Program literals | Three program names + compliance lines match spec §3 (or note intentional copy edits) | [ ] | |
| J2 | `WORKFLOW_ATTRIBUTE_OPTIONS` | Keys: name, dateOfBirth, nationality, address, documentType, documentExpiryDate, notExpired, ageOver18, ageOver21 | [ ] | |
| J3 | Serif vs sans | `DokimosPageTitle` / Integration hero / modals match intended styles in spec §5 | [ ] | |

---

## K. Doc drift & demo safety

| # | Check | Pass if | Done | Evidence |
|---|--------|---------|------|----------|
| K1 | Illustrative URLs | Code blocks on `/integration` don’t contradict actual repo routes (or are labeled illustrative) | [ ] | |
| K2 | Curl completeness | UI curl for request-verification notes **abbreviated** vs required **`verifierId`** / **`requestedAttributes`** | [ ] | |
| K3 | Demo credentials | **`demo1234`** / in-memory data treated as non-production | [ ] | |

---

## Gap log

_Add rows as you audit._

| ID | Area | Requirement (short) | Status (missing / partial / drift) | Owner | Notes / PR |
|----|------|---------------------|--------------------------------------|-------|------------|
| G-001 | | | | | |

---

## Revision discipline

When changing verifier UI or APIs, update **[`demo-business-verifier-source-kit.md`](./demo-business-verifier-source-kit.md)** and adjust **this file** in the same change. When updating API contracts, sync Fastify `src/index.ts` (or equivalent) and Next `src/app/api/*` proxies per source kit §8.
