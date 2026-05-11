# Demo script source kit — Business / Verifier / Integration pipeline

Companion to **`demo-script-source-kit.md`** (consumer journey). This document covers the **verifier-facing UI**, **offline demo data**, **live backend APIs** that power real flows, and the **`/integration`** developer surface — at the same level of specificity as the consumer kit.

**Canonical UI:** `dokimos-app-v2/` — **`/business`** (Verifier Dashboard), **`/integration`** (embed + API docs + trust narrative).  
**Legacy:** root `dokimos-app/` is not covered here.

---

## Executive summary: what is “real” vs “demo only”

| Layer | What it is |
|-------|------------|
| **`/business`** (`VerifierDashboard`) | **Hybrid:** fixed session **`AIRBNB_DEMO_SESSION`** (`verifierId: airbnb_prod`, `verify@airbnb.com`, **Airbnb**). Table/overview use seeded **`BUSINESS_DEMO_REQUESTS`**; **Send verification request (live API)** calls **`POST /api/request-verification`** and prepends the returned row when Fastify is up. |
| **Fastify** (`src/index.ts`, repo root) | **In-memory** `users`, `verifiers`, `requests`. **Seeded** demo users/verifiers, **`seedVerifierDashboardDemos()`** (hundreds of synthetic rows), **`seedDemoVerificationRequests()`** (Janice’s consumer demos). Shared password for demo accounts: **`demo1234`**. |
| **`/integration`** | **Live** “Test API Call” button → **`POST /api/request-verification`** → Fastify **`POST /api/request-verification`** (requires a seeded user such as **`janice.sample@example.com`** + valid **`verifierId`** e.g. **`airbnb_prod`**). Other code blocks are **illustrative** (e.g. `https://api.dokimos.com/verify` is not the same as this repo’s `POST /verify` on Fastify). |
| **Verifier auth API routes** (`dokimos-app-v2/src/app/api/auth/verifier/*`) | **Real BFF proxies** to Fastify **`/api/auth/verifier/*`**. The **`/business`** page does **not** wire login UI to these routes today. |

---

## 1) Visual foundation — screenshot / capture inventory

Run Next on **8081**. The business shell uses **`verifier-theme`** (see `src/app/business/layout.tsx`): off-white canvas **`bg-dokimos-verifierCanvas`**, indigo **`dokimos-verifier-accent`** for links/focus (see `tailwind.config.js`).

### A. `/business` — Verifier Dashboard (`VerifierDashboard.tsx`)

| # | State | How to capture |
|---|--------|----------------|
| B1 | **Overview** tab (default) | Open `/business` — stats cards, program breakdown, Eigen explainer, recent activity |
| B2 | **Verifications** tab | Click **Verifications** — toolbar, table, pagination |
| B3 | Verifications + **workflow filter chip** | **Programs** → **View verifications** on a card → returns to Verifications with “Showing verifications for: …” |
| B4 | **Programs** tab | Grid of three program cards |
| B5 | Programs → **API** accordion expanded | Per-card **API** chevron — Developer integration block |
| B6 | **Create workflow** modal | **Create workflow** — full form |
| B7 | **Edit program** modal | **Edit program** on a card |
| B8 | Row click → **`VerificationProgressiveModal`** | **Verifications** → click any table row — Layer 1 verdict |
| B9 | Progressive modal **Layer 2** | **How does this work?** |
| B10 | Progressive modal **Layer 3** | **Technical Details** — stepped proof UI |
| B11 | Verifications **empty state** | Only if filtered table has zero rows (unlikely with bundled demo data) |

**Note:** **`VerifyCheckModal`** (the large three-layer modal that calls **`POST /api/verify-attestation`**) is **mounted** in `VerificationsTab` but **`setVerifyModalOpen(true)` is never called** anywhere in the repo — so this modal is **not reachable via normal UI** as of this codebase. The **progressive** modal is what users get from row clicks.

### B. `/integration` (`src/app/integration/page.tsx`)

| # | Tab | Content |
|---|-----|---------|
| I1 | **Embedded Widget** | Widget code block, “What users see” mock (Uber driver) |
| I2 | **REST API** | Test API section, sample request/response JSON, verify snippet |
| I3 | **Why TEEs Matter** | Traditional vs Dokimos comparison, vertical “How It Works” diagram, Key Insight callout |

### C. Marketing entry

- **`/`** (`DokimosLanding`): CTA **For Businesses** → **`/business`** (same as consumer kit).

---

## 2) Navigation map — screens, buttons, branches

### `/business` shell

