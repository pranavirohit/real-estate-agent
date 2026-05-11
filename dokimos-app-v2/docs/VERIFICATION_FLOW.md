# Verification Flow

## Consumer path (user uploads ID)

1. User completes ID upload + selfie in `DokimosFlow`.
2. `Screen02VerifyProcessing` mounts.
3. Frontend: `POST /api/verify` with `{ imageBase64, livePhotoBase64, requestedAttributes }`.
4. Next.js BFF (`/api/verify/route.ts`):
   - Validates the body (Zod) and image size.
   - Optionally attaches session `userId` (email) for encrypted ID storage on the TEE.
   - Proxies to `${TEE_ENDPOINT}/verify` with a configurable timeout (default **120s** — OCR can be slow; override with `VERIFY_AXIOS_TIMEOUT_MS` if needed).
   - On transient network errors, retries **once** after a short delay.
5. TEE server (`src/index.ts` `POST /verify`):
   - Zod validation.
   - OCR via `extractAttributesFromDocument`.
   - Optional face matching when `livePhotoBase64` is present.
   - `buildSignedAttestationResponse` (signing — do not change crypto without review).
   - Optional encrypted ID storage when `userId` is set.
6. Response returns to the browser; on success, attestation is stored and the user continues to the vault.
7. On failure, structured JSON: `{ success: false, error, code, details? }` (details in development).

## Verifier path (checking an attestation)

- Separate flow using `/api/verify-attestation` and related UI (`VerifierDashboard`).
- Not part of consumer onboarding.

## Key environment variables

| Variable | Where | Notes |
|----------|--------|--------|
| `TEE_ENDPOINT` | Next.js (`dokimos-app-v2`) | **Required in production.** URL of the Fastify TEE (no trailing slash required). |
| `VERIFY_AXIOS_TIMEOUT_MS` | Next.js | Optional. Default `120000` (2 minutes). |
| `MNEMONIC` | Root TEE server | Required to sign attestations. |
| `PORT` | Root TEE server | Default `8080`. |

See also: [verification-debug-checklist.md](./verification-debug-checklist.md) and repo root `DEPLOYMENT.md`.
