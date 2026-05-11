# Demo screenshots (manual capture)

PNG exports go here. Follow the numbered tables in **`../demo-script-source-kit.md`** §1 (consumer) and **`../demo-business-verifier-source-kit.md`** §1 (business + integration).

**Quick setup**

1. Repo root: `npm run dev` (Fastify, port 8080).
2. `dokimos-app-v2`: `npm run dev` (Next, port 8081).
3. Copy `.env.example` → `.env.local` and set `TEE_ENDPOINT=http://localhost:8080`.

**Suggested filenames**

- `01-landing.png` … `12-business.png` as listed in the source kit.

**Pencil / `.pen` designs**

If you use the Pencil app MCP: open `pencil-new.pen` in the editor, then `export_nodes` or `get_screenshot` can target specific frames. Designs may differ slightly from production v2.
