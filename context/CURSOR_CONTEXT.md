# Cursor Context: EigenCloud Private Preview — Dokimos Real Estate Agent

## READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.

---

## 1. WHO YOU ARE BUILDING FOR

This is a submission for the **EigenCloud Private Preview Program** — an invite-only program run by Eigen Labs. The final deliverable is a live demo on **Demo Day**. There are cash prizes. The judges are Eigen Labs engineers who know this infrastructure deeply. They will look at the code.

The project is called **Dokimos**. It is being extended to include a **real estate agent** that uses Dokimos as its identity layer.

---

## 2. WHAT EIGENCLOUD / EIGENCOMPUTE ACTUALLY IS

This is critical context. Do not guess. Do not hallucinate EigenCloud behavior. Here is exactly how it works:

**EigenCompute** is a verifiable offchain compute service. Developers deploy containerized apps (Docker images) that run inside **Intel TDX Trusted Execution Environments (TEEs)**.

When you deploy to EigenCompute, your application gets:

- **Hardware-isolated execution**: The app runs inside Intel TDX — a secure enclave with encrypted memory. Nobody, including EigenLabs and the cloud provider, can read memory contents at runtime.
- **A dedicated TEE wallet**: Each application receives a unique Ethereum wallet. The private key is derived deterministically from the app's ID via a KMS (Key Management System). Only that specific app, running the verified Docker image inside the enclave, can access the private key. This wallet is available inside the container as the `MNEMONIC` environment variable.
- **Cryptographic attestation**: The TEE generates a cryptographic proof of the exact Docker image (by digest) running inside. This proof includes: the code measurement (mrenclave), the signing key (mrsigner), a timestamp, and a signature from the TEE wallet.
- **Onchain deployment record**: Every deployment is permanently recorded onchain by its Docker digest. This creates an immutable audit trail.
- **Verifiability Dashboard**: EigenCloud provides a public dashboard at `verify-sepolia.eigencloud.xyz` where anyone can verify: the platform is Intel TDX, the wallet is derived from the TEE, the container hash matches the source, and the build is reproducible.

**What this means for Dokimos specifically:**
- The Dokimos TEE backend processes identity documents (currently mocked OCR/facial recognition)
- All processing happens inside sealed hardware — raw documents never leave the TEE
- The TEE wallet signs every attestation: `keccak256(attributes) + timestamp → signature`
- The signature is verifiable on Etherscan independently of Dokimos
- The wallet address is verifiable on the EigenCloud dashboard as belonging to this specific deployment
- The source code is public on GitHub and anyone can verify the hashing logic

**Current limitations (be honest about these, never overclaim):**
- Per-transaction TDX attestation quotes are not yet exposed by EigenCompute API — this is a pending platform feature
- The `tee.quote`, `tee.mrenclave`, `tee.mrsigner` fields in API responses are currently mocked due to platform limitations
- Infrastructure-level TDX is verifiable via the dashboard but per-transaction cryptographic proof is not yet available
- This is Mainnet Alpha — no SLA, not recommended for real customer funds

---

## 3. WHAT DOKIMOS IS

**Tagline:** "Verify once. Trusted everywhere."

**Core problem:** Every time a user interacts with a service that requires identity verification (banks, rental applications, age-gated purchases, freelance platforms), they upload their ID from scratch. The company stores a copy. The user has no control. This happens repeatedly, exposing sensitive documents to dozens of companies.

**What Dokimos does:**
1. User uploads their ID **once** to Dokimos
2. The ID is processed inside an Intel TDX TEE — OCR extracts attributes, face matching confirms liveness
3. The raw document never leaves the TEE. What comes out is a **cryptographically signed attestation** of specific attributes: `{ name, ageOver18, ageOver21, address, documentValid, faceMatched }`
4. The attestation is signed with the TEE wallet — a wallet cryptographically bound to this specific deployed code
5. The user controls a vault of these proofs and can approve or deny requests from companies
6. Companies receive only the specific attributes they need, never the raw document
7. Companies can **independently verify** the attestation without trusting Dokimos — using Etherscan (signature check) and the EigenCloud dashboard (hardware + wallet + build verification)

**The privacy architecture (important):**
- Attributes are hashed with keccak256 BEFORE signing: `keccak256(attributes) → hash → sign(hash)`
- This means only the hash is public on Etherscan — not the raw attributes
- Raw attributes stay private; only the requesting company receives them
- The company can verify the attributes they received match the signed hash
- This is selective disclosure / zero-knowledge-style privacy

