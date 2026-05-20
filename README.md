# Nostos

Every time you apply for an apartment, you upload the same ID, the same pay stubs, the same documents to a portal you'll never use again. The landlord at the place on Crosby Street gets the same package as the one on Flatbush Avenue. Then you apply to the next place and do it all over. The friction is real, the re-verification is pointless, and sooner or later one of those portals gets breached. Nostos is built on a different premise: you tell an agent what you're looking for, it finds apartments, books tours, and sends calendar invites — and when you're ready to apply, your verified identity travels with you as a cryptographic credential. No re-uploading. No handing documents to strangers. No paper trail sitting in a database somewhere.

Nostos is a NYC rental search and application platform with a privacy-preserving identity layer powered by Dokimos. A conversational AI agent (Claude) helps renters find apartments, books tours around their schedule, and then prompts a single identity verification that covers every application in that search. Landlords see verified applicants, tour times, and a five-step verification path they can follow independently, without trusting Nostos or anyone else.

---

## How it works

The system has two sides: a renter who searches for apartments and builds a vault of verified credentials, and a landlord who receives verified rental applications without collecting sensitive documents. The identity verification itself happens inside a Trusted Execution Environment running on EigenCompute's Intel TDX hardware, where neither the renter nor the developer nor the landlord can see or alter the computation.

### The renter flow

The experience starts at `/nostos/find` as a chat. The agent — Claude Sonnet running through the Vercel AI Gateway — asks a short sequence of questions: where you commute, what kind of apartment you want, how much you're willing to spend, and when you're free to tour. It's a conversation, not a form. You answer however you'd naturally answer, and the agent figures out the structure.

Once it has enough to work with, the agent calls `searchListings` — a real tool call to a Zillow data API — and surfaces matching apartments. You pick the ones you want to see. The agent calls `scheduleTours`, parses your availability into concrete time slots, builds RFC 5545-compliant `.ics` calendar files for each tour, and sends them to you and the landlord via Resend. Both parties get a calendar invite with the address, tour time, and a Google Maps link. No back-and-forth over email.

When you're ready to apply, the agent hands off to the Dokimos identity vault. A verification request is created in the TEE backend and you're directed to open your vault in a separate tab to approve it. Inside the TEE, tesseract.js reads your government ID and extracts structured fields (name, date of birth, address, expiry date) while the TensorFlow.js WASM face matcher compares the ID photo to your selfie. Neither image leaves the enclave. What comes out is a signed attestation: extracted attributes (name, ageOver18, address, notExpired), a face match result, a timestamp, and an ECDSA signature over a keccak256 hash of those exact fields. The attestation comes back to the agent within seconds, and the application is submitted with that signed credential attached.

### The landlord flow

Landlords visit `/nostos/landlord` and see their properties alongside verified applicants. Every row is clickable. A verification modal opens showing exactly what the TEE verified — full name, age confirmation, address, document expiry — along with the timestamp and the cryptographic signature. The landlord gets a clear, auditable record of what was checked. They don't get the tenant's actual ID. They don't need it.

The dashboard polls for new applications every twelve seconds, so there's no manual refresh needed during a demo or a live screening session.

For landlords who want to verify the verification themselves, there's a five-step path: check the ECDSA signature against the signer wallet on Etherscan, inspect the TEE hardware record on the EigenCloud Verifiability Dashboard, confirm the wallet address is bound to this specific deployment, review the source code on GitHub, and verify the Docker build hash. None of those steps require trusting Nostos.

---

## Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser"]
        UI["Nostos chat UI\n/nostos/find"]
        LL["Landlord dashboard\n/nostos/landlord"]
        Vault["Dokimos vault\n(parallel tab)"]
    end

    subgraph BFF["Next.js BFF (dokimos-app-v2, :8081)"]
        Chat["/api/nostos/chat\nstreamText · maxSteps 8"]
        Tours["/api/schedule-tours\nICS gen · Resend"]
        AV["/api/agent-verify\ncreate + poll request"]
        RA["/api/rental-application\nsubmit with attestation"]
        RL["/api/rental-applications\nlist for landlord"]
        Listings["/api/listings\nZillow proxy"]
    end

    subgraph External["External services"]
        Gateway["Vercel AI Gateway\nClaude Sonnet 4.5"]
        Zillow["RapidAPI Zillow\n(optional; mocks if absent)"]
        Email["Resend\nemail + ICS delivery"]
    end

    subgraph TEE["TEE Boundary: EigenCompute (Intel TDX)"]
        OCR["tesseract.js\nID OCR"]
        Face["@tensorflow/tfjs-backend-wasm\nface match"]
        Sign["viem\nkeccak256 + ECDSA sign\nKMS-injected MNEMONIC"]
        Store["In-memory store\nusers · requests · applications"]
        AgentV["POST /api/agent-verify\nGET /api/agent-verify/:id"]
        RentalA["POST /api/rental-application\nGET /api/rental-applications"]
    end

    UI --> Chat
    UI --> AV
    LL --> RL
    Vault --> AV

    Chat -->|stream| Gateway
    Gateway -->|tool call| Chat
    Chat -->|searchListings| Listings
    Listings --> Zillow
    Chat -->|scheduleTours| Tours
    Tours --> Email

    AV -->|create request| AgentV
    AV -->|poll every 2.5s| AgentV
    Vault -->|approve| AgentV
    AgentV --> OCR
    OCR --> Face
    Face --> Sign
    Sign --> Store
    AgentV -->|attestation| AV
    AV -->|attestation| Chat

    Chat -->|submit application| RA
    RA --> RentalA
    RentalA --> Store

    RL --> RentalA
```

The TEE boundary is the key constraint: images go in, structured claims and a signature come out. The AI agent and the identity layer are separate; Claude never sees the ID.

---

## What's real vs. what's simulated

The AI agent is real. It calls Claude Sonnet via the Vercel AI Gateway, executes genuine tool calls, and streams responses back to the client. The tour scheduling emails are real: Resend delivers them and the RFC 5545-compliant `.ics` attachments land in both the renter's and landlord's calendars. The ECDSA signatures on attestations are real — generated by viem from a wallet derived from the KMS-injected `MNEMONIC` and independently verifiable on Etherscan. The OCR pipeline is real (tesseract.js running in-process) and the face matching is real (@tensorflow/tfjs-backend-wasm running descriptor-distance comparison against the face-api models).

The TEE quote fields in each attestation response (`mrenclave`, `tcbStatus`, and related Intel TDX fields) are structurally correct but contain simulated values. EigenCompute doesn't yet expose the hardware-generated quote to applications running inside the enclave, so the code generates a well-formed placeholder and documents this honestly in a `note` field on every attestation response. When the platform surface becomes available, replacing the simulated quote with a real one is the only code change needed.

All application state, user data, and verification requests live in-memory. The process forgets everything on restart. The three Brooklyn listings are hardcoded mock data; connecting a `RAPIDAPI_KEY` switches the agent to live Zillow results. The demo user accounts seeded in the backend are documented in [SECURITY.md](./SECURITY.md).

---

## Tech stack

- **Next.js 14 (App Router):** Frontend and BFF API routes; all TEE URLs and secrets stay server-side.
- **Claude Sonnet 4.5 via Vercel AI SDK** (`ai`, `@ai-sdk/openai`)**:** Powers the rental concierge agent using `streamText` with `maxSteps: 8` to control the agentic loop and wire tool calls back into the stream.
- **Fastify:** TEE backend API; handles all identity verification, signing, and application storage. Deployed to EigenCompute on port 8080.
- **EigenCompute (Intel TDX via EigenCloud):** Confidential compute platform. The Docker image is deployed to a TDX enclave; the KMS injects the signing mnemonic at runtime, bound to that exact image hash.
- **tesseract.js:** In-process OCR for extracting name, address, and expiry from uploaded ID documents inside the enclave.
- **@tensorflow/tfjs-backend-wasm + @vladmandic/face-api:** Face-descriptor comparison for liveness. WASM backend because `tfjs-node` fails to build on `linux/amd64` Alpine.
- **viem:** Ethereum ECDSA signing of attestation payloads; wallet derived from KMS-injected BIP-39 mnemonic.
- **NextAuth:** Google OAuth and demo credential login; sessions via httpOnly cookies.
- **Resend:** Sends tour confirmation emails with RFC 5545 `.ics` calendar attachments to renter and landlord.
- **node-canvas:** Native image processing dependency required by the TensorFlow.js face pipeline.
- **Docker (Node 22 Alpine, linux/amd64):** Backend containerization; Alpine chosen for size, with Cairo/Pango headers added for node-canvas.
- **Vercel:** Frontend deployment. `NOSTOS_PRIMARY_SITE=1` at build time makes `/` redirect to `/nostos`.

---

## Running locally

Two processes are required. Start them in separate terminals.

**Terminal 1 — TEE backend (repo root)**

```bash
npm install
npm run dev
```

Starts Fastify on **http://localhost:8080**. Copy `.env.example` to `.env` and fill in:

```bash
# Required: BIP-39 mnemonic for the attestation signing wallet (use any fresh mnemonic locally)
MNEMONIC=word1 word2 word3 ... word12
```

The `MNEMONIC`-derived wallet is only meaningful inside EigenCloud's hardware. Locally it produces valid ECDSA signatures that are not backed by a hardware attestation and won't match the production wallet on Etherscan.

**Terminal 2 — Next.js frontend (`dokimos-app-v2/`)**

```bash
cd dokimos-app-v2
npm install
npm run dev
```

Starts Next.js on **http://localhost:8081**. Copy `dokimos-app-v2/.env.example` to `dokimos-app-v2/.env.local`:

```bash
# Required
NEXTAUTH_SECRET=                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:8081
TEE_ENDPOINT=http://localhost:8080