- **Header:** company **`session.companyName`** (**Airbnb**), email **`verify@airbnb.com`**, right rail **Viewing as: Airbnb** (literal).
- **Tabs:** **Overview** | **Verifications** | **Programs** (label **Programs** in the nav; section titles sometimes say “Verification Programs” / “workflow”).
- **No** logout, **no** sidebar — single-column main `max-w-7xl`.

### Tab: Overview (`OverviewTab`)

- **Title** (`DokimosPageTitle`): **Host verifications** — *subtitle:* **Monitor verification volume, program performance, and recent activity**
- **Stat cards (4):**
  - **Total verifications** — value = `requests.length` or fallback **1570** if empty; sub **This month**; green **12% vs last month**
  - **Approval rate** — computed from demo rows; sub **Last 30 days**; **2.1% vs previous period**
  - **Avg completion time** — static **3m 12s**; sub **Median time to complete**; **15s faster than last month**
  - **Monthly cost** — `${(totalVerifications * 0.50).toFixed(2)}`; sub **{n} verifications × $0.50**; amber **$47.20 vs last month**
- **Verifications by program:** bar rows for each of three programs with **this month** counts and percentages.
- **How Dokimos + EigenCompute works** — numbered **1–4** (see §3 literal copy).
- **Recent activity:** title **Recent activity**; link **View all verifications →** switches tab to **verifications**; rows show status pill **Approved** / **Pending** / **Denied**, display name, time, line `{ProgramName} · {n} attributes`; empty: **No recent activity**.

### Tab: Verifications (`VerificationsTab`)

- **Title:** **Host Verifications** — *subtitle:* **Review and manage requests from your users**
- **Filter chip** (conditional): **Showing verifications for:** `{ProgramName}` — button **Show all programs**
- **Toolbar:**
  - Search placeholder: **Search by name or email...**
  - Status `<select>`: **All statuses**, **Verified only**, **Pending only**, **Denied**, **Expired**
  - Date: **All dates**, **This week**, **This month**
  - **Export** (downloads CSV)
- **Table columns:** **Name** | **Email** (lg+) | **Workflow** | **Status** | **Date verified** | **Actions** (**View**)
- **Row click** (whole row): opens **`VerificationProgressiveModal`** for that request (does **not** open `VerifyCheckModal`).
- **Status badge mapping:** `rowStatus()` — pending >7 days → **Expired** (`PENDING_EXPIRE_MS = 7 days`).
- **Pagination:** **Showing X–Y of Z** — **Page n / m** — chevron buttons.
- **Empty:** **No verifications found** — **Verifications will appear here when triggered by your application**

### Tab: Programs (`WorkflowsTab`)

- **Title block:** **Verification Programs** — *subtitle:* **Create custom verification programs for different use cases. Each program defines what identity attributes you need to verify.**
- **Create workflow** button (opens modal).
- **Per program card:**
  - Title `{program.name}`, **Active** pill (all three active in demo).
  - Audience line from `audienceDescription`.
  - Stats: **`{n}` this month** | **`{approvalRate}%` approved** | **`{avgTime}` avg time**
  - Section **What Gets Verified** — checklist lines from `displayAttributes`.
  - **Compliance** green callout — `program.compliance`
  - Buttons: **View verifications** (sets workflow filter + tab **verifications**), **Edit program**, **API** (toggle)
  - **Developer integration:** **Workflow ID**, **API endpoint** `POST /api/request-verification`, **Example request** curl (minimal JSON — **note:** real API also requires **`verifierId`** and **`requestedAttributes`**; the curl in UI is abbreviated), link **View full API docs** → `/integration`

### Program modal (`ProgramModal`)

- **Create:** title **Create verification workflow** — body copy **Name the workflow, pick the attributes you need—users share only what you ask for.**
- **Edit:** **Edit verification workflow** — **Update what this workflow verifies and how it appears to your team.**
- Fields: **Workflow name \***, **Workflow ID (for API) \***, helper on slug, **Required attributes \***, helper **Select the information you need from a verified identity.** (checkbox list from **`WORKFLOW_ATTRIBUTE_OPTIONS`** — titles/descriptions per attribute), **Purpose (optional)**, **Compliance note (optional)**
- Footer: **Cancel** | **Create workflow** / **Save workflow**
- **Submit behavior:** **`alert()`** only — **does not** persist to backend. Create alert text includes **`Workflow created.`** and **`workflow: "{programKey}"`** in **`POST /api/request-verification`**.

### `VerificationProgressiveModal` (row click)

Three layers:

1. **Layer 1 —** heading **Verification Confirmed** (not Instrument Serif on the main title — `text-2xl font-semibold`). Copy: **`{displayName}'s identity has been verified by secure hardware. No manual review needed.`** · **Verified: {localized ts}** · **What was verified:** list · buttons **How does this work?** | **Technical Details**
2. **Layer 2 —** **How Dokimos Verification Works** — narrative with **Janice** example, **Why this matters for you** bullet list, **← Back**, **Technical Details →**
3. **Layer 3 —** **Verify This Proof Yourself** — five steps (**Check the Digital Signature**, **Verify the Hardware**, **Check Source Code**, **Verify Build Provenance**, **Confirm Face Match**) with progress bars, **What this proves** toggles, external links where configured — **← Back to Summary**

### `/integration` flows

- **Tab switch** — no URL query; stateful.
- **REST API → Test API Call:** `axios.post('/api/request-verification', { verifierId: 'airbnb_prod', userEmail: 'janice.sample@example.com', requestedAttributes: [...], workflow: 'host_verification' })`
  - **Success** sets multiline result string beginning with **✅ Workflow verification triggered!** (includes **Request ID**, **User: janice.sample@example.com**, instructions to check Verifier Dashboard).
  - **Error** prefix **❌ Error:** with server message.

---

## 3) Literal on-screen copy — consolidated

### Programs (static definitions in `VerifierDashboard`)

**Host Verification** — *Verify identity and eligibility for hosts listing properties* — compliance: *Host identity and eligibility checks; obligations vary by region (e.g. short-term rental rules).* — display lines: Government-issued ID; Age 18+ verification; Address confirmation; Full name verification — stats **1247** / **98%** / **2m 18s**

**Guest Identity Check** — *Verify guest identity before booking confirmation* — compliance: *Booking and trust & safety policies for guest identity.* — **3891** / **99%** / **1m 48s**

**Experience Host Verification** — *Enhanced verification for hosts offering experiences* — compliance: *Experience host and activities requirements by jurisdiction.* — **456** / **98%** / **2m 6s**

### Overview — Eigen explainer block

1. **User uploads ID in TEE** — *Document processed in Intel TDX secure enclave*
2. **TEE generates attestation** — *Cryptographic proof of code execution (MRENCLAVE)*
3. **Eigen AVS verifies attestation** — *Economic security via operator staking*
4. **You verify independently** — *Check signature on Etherscan, deployment on EigenCloud*

### `WORKFLOW_ATTRIBUTE_OPTIONS` (Create/Edit workflow)

Each option has **title** + **description** — keys: **name**, **dateOfBirth**, **nationality**, **address**, **documentType**, **documentExpiryDate**, **notExpired**, **ageOver18**, **ageOver21** (exact strings in component).

### `VerifyCheckModal` (unreachable in UI; strings for completeness)

- Sticky header titles cycle: **Verification** | **How Dokimos works** | **Verify it yourself** (Instrument Serif on `h2`)
- Loading: **Checking this proof…**
- Error card: **Couldn't verify automatically**
- Amber: **Verification not confirmed** — *The digital seal on this proof doesn't check out. Don't rely on this result until your team investigates.*
- Success: **Verification confirmed** — *{personName}'s identity has been verified by secure hardware. No manual review needed.* — **Verified: {date}**
- **What was verified** — list from `buildPlainLanguageVerificationRows` or fallback **Included in signed proof**
- Buttons: **How does this work?** | **Technical details** | **Close**
- Explainer layer: opening **Think of Dokimos like a notary, but digital and extremely hard to fake.** — numbered emoji steps — **Why this matters** box with four bullets (• Less manual review…)
- Technical layer: 5 steps with **Step n of 5**, **All automated checks passed** / **Some checks need human review**, **Download proof**, **← Back to summary**

### Integration — Widget tab

- Header: **Dokimos** — *Embed privacy-preserving identity verification in your application*
- **Drop-in Widget Integration** — *The fastest way to add identity verification to your app. Users never leave your site.*
- Mock: **Become an Uber Driver** — **Complete your profile to start earning** — inner card **Identity Verification** / **Powered by Dokimos** — button **Verify with Dokimos** — fine print *Your ID is processed in a secure enclave. Uber never sees your document.* — **Continue (Verify identity first)** (disabled)

### Integration — API tab (section headings)