**Two-sided product:**
- **User side**: Upload ID, get vault, approve/deny verification requests from companies
- **Verifier/Business side**: Create verification workflows (what attributes they need), send requests to users, receive attestations, verify independently

---

## 4. EXISTING CODEBASE STRUCTURE

The repository is at: `github.com/pranavirohit/real-estate-agent` (private)

This is a copy of the original Dokimos repo with the following structure:

```
/
├── src/
│   └── index.ts          # TypeScript/Fastify TEE backend — all API endpoints live here
├── Dockerfile            # linux/amd64 (EigenCompute); CMD uses npx tsx
├── package.json          # Backend package (`dokimos-tee-backend`)
│
└── dokimos-app-v2/       # Next.js 14 App Router frontend
    ├── src/
    │   ├── app/          # App Router pages
    │   └── components/   # Shadcn UI components
    ├── package.json
    └── tsconfig.json
```

**Tech stack:**
- Backend: TypeScript, Fastify, ethers.js
- Frontend: Next.js 14 App Router, Shadcn UI, Tailwind CSS, Framer Motion
- Fonts: Instrument Serif (emotional headlines) + Geist (body)
- Runtime: `npx tsx` (NOT `ts-node` — ESM module resolution requires tsx)
- Deployment: EigenCompute (backend via Docker), Vercel (frontend)

**Deployed infrastructure:**
- App ID: `0x00658E70d8880910277592b3B41F9dD3FE4Ce5Fd`
- TEE wallet: `0x4e1b03a5678c52075a7271afcf4c44e26f64ef35`
- Verifiability dashboard: `verify-sepolia.eigencloud.xyz/app/0x00658E70d8880910277592b3B41F9dD3FE4Ce5Fd`
- Docker Hub: `navi3206/dokimos-tee:latest`

**Critical runtime note:**
- Use `npx tsx` to run TypeScript, NOT `npx ts-node`
- The Dockerfile CMD should be: `CMD ["npx", "tsx", "src/index.ts"]`
- To update an existing deployed app use: `ecloud compute app upgrade` NOT `ecloud compute app deploy` (deploy creates a new instance)

---

## 5. EXISTING API ENDPOINTS (dokimos-tee)

These endpoints already exist. DO NOT modify them unless explicitly instructed.

```
POST /verify
  Body: { imageBase64, livePhotoBase64?, requestedAttributes?, userId? }
  Returns: signed attestation payload (attributes, message, signature, signer, tee, eigen, …)

POST /api/request-verification
  Body: { verifierId, userEmail, requestedAttributes[], workflow? }
  Returns: VerificationRequest

GET /api/requests/user/:userEmail
  Returns: pending and completed requests for the user

GET /api/requests/verifier/:verifierId
  Returns: requests for the verifier

POST /api/approve-request
  Body: { requestId, approved, imageBase64? } — imageBase64 required when approved is true

POST /api/agent-verify
  Body: { userId (email), workflowId, agentId }
  Returns: { requestId, status: "pending" }

GET /api/agent-verify/:requestId
  Returns: { status, attestation | null }

POST /api/rental-application
  Body: { listingId, userId (email), attestationRequestId, listingAddress }
  Returns: { applicationId, status: "submitted", attestation }

GET /api/rental-applications
  Returns: array of submitted rental applications

POST /api/verify-attestation
  Body: attestation payload — server-side validation helpers

GET /health
  Returns: { status: "ok" }
```

**Data storage:** All data (verification requests, attestations, workflows) is stored **in-memory** as arrays/maps. There is no database. This is intentional for the demo. Do not add a database.

---

## 6. WHAT WE ARE BUILDING NOW — THE REAL ESTATE AGENT EXTENSION

### The Core Idea

A real estate agent (LLM-powered) that helps users find NYC apartments and handles the identity verification layer automatically when it's time to apply. Instead of emailing a passport to a broker, the agent calls Dokimos, gets a cryptographic attestation, and submits it with the application.

### Why This Matters for Demo Day

The Demo Day judges are asking: "If we rebuilt this on AWS, would the value prop fall apart?"

Answer: Yes. The attestation is only meaningful because it comes from hardware nobody controls. The broker can verify the applicant's identity without calling Dokimos, without trusting a privacy policy, and without the user ever exposing their raw documents. That is only possible with EigenCompute.

### The Full User Flow

