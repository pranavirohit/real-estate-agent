# Security

This repository is a **demonstration / prototype**. Treat it as **unsafe for production** unless you complete the hardening steps below.

## Before making the repository public

1. **Never commit secrets**  
   Confirm tracked files contain no real mnemonics, API keys, OAuth client secrets, or `NEXTAUTH_SECRET` values:
   - `.env`, `.env.local`, and `*.pem` are listed in `.gitignore`.
   - Do not commit large chat/context exports (e.g. `dokimos_context_*.txt`); they often contain internal product discussion. That pattern is ignored in `.gitignore`.
   - Run `git ls-files` and search for accidental check-ins of env files or keys.

2. **Rotate anything that was ever exposed**  
   If a test mnemonic, Google OAuth secret, or JWT secret was committed or shared, **rotate** it before any mainnet or real user data.

3. **Backend signing key (`MNEMONIC`)**  
   The Fastify server derives an Ethereum signer from `MNEMONIC`. Protect this like a hot wallet key. Use a dedicated key for demos, not a funded personal wallet.

## Implemented hardening (demo)

The Fastify backend (`src/index.ts`) and Next.js verifier app (`dokimos-app-v2`) include baseline controls suitable for a **demo**, not a full production launch:

- **Passwords:** bcrypt hashing (cost factor 10) for users and verifiers; OAuth placeholder passwords are stored as random hashes.
- **Sessions (verifier):** opaque server-side tokens in an **httpOnly** cookie (`dokimos_verifier_session`), validated against the API; not `localStorage`.
- **Input validation:** Zod on auth and verification routes; base64 image size and encoding checks (10MB cap).
- **Rate limiting:** global limit plus stricter limits on auth and expensive routes (`@fastify/rate-limit`).
- **CORS:** allowlist when `Origin` is present; non-browser clients (no `Origin`) are allowed so Next.js API routes can call the backend.
- **Errors:** generic messages in production (`NODE_ENV=production`); details only in development.
- **Headers (Next.js):** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP (see `next.config.js`).

## Demo limitations (by design)

| Area | Risk | Notes |
|------|------|--------|
| **In-memory store** | Data lost on restart; not a real database | Replace with PostgreSQL + Redis for sessions in production. |
| **Session tokens** | Stored in process memory on the API | Scale-out requires shared session store (Redis). |
| **TEE quotes** | Mock / demo | Not verifiable against Intel DCAP or Eigen AVS until wired to real infrastructure. |
| **CORS** | Allowlist via `CORS_ORIGINS` | Defaults to common localhost ports; set explicitly for deployment. |
| **`/health`** | Does not expose the signer address by default | Set `EXPOSE_SIGNER_ADDRESS=true` only if you intend to publish it. |
| **Dependencies** | `npm audit` may report issues in Next.js / transitive deps | Review advisories; major version bumps need regression testing. |

## Environment variables

See `.env.example` (root) and `dokimos-app-v2/.env.example` for variables including:

- **`CORS_ORIGINS`** — Comma-separated list of browser origins allowed to call the Fastify API (cross-origin). Defaults are localhost-only.
- **`DEBUG_OCR`** — Set to `true` only when debugging; logs OCR-derived content and **must not** be enabled in production (PII).
- **`EXPOSE_SIGNER_ADDRESS`** — Set to `true` to include the wallet address in `GET /health`.
- **`NEXTAUTH_SECRET`** — Required for production NextAuth deployments; generate with `openssl rand -base64 32`.
- **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — Required for real Google sign-in; development uses non-functional placeholders when unset.

## Reporting issues

If you discover a security vulnerability, please report it responsibly (e.g. private channel to maintainers) rather than a public issue, until it can be addressed.