- **Server-Side API Integration** — *Trigger verifications from your backend and receive cryptographic attestations.*
- **Test API Integration** — *Simulate an API call to create a verification request for the demo user* — button **Test API Call** / **Testing...**
- Callout: *What this simulates:* — *POST /api/request-verification with workflow "host_verification" for janice.sample@example.com (verifier airbnb_prod)* — *In production, this API call would be triggered automatically when a user signs up in your app (e.g., Uber driver signup flow).*
- Steps **1 Request Verification**, **2 Response Structure (with Eigen Attestation)**, **3 Verify the Attestation** — callout about **`tee`** and **`eigen`** objects

### Integration — Trust tab

- **The Trust Model** — *Why Trusted Execution Environments change everything for identity verification*
- Columns **Traditional Verification** vs **Dokimos + EigenCompute** (bullet lists — see source for full sentences)
- Diagram title **How It Works** — steps **User uploads ID** → **Processing in Intel TDX TEE** → **Eigen AVS Verification** → **Your Application Receives Proof**
- **Key Insight** — paragraph ending *Eigen AVS is what makes the proof credible.*

---

## 4) Technical trigger points — verifier pipeline

### Backend: seeded verifiers (`seedDemoAccounts`)

| Email | verifierId | companyName |
|-------|------------|-------------|
| acme@brokerage.com | verifier_001 | Acme Brokerage |
| verify@coinbase.com | verifier_002 | Coinbase |
| kyc@binance.com | verifier_003 | Binance |
| compliance@robinhood.com | verifier_004 | Robinhood |
| verify@airbnb.com | **airbnb_prod** | **Airbnb** |
| identity@uber.com | verifier_006 | Uber |
| kyc@stripe.com | verifier_007 | Stripe |
| verify@upwork.com | verifier_008 | Upwork |

All share hashed password **`demo1234`**.

**Primary demo user (consumer + API tests):** **`janice.sample@example.com`**, name **Janice Sample**, **`user_janice`** (plus three other seeded demo emails; all use **`demo1234`**).

### `POST /api/request-verification` (Fastify)

**Zod body:**

- **`verifierId`**: string 1–128 (must exist in `verifiers` map)
- **`userEmail`**: valid email (must exist in `users` map)
- **`requestedAttributes`**: string array 1–50 items, max 64 chars each
- **`workflow`**: optional string max 128 (stored as metadata; defaults **`host_verification`** in handler)

**Behavior:** 404 if verifier or user missing; else creates **`requestId`** `req_{timestamp}`, status **`pending`**, stores in `requests` map, returns the full request object.

**Next.js:** `dokimos-app-v2/src/app/api/request-verification/route.ts` forwards JSON to **`${TEE_ENDPOINT}/api/request-verification`**.

### `GET /api/requests/verifier/:verifierId`

Lists all requests where **`req.verifierId`** matches. Used if you build a logged-in verifier UI against the BFF (`dokimos-app-v2/src/app/api/requests/verifier/[id]/route.ts`).

### Verifier session auth (Fastify + Next BFF)

- **`POST /api/auth/verifier/signup`**: `companyName`, `email`, `password` → new verifier or 400 duplicate
- **`POST /api/auth/verifier/login`**: returns **`sessionToken`**, **`verifierId`**, **`companyName`**, **`email`**
- **`GET /api/auth/verifier/session`**: Bearer token
- **`POST /api/auth/verifier/logout`**

**Not used** by `/business` dashboard (offline demo).

### `POST /api/verify-attestation` (Next.js `src/lib/verifyAttestation.ts`)

Used by **`VerifyCheckModal`** (if opened): **`verifyMessage`** + checks **`tee`** quote/mrenclave present + **`eigen`** appId/verificationUrl + app id equals **`DEFAULT_EIGEN_APP_ID`** / env **`EIGEN_APP_ID`**. Returns **`note`** about mock TEE quotes.

### Synthetic volume: `seedVerifierDashboardDemos()`

For **each** seeded verifier, creates **32** requests (`req_vdash_{verifierId}_{i}`) with mixed **pending** / **denied** / **approved**, workflows **`host_verification`** or **`driver_onboarding`**, mock attestations for approved rows. **Stale** pendings (~9 days) for **expired** UX in any UI that reads live API.

**Important:** `/business` **does not** fetch these — it only shows **`BUSINESS_DEMO_REQUESTS`** (5 rows). A **live** verifier table would need to call **`GET /api/requests/verifier/airbnb_prod`** with auth.

### CSV export (Verifications tab)

Filename pattern: **`dokimos-verifications-{YYYY-MM-DD}.csv`** (ISO date slice). BOM `\ufeff` prefixed. Columns: **Name**, **Email**, **Workflow**, **Status** (mapped row status), **DateVerifiedOrRequested**, **RequestId**.

### Display names (`lib/verificationPlainLanguage.ts`)