```
1. User opens the real estate agent chat interface
2. User types: "Find me a 2BR in Brooklyn under $3,000, pet friendly"
3. Agent responds with 3 mock listings
4. User selects a listing and says: "Apply to this one"
5. Agent responds: "I need to verify your identity before submitting.
   Requesting credentials from Dokimos now..."
6. Agent calls POST /api/agent-verify on the Dokimos TEE backend
   with { userId, workflowId: "rental_application" }
7. User receives a notification on the Dokimos user app
8. User opens Dokimos, sees: "Real Estate Agent is requesting:
   Full Name, Age Over 18, Address"
9. User taps Approve
10. Agent receives the cryptographic attestation back
11. Agent "submits" the rental application with attestation attached
12. Agent displays: "Application submitted to [listing]. 
    Verification receipt: [attestation details]"
13. Landlord/broker opens their verification dashboard
14. Landlord sees the submitted application with attestation
15. Landlord clicks "Verify Independently" 
16. The 5-step verification flow runs (already built):
    - Signature on Etherscan ✓
    - Intel TDX hardware on EigenCloud dashboard ✓
    - Wallet belongs to TEE ✓
    - Source code public on GitHub ✓
    - Reproducible build ✓
```

### What Needs to Be Built

**New backend endpoints (add to dokimos-tee/src/index.ts):**

```
POST /api/agent-verify
  Purpose: Called by the agent (not a user) to request identity credentials
  Body: { userId: string, workflowId: string, agentId: string }
  Returns: { requestId: string, status: "pending" }
  Behavior: Creates a verification request, same as /api/request-verification
  but designed for programmatic agent calls

GET /api/agent-verify/:requestId
  Purpose: Agent polls this to check if user has approved
  Returns: { 
    status: "pending" | "approved" | "denied",
    attestation: AttestationObject | null  // null if still pending
  }

POST /api/rental-application
  Purpose: Agent submits the completed rental application with attestation
  Body: { 
    listingId: string,
    userId: string, 
    attestationRequestId: string,
    listingAddress: string
  }
  Returns: { applicationId: string, status: "submitted", attestation }
```

**New workflow (add to existing in-memory workflows):**
```typescript
{
  id: "rental_application",
  name: "Rental Application Verification",
  company: "Real Estate Agent",
  requestedAttributes: ["name", "ageOver18", "address", "documentValid"],
  description: "Verify identity for rental application submission"
}
```

**New frontend: Agent Chat Interface**

A new page at `/agent` in dokimos-app-v2. This is a chat UI where:
- User types apartment search criteria
- Agent responds with mock listings (hardcode 3-4 real-sounding NYC listings)
- User selects a listing
- Agent triggers the Dokimos verification flow
- Agent polls for approval
- Agent confirms submission with attestation receipt

**Mock listings to hardcode (use these exactly):**
```
1. 142 Wythe Ave, Apt 3B — Williamsburg, Brooklyn
   $2,800/mo | 2BR 1BA | Pet friendly | Available June 1
   
2. 67 Nostrand Ave, Apt 2F — Bedford-Stuyvesant, Brooklyn  
   $2,650/mo | 2BR 1BA | Pet friendly | Available May 15

3. 234 Flatbush Ave, Apt 4A — Park Slope, Brooklyn
   $2,950/mo | 2BR 2BA | Cats only | Available June 15
```

**New frontend: Landlord/Broker View**

A new page at `/landlord` in dokimos-app-v2. This shows:
- A table of submitted applications
- Each row: applicant name, listing address, status, timestamp
- Click a row → see full application details including attestation
- "Verify Independently" button → triggers the existing 5-step verification flow

---

## 7. WHAT NOT TO BUILD

- **No real apartment search API** — hardcode the 3 listings above
- **No actual broker integrations** — the landlord dashboard is a demo view
- **No payment processing** — x402 micropayments are out of scope
- **No user authentication changes** — use whatever auth already exists
- **No database** — keep everything in-memory
- **No new npm packages** without asking first
- **Do not modify** existing `/verify`, `/api/request-verification`, `/api/approve-verification` endpoints
- **Do not modify** the existing 5-step verification flow UI
- **Do not modify** the existing verifier dashboard workflows
- **Do not redeploy** the TEE backend unless explicitly asked — use the existing deployment

---

## 8. DESIGN SYSTEM (for any new UI)

All new UI must match the existing Dokimos design system exactly:

**Colors:**
- `#0F1B4C` — deep navy (primary dark)
- `#4338CA` — indigo (gradient)
- `#4F46E5` — primary purple (CTAs, links)
- `#111827` — near black (headline text)
- `#6B7280`, `#9CA3AF` — gray (supporting text)
- White `#FFFFFF` — backgrounds, button text

