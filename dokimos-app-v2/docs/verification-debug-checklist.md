# Verification debug checklist

Use this when verification fails in dev or staging. For the end-to-end pipeline, read **[VERIFICATION_FLOW.md](./VERIFICATION_FLOW.md)** first.

## Environment

- [ ] Root TEE: `MNEMONIC` set in `.env` (repo root).
- [ ] Next.js: `dokimos-app-v2/.env.local` has `TEE_ENDPOINT` pointing at a running TEE (or unset in dev to use `http://localhost:8080`).
- [ ] No spaces around `=` in `.env` lines.
- [ ] `curl ${TEE_ENDPOINT}/health` returns JSON with ok status.

## Local processes

- [ ] Fastify TEE running (repo root, default port **8080**).
- [ ] Next.js dev server: `npm run dev` from `dokimos-app-v2/` (port **8081**).

## Quick API checks

- [ ] `GET http://localhost:8081/api/health` — `tee.ok` should be true when TEE is up.
- [ ] Browser Network tab: failed `POST /api/verify` shows JSON `error` + `code` (not a generic message only).

## Notes

- OCR and face match can take **up to ~1–2 minutes**; keep `VERIFY_AXIOS_TIMEOUT_MS` high enough or requests will time out client-side.
