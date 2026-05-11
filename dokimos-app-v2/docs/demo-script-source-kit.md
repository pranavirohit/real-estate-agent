# Demo script source kit (Dokimos consumer flow)

This document satisfies six research tracks for a **screen-synced demo script**.  
**Canonical product UI:** `dokimos-app-v2/` (Next.js on port **8081**). The older `dokimos-app/` folder is a **legacy** prototype (different routes/components); this kit focuses on **v2** unless you explicitly revive legacy for a shot list.

**Related:** Business / verifier dashboard, integration developer page, live API wiring, and seeded verifier database — see **`demo-business-verifier-source-kit.md`**.

**Runtime for real TEE calls:** start Fastify from repo root (`npm run dev`, default **http://localhost:8080**) and set `TEE_ENDPOINT` in `dokimos-app-v2/.env.local`. Next.js proxies `/api/*` to that backend.

---

## 1) Visual foundation — screenshot inventory

Automated export from `pencil-new.pen` requires that file **open in the Pencil editor** (MCP limitation). For **pixel-accurate UI**, capture the **live app** at the URLs below (mobile width ~390px matches the phone-first shell; `/app/vault` is full-width on desktop).

| # | Route / state | What to capture |
|---|----------------|-----------------|
| 1 | `http://localhost:8081/` | Marketing landing (hero, CTAs) |
| 2 | `http://localhost:8081/onboarding` | Step 1: ID upload (default + file selected + optional camera mode) |
| 3 | `http://localhost:8081/onboarding?step=1` | Liveness / selfie |
| 4 | `http://localhost:8081/onboarding?step=2` | TEE processing (loading) — arrive by advancing flow |
| 5 | `http://localhost:8081/app/vault` | Vault hub (“Your vault” hero + three cards) |
| 6 | Same + first visit | Overlay: **What just happened?** (post-verification modal) |
| 7 | Same + sequence | Overlay: **How Dokimos protects your identity** (explainer after post-modal) |
| 8 | `http://localhost:8081/app/vault` | Expand **Verified identity** / **Pending requests** / **Activity** cards (three detail states) |
| 9 | `http://localhost:8081/app/requests` | Activity hub: “Where you're verified” |
| 10 | `http://localhost:8081/app/requests/review` | Review request (needs `selectedRequest` in context — best captured by tapping a pending row from vault or activity) |
| 11 | `http://localhost:8081/app/requests/receipt` | Receipt after approve (navigate from review after approval) |
| 12 | `http://localhost:8081/business` | Verifier marketing dashboard (offline demo, separate story) |

**Optional:** `dokimos-app/` legacy — `page.tsx`, `vault/page.tsx`, `verify/[attestationId]/page.tsx` for historical comparison only.

Place exported PNGs under `dokimos-app-v2/docs/demo-screenshots/` with names like `01-landing.png`, … matching the table.

---

## 2) Navigation map (buttons, branches, loading/error)

### A. Marketing → onboarding

- **`/`** (`DokimosLanding`): **For Individuals** → `/onboarding`. **For Businesses** → `/business`.
- Landing hero and pillars are static content (no API).

### B. Onboarding (`OnboardingFlow`, `/onboarding`)

Linear **3 steps** (`?step=0|1|2`; legacy `?step=3|4|5` maps to `0|1|2`).

| Step | Screen | Primary actions | Next state |
|------|--------|-----------------|------------|
| 0 | `Screen02UploadOrCapture` | **Back** → `/` (home). **Next** enabled only after valid image (JPG/PNG/WebP, ≤10MB). Modes: upload vs **Take a photo** (ID camera). | Advances to step 1 |
| 1 | `Screen02BLiveness` | **Back** → step 0. **Next** captures selfie → brief “Continuing…” → step 2. Camera denial → inline error; footer shows **This takes about 10 seconds** while processing. | Step 2 |
| 2 | `Screen02VerifyProcessing` | On mount: reads `dokimos_stored_image` + `dokimos_live_photo` from `localStorage`, **`POST /api/verify`**, then `onSuccess` → **`markOnboardingComplete()`** + **`router.push("/app/vault")`**. **Back** → step 1. | Vault |

**Error branches (step 2):**

- Missing storage: *“Missing ID or selfie. Go back and complete the previous steps.”*
- API failure: *“Verification failed. Please try again.”*

**Dev-only:** floating panel “Onboarding X / 3”, **Next →**, **Sign out** (does not ship to production UI).

### C. First vault visit (`/app/vault`)

- If onboarding just completed and post-modal not seen: **`PostVerificationModal`** (“What just happened?”).
- After dismiss / learn-more / verify-yourself: may show **`ExplainerModal`** (“How Dokimos protects your identity”) if not seen.
- Main surface: **`VaultNavigationDashboard`** inside `Screen03Vault` (`showHeaderBack={false}`).

### D. App shell (tabs: Vault / Activity / Settings)

- **`AppShellLayout`** bottom nav (mobile): **Vault** → `/app/vault`, **Activity** → `/app/requests`, **Settings** → `/app/settings`.
- **`/app/vault`**: full-bleed vault hero; detail panels for identity / pending / activity.
- **`/app/requests`**: `Screen06History` — pending rows navigate to **review**.

### E. Review → receipt

- **`/app/requests/review`**: `Screen04Share` + top bar **Review request** / back to requests.
- **Approve and Share** → `POST /api/approve-request` → on success → **`/app/requests/receipt`**.
- **Deny** → `POST /api/approve-request` (approved: false) → **`/app/requests`**.
- File picker validation: alert *“Please choose a JPG, PNG, or WebP image.”* / size alert *“Image must be 10MB or smaller.”*

### F. Re-verify (vault)

- If `localStorage` has `dokimos_has_encrypted_id` and user signed in with Google: **Re-verify identity** → **`POST /api/re-verify`** (session required). Errors surface from API (e.g. no stored ID).

---

## 3) Literal on-screen copy (representative strings)

Use these **verbatim** in scripts; dynamic bits shown in *italics*.

### Landing (`/`)

- Title: **The last time you'll ever have to upload your ID**
- Body: **Verify once in a protected environment. Approve what you share, per request. Prove outcomes with cryptography—not just a checkbox.**
- Buttons: **For Individuals** · **For Businesses**
- Strip: **Built for teams who need auditability** — pills: **EigenCompute**, **Intel TDX**, **TEE attestation**, **Selective disclosure**
- Section: **Everything you need to verify identity** / **From document capture to signed proofs — one flow for users, one API for your backend.**
- Cards: **Verify once** · **Share on approval** · **Prove with cryptography** (with their descriptions in `DokimosLanding.tsx`)

### Onboarding — left rail (`PlaidSplitOnboardingLayout`)

- Step 0 headline: **One last upload. Ever.**
- Bullets: **Get verified in minutes with a single photo** · **Your ID is processed in protected hardware and deleted immediately** · **Approve what you share—per request—with cryptographic proof**
- Rail footer: **Trusted for high-stakes verification** — **Finance**, **HR**, **Mobility**, **Healthcare**

- Step 1 headline: **Just making sure it's you.**
- Bullets: **Face match runs against your ID photo in protected hardware** · **No image is stored after verification completes** · **Same privacy guarantees as your government ID upload**

### Onboarding — card (step 0)

- Titles: **Upload your government ID** / **Take a photo of your ID**
- Descriptions: **Take a photo or upload an image of any government-issued ID.** · **Position your ID in the frame, then capture. Use good lighting and avoid glare.**
- Detail: **Not even Dokimos can see your ID after processing.**
- Upload empty state: **Upload or capture** · **Your device may ask for camera or photo library access only when you choose a file.** · **Choose file** · **Take a photo** · **Or drag and drop an image here** · format pills **JPG** **PNG** **WebP**
- Drag overlay: **Drop to upload**
- Selected: **Ready for Next**
- Validation errors: **File too large. Maximum size is 10MB.** · **Please use a JPG, PNG, or WebP image.** · **Could not read image. Please try again.** · **Camera is not available in this browser.** · **Could not access the camera. Check permissions and try again.**

### Onboarding — card (step 1 liveness)

- **Take a photo** · **Take a quick selfie to confirm you're the person on this ID.** · **Your photo is processed in protected hardware and immediately deleted. Not even Dokimos can see it.**
- Error: **Camera access denied. Enable camera permissions in your browser and try again.**
- States: **Starting camera…** · **Camera unavailable** · **Continuing…** · footer **This takes about 10 seconds**
- Primary button: **Next**

### Onboarding — processing (step 2)

- **Verifying in TEE…**
- **OCR, face match, and signing — this can take up to a minute.**
- Errors: **Missing ID or selfie. Go back and complete the previous steps.** · **Verification failed. Please try again.** · **Go back**

### Vault hub (`VaultNavigationDashboard`)

- **Your vault**
- **One verified identity. Trusted everywhere.**
- Cards (idle): **View your verified identity** · **Review pending requests** · **See activity history**
- Short labels (sidebar mode): **Verified identity** · **Pending requests** · **Activity history**

### Vault identity / chrome (`DokimosPageChrome` when used)

- **Home** (role label) · **Your Identity Vault** · **When companies need to verify your identity, you can approve or decline each request. Your details stay private.**
- Status: **Identity verified** · optional **Refreshed from your stored ID (re-verification)**
- Face row: **Face matched to ID** or **Face match check did not pass** · **Confidence** *NN.N%*
- Sections: **Next steps** · hub buttons **Review pending** (with badge) · **Activity & history** · **How Dokimos works**
- **Pending requests** / **Nothing pending** / **When an organization asks for a verified proof, it will show up here.** · **Review →** · **View all requests** · **Loading requests…**
- Re-verify block: **Re-verify without re-uploading** · body text about encrypted ID · **Re-verify identity** / **Re-verifying…** · **Sign in with Google to re-verify using your stored ID.**

### Post-verification modal

- **What just happened?** (Instrument Serif)
- **Your ID is safe.**
- Body includes: **We verified your ID document and confirmed your face matches it.** … **Dokimos never saw your actual document or photo.** … **Everything was processed in isolated, tamper-proof hardware that even we can't access.** … **What you have now is a verified digital credential you can share with anyone, without ever uploading your ID again.**
- **Learn more** · **Verify it yourself**

### Explainer modal

- **How Dokimos protects your identity**
- **Verify it yourself** / **Open the Eigen verification dashboard**
- **Got it**

### Activity (`Screen06History`)

- Header: **Dokimos** · **Activity** · **Where you're verified** · **Every place you've shared a verified proof.**
- Empty: **No verification requests yet.** · **When an organization asks for a verified proof, it will show up here.**
- **Pending** · **Needs your response** · **Completed** · **Filters apply to past verifications.** — filter pills **All** · **This month** · **Last 3 months** · **Older**
- Error: **Could not load your verification history. Check your connection and try again.** · **Retry**
- Loading: **Loading…**
- Row: **Declined** (when denied)

### Review (`Screen04Share`)

- Top bar: **Review request**
- Partner title uses company name; badge **Verified Partner** · workflow label from `workflowDisplayName` · **Requested** *relative time*
- Trust copy: ***Company* receives proof you meet these *N* requirements. They cannot see your ID photo or any other personal details.** · **Verified by Intel TDX Secure Enclave**
- ID section: **Government ID** · **ID image ready for this approval.** · **Change photo** · **Choose a photo of your ID. On your phone, you can take a picture or pick from your library.** · **Choose photo**
- **Approve and Share** / **Approving...** · **Deny** / **Processing...**

### Receipt (`Screen05Receipt`)

- **Dokimos** · large **Verified** (Instrument Serif) · **Shared with** *company* · **Verified on** *date*
- Badge: **Powered by EigenCompute** · **Intel TDX Trusted Execution Environment** · paragraph on secure hardware / cryptographic proof
- **How is this verified?** (accordion)
- Links: **Verify Signature on Etherscan** · **View Code on EigenCloud Dashboard**
- Footer: **Issued by Dokimos · Cryptographic identity infrastructure** · **Done**

### Bottom tabs (`AppShellLayout`)

- **Vault** · **Activity** · **Settings**

---

## 4) Technical trigger points (credible narrative for Gaj / Soubhik)

| User action | Client call | Next.js BFF | Fastify (`TEE_ENDPOINT`) | Notable response / side effects |
|-------------|-------------|---------------|----------------------------|----------------------------------|
| Complete ID + selfie | `Screen02VerifyProcessing` `axios.post("/api/verify", { imageBase64, livePhotoBase64, requestedAttributes: [] })` | `src/app/api/verify/route.ts` → `POST ${TEE}/verify` | `POST /verify` | OCR + optional face match + **`buildSignedAttestationResponse`**. If NextAuth session has email, passes **`userId`** → may set **`encryptedIdStored: true`** and store encrypted ID for **`/re-verify`**. |
| Google sign-in | NextAuth | `signIn` callback → `POST ${TEE}/api/auth/user/signup` | Registers email in in-memory `users` (required later for `request-verification`). | |
| List requests | `GET /api/requests/user/:email` | Proxies to Fastify | `GET /api/requests/user/:userEmail` | Drives pending / activity UIs. |
| Approve request | `POST /api/approve-request` with `requestId`, `approved: true`, `imageBase64` | Proxies | Re-OCR image, filter **`requestedAttributes`**, build **signed attestation** (same shape as verify). | |
| Re-verify | `POST /api/re-verify` (session required) | `POST ${TEE}/re-verify` with `userId: email` | Decrypts stored ID, re-OCR, sign; returns **`reVerified: true`**. | |

**Attestation message format (Fastify):**  
`IdentityAttestation|${JSON.stringify(attributes)}|${timestamp}` plus optional `|bio:{...}` when selfie was used.

**Top-level JSON fields returned to UI (see `AttestationData` in `src/types/dokimos.ts`):**  
`attributes`, `timestamp`, `message`, `messageHash`, `signature`, `signer`, optional `biometricVerification`, optional `eigen` (`appId`, `verificationUrl`), optional `tee` (on backend), optional `reVerified`.

**File validation:** client-side in `Screen02UploadOrCapture.tsx` (`validateImageFile`); Next **`/api/verify`** rejects missing/`imageBase64` and oversize base64 (~10MB).

---

## 5) Emotional beats — Instrument Serif vs marketing sans

- **`--font-instrument-serif`** (Next font **Instrument_Serif**) is used for **editorial / proof moments**, not the global body (body defaults to **Geist Sans**; `--font-instrument-sans` in CSS maps to **Geist**, not a separate Instrument Sans file).

**Strong serif anchors:**

- **Receipt** (`Screen05Receipt`): large **Verified** headline.
- **Review request** (`Screen04Share`): verifier **company name** as serif headline beside **Verified Partner**.
- **Post-verification modal**: **What just happened?**
- **Explainer modal**: **How Dokimos protects your identity**
- **`DokimosPageTitle`**: titles when `variant` uses serif (shared pattern).

**Contrast (not Instrument Serif):**

- Marketing landing (`font-landing`) uses **Plus Jakarta Sans** for the main marketing surface.
- Vault hero **Your vault** uses **`font-landing`** (Plus Jakarta), **not** Instrument Serif — the tagline **One verified identity. Trusted everywhere.** is the emotional line there in **sans**.

Use serif beats for “proof / trust / revelation”; use vault hero for “ownership / destination” in **large landing sans**.

---

## 6) Data flow — “Verify once. Trusted everywhere.”

1. **Upload (screen):** user provides **government ID** as base64 (`dokimos_stored_image` in `localStorage`).
2. **Liveness (screen):** **selfie** JPEG data URL stored as `dokimos_live_photo` (cleared after successful verify).
3. **TEE path:** Next `POST /api/verify` → Fastify **`POST /verify`**: Tesseract OCR → parsed **attributes** (name, DOB, age flags, document metadata, etc.) → optional **face match** (ID crop vs selfie) → **`buildSignedAttestationResponse`** produces **Ethereum `signMessage`** over the canonical **message** string, plus **mock Intel TDX** fields and **Eigen** metadata (`appId`, `verificationUrl`).
4. **Stored ID (optional):** if session email present, encrypted ID image may be stored server-side → **`encryptedIdStored`** → client sets **`dokimos_has_encrypted_id`** → enables **re-verify** without re-upload.
5. **Reuse elsewhere (story):** the **same attestation object** (message + signature + signer + optional Eigen/TEE metadata) is what integrators would verify via **`POST /api/verify-attestation`** or public Eigen dashboard links; **selective disclosure** for third parties is modeled by **verification requests** (`workflow`, `requestedAttributes`) and **approve-request** re-OCR path.

---

### Revision note

When product copy changes, grep **`DokimosFlow`**, **`Screen02UploadOrCapture`**, **`DokimosLanding`**, **`PostVerificationModal`**, **`ExplainerModal`**, **`VaultHomepage`** for string updates.