# Optional — demo works without these, but with reduced functionality
GOOGLE_CLIENT_ID=                 # real Google sign-in
GOOGLE_CLIENT_SECRET=
AI_GATEWAY_API_KEY=               # Claude agent; chat will fail without this
RAPIDAPI_KEY=                     # live Zillow listings; falls back to 3 mock Brooklyn apartments
RESEND_API_KEY=                   # real tour emails; skipped if absent
```

Visit **http://localhost:8081/nostos** for the renter flow. The landlord dashboard is at **http://localhost:8081/nostos/landlord**.

**Docker (backend only)**

```bash
docker build --platform linux/amd64 -t nostos-tee .
docker run -p 8080:8080 --env-file .env nostos-tee
```

---

## Live deployment

- **App ID:** `0x00658E70d8880910277592b3B41F9dD3FE4Ce5Fd`
- **[EigenCloud Verifiability Dashboard](https://verify-sepolia.eigencloud.xyz/app/0x00658E70d8880910277592b3B41F9dD3FE4Ce5Fd):** Shows the onchain deployment record for this specific Docker image on this specific hardware, including the build hash and TEE measurement fields. This is the root of trust a landlord uses to confirm that an attestation came from the right code on the right hardware.
- **[Etherscan verified signatures](https://etherscan.io/verifiedSignatures?a=0x4E1B03A5678C52075A7271AfcF4c44e26f64ef35):** Every attestation signature produced by the KMS-bound wallet since deployment. Any party holding an attestation can reconstruct the keccak256 hash of the claims and independently confirm the signer matches this address.

---

## Repository layout

| Path | Role |
|------|------|
| `src/index.ts` | Fastify TEE backend: OCR, face match, signing, rental application records, in-memory state |
| `src/faceVerification.ts` | TensorFlow.js WASM face match pipeline |
| `dokimos-app-v2/src/app/nostos/` | Nostos product routes: renter landing, conversational search, landlord dashboard |
| `dokimos-app-v2/src/app/api/nostos/` | BFF routes: AI chat streaming, booking, tour scheduling |
| `dokimos-app-v2/src/app/onboarding/` | Identity verification flow: ID upload, liveness, vault |
| `dokimos-app-v2/src/app/app/` | User vault, request management, settings |
| `Dockerfile` | Production enclave image (linux/amd64, Alpine) |
| `dokimos-app-v2/docs/` | Demo scripts, PRD, verification flow documentation |
| `context/` | Build notes and EigenCloud integration reference |

---

## Security posture

This codebase is demo-grade. Before any production deployment: swap in-memory storage for a real database and session store, complete Intel DCAP quote verification once EigenCompute exposes hardware quote data, rotate demo credentials, and read [SECURITY.md](./SECURITY.md) in full.