**Typography:**
- Headlines: Instrument Serif
- Body, labels, UI: Geist
- No other fonts

**Components:** Use Shadcn UI components. Follow the same patterns as existing components in `dokimos-app-v2/src/components/`.

**Tone:** Consumer-friendly. No blockchain jargon in user-facing copy. No "attestation", "TEE", "enclave" in primary UI text — save those for the progressive disclosure/technical detail sections.

**No em dashes anywhere in copy.**

---

## 9. DEMO DAY EVALUATION CRITERIA

The judges will evaluate on four criteria. Every build decision should be optimized against these:

**1. "If we rebuilt on AWS, would the value prop fall apart?"**
The answer must be YES. The attestation signature comes from a hardware-locked key that nobody — not Dokimos, not EigenLabs, not AWS — can replicate. This is the core argument. Never let this get diluted.

**2. Meaningful use of EigenCompute features:**
- Source code verifiability ✅ (already built — verifiable build flow)
- Attestations ✅ (already built — 5-step verification)
- Encrypted memory ✅ (TEE processes documents, nothing leaves raw)
- Agent commerce ⬜ (out of scope for now)
- Programmatic payouts ⬜ (out of scope for now)

**3. Trust properties legible to users:**
The 5-step verification flow is the key asset here. It walks a non-technical user through independently verifying the attestation. This must remain prominent and intact.

**4. Creativity:**
The real estate agent angle is the creative hook — an AI agent that handles the full rental application workflow, including trustless identity verification. Nobody has built this combination before.

---

## 10. HOW TO PROMPT CURSOR EFFECTIVELY FOR THIS BUILD

When given a task, follow this structure exactly:

1. **Read the relevant existing files first** — never assume you know what's there
2. **Identify the exact insertion points** — which file, which function, after which line
3. **Follow existing patterns** — if the codebase uses a pattern, use it
4. **One feature at a time** — don't build multiple features in one pass
5. **Name exact file paths** — never say "the backend" when you mean `dokimos-tee/src/index.ts`
6. **State what you will NOT change** — be explicit about what stays untouched
7. **End with a verification step** — describe exactly how to test that it worked

---

## 11. VERIFICATION CHECKLIST

After each build step, verify:

- [ ] Does the backend compile with `npx tsx src/index.ts`?
- [ ] Do existing endpoints still return the same responses?
- [ ] Does the new endpoint return the correct shape?
- [ ] Does the frontend build with `npm run build`?
- [ ] Does the new UI match the existing design system?
- [ ] Is all new copy free of blockchain/TEE jargon?
- [ ] Are there no new npm packages added without approval?

---

## 12. CURRENT STATUS

- [x] Dokimos TEE backend deployed on EigenCompute with Intel TDX
- [x] Dokimos user app (frontend) deployed on Vercel
- [x] 5-step independent verification flow built and working
- [x] Verifier dashboard with workflow creation built and working  
- [x] User vault with approve/deny request flow built and working
- [x] On-chain attestation signing with TEE wallet working
- [x] Real-estate-agent repo created as independent copy of dokimos
- [x] Agent chat interface (`/agent` in dokimos-app-v2)
- [x] POST /api/agent-verify endpoint
- [x] GET /api/agent-verify/:requestId polling endpoint
- [x] POST /api/rental-application endpoint
- [x] Landlord/broker view page (`/landlord`)
- [x] rental_application workflow (requested attributes resolved in agent-verify handler)

---

## 13. IMPORTANT GOTCHAS

- **`npx tsx` not `npx ts-node`** — this is required for ESM module resolution in this stack. If you write `ts-node` anywhere, it will break.
- **`ecloud compute app upgrade`** to update existing deployment, not `ecloud compute app deploy`
- **In-memory only** — no database, no file system persistence, no Redis
- **linux/amd64** in the Dockerfile — required for EigenCompute TEE compatibility
- **Do not expose the MNEMONIC** — the TEE wallet private key is injected as `process.env.MNEMONIC`. Never log it, never return it from an API, never include it in any response.
- **Hash before sign** — when creating attestations, always hash attributes with keccak256 before signing. Never sign raw attribute data. This is a privacy requirement — raw data would be visible on Etherscan otherwise.
- **Mock the OCR and facial recognition** — these are explicitly mocked in the demo. Do not attempt to implement real OCR or facial recognition. The value prop is the trust infrastructure, not the document parsing.