**`getVerificationDisplayName`**: prefers attestation **`attributes.name`**, else derives from email local-part; digits in name trigger **`Verified applicant`** fallback constant **`VERIFICATION_DISPLAY_NAME_FALLBACK`**.

---

## 5) Emotional / typographic beats (business theme)

- **`verifier-theme`** (`globals.css`): verifier page title class **`.dokimos-verifier-page-title`** — large sans, tight tracking (not teal consumer accent).
- **`DokimosPageTitle`** on Overview / Verifications: default **`useSerifTitle`** → **Instrument Serif** on the main `<h1>` unless overridden; Workflow tab passes **`useSerifTitle={false}`** for a **sans** “Verification Programs” title.
- **Integration** hero **Dokimos** and major H2s: **Instrument Serif** via inline style.
- **VerifyCheckModal** / progressive modal: mixed — key instructional headings use **Instrument Serif** in `VerifyCheckModal`; **VerificationProgressiveModal** Layer 1 uses **sans** for “Verification Confirmed”.

---

## 6) End-to-end “business pipeline” story (for scripts)

1. **Developer** (or **Integration** test button, or **`/business`** live panel) calls **`POST /api/request-verification`** with **`verifierId: "airbnb_prod"`**, **`userEmail: "janice.sample@example.com"`** (or another seeded demo email), **`requestedAttributes`**, **`workflow`** (e.g. **`host_verification`**).
2. **Fastify** stores a **pending** **`VerificationRequest`** keyed by **`requestId`**.
3. **End user** (signed in as that email in the app) sees the request under **Vault / Activity** via **`GET /api/requests/user/{userEmail}`**.
4. User **approves** in **`Screen04Share`** → **`POST /api/approve-request`** with **`imageBase64`** → backend re-OCRs, attaches **signed attestation**, marks **approved**.
5. **Verifier** in a **real** product would poll **`GET /api/requests/verifier/airbnb_prod`** — the **`/business` UI** still uses static **BUSINESS_DEMO_REQUESTS** as its baseline table, with **live-sent** requests merged at the top when you use the panel.

**Attestation reuse:** Same **`AttestationData`** shape as consumer kit — integrators verify via **`POST /api/verify-attestation`** or Etherscan / Eigen URLs embedded in proofs.

---

## 7) `BUSINESS_DEMO_REQUESTS` row reference (exact emails / workflows)

| requestId | userEmail | workflow | status |
|-----------|-----------|----------|--------|
| req_airbnb_001 | jordan.lee@gmail.com | host_verification | approved |
| req_airbnb_002 | janice.sample@example.com | host_verification | pending |
| req_airbnb_003 | marcus.johnson@yahoo.com | guest_verification | approved |
| req_airbnb_004 | emily.rodriguez@gmail.com | host_verification | denied |
| req_airbnb_005 | david.kim@hotmail.com | guest_verification | pending |

All use **`verifierId` `airbnb_prod`**, **Airbnb** / **verify@airbnb.com**.

---

## 8) Files index (for editors)

| Path | Role |
|------|------|
| `src/app/business/page.tsx` | Renders `VerifierDashboard` |
| `src/app/business/layout.tsx` | `verifier-theme` wrapper |
| `src/components/verifier/VerifierDashboard.tsx` | All three tabs, modals, program definitions |
| `src/components/verifier/VerifierLiveRequestPanel.tsx` | Live **Send request** → `POST /api/request-verification` |
| `src/components/verifier/businessDemoData.ts` | `BUSINESS_DEMO_REQUESTS` |
| `src/components/verifier/VerificationProgressiveModal.tsx` | Row-click progressive proof UI |
| `src/app/integration/page.tsx` | Widget / API / Trust tabs |
| `src/app/api/request-verification/route.ts` | BFF to Fastify |
| `src/app/api/requests/verifier/[id]/route.ts` | BFF list by verifier |
| `src/app/api/auth/verifier/*/route.ts` | Login/signup/session/logout proxies |
| `src/lib/verifyAttestation.ts` | Attestation verification helper |
| `src/lib/verificationPlainLanguage.ts` | Display names + plain-language rows |
| Repo root `src/index.ts` | Fastify stores, `seedDemoAccounts`, request handlers |

---

### Revision discipline

When updating verifier copy, search **`VerifierDashboard.tsx`**, **`VerificationProgressiveModal.tsx`**, **`integration/page.tsx`**, and **`businessDemoData.ts`**. When updating API contracts, sync **`src/index.ts`** Zod schemas and Next **`src/app/api/*`** proxies.
