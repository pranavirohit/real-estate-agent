# Dokimos App v2

This folder is the **canonical Next.js application** for Dokimos (App Router, Tailwind, consumer + verifier + integration surfaces).

**Start here for the full repository story:** [**`../README.md`**](../README.md) — architecture, two-process local setup, environment variables, demo docs, and security notes.

---

## Quick start

```bash
cd dokimos-app-v2
npm install
npm run dev
```

Dev server: **http://localhost:8081**

Run the **Fastify TEE API** from the **repository root** in a second terminal:

```bash
cd ..
npm run dev
```

Default backend URL: **http://localhost:8080**. Set `TEE_ENDPOINT` in **`.env.local`** (copy from `.env.example`) so this app’s `/api/*` routes reach your backend.

---

## Folder map

| Path | Role |
|------|------|
| `src/app/` | Routes: `/`, `/onboarding`, `/app/*`, `/business`, `/integration`, API routes under `src/app/api/`. |
| `src/components/` | UI: `DokimosFlow`, landing, verifier dashboard, shells, modals. |
| `src/lib/` | Auth options, attestation helpers, layout tokens, demo accounts. |
| `docs/` | Demo scripts, PRD, screenshot notes. |

---

## Further reading

- Consumer demo script: `docs/demo-script-source-kit.md`  
- Verifier / integration: `docs/demo-business-verifier-source-kit.md`  
- Product requirements (narrative): `docs/PRD.md`
