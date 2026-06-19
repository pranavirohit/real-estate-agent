# Nostos Rentals MCP

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes **structured NYC rental search** as tools any AI agent can call. Built to be hosted on the [Dedalus](https://dedaluslabs.ai) marketplace so the Nostos agent (and anyone else) can search apartments by slug instead of bundling the logic locally.

Unlike a generic web-search MCP, this returns clean, typed listing objects (id, address, price, beds, baths, image, url) — the exact shape an apartment agent needs to present cards and schedule tours.

## Tools

| Tool | Description |
| --- | --- |
| `search_rentals` | Search NYC rentals by `location`, `maxPrice`, `beds`, optional `minBaths`, `neighborhood`, `petFriendly`. Returns `{ listings[], source, note? }`. |
| `get_listing` | Fetch a single listing by `id` (as returned by `search_rentals`). |

Both tools return human-readable text **and** `structuredContent` for programmatic use.

## Data source

- With `RAPIDAPI_KEY` set, it queries live Zillow rental data (RapidAPI `zillow-property-data1`).
- Without a key (or on upstream failure), it returns built-in demo Brooklyn listings, so the tools always work for testing and demos.

## Run locally

```bash
cd nostos-rentals-mcp
npm install
cp .env.example .env   # optionally add RAPIDAPI_KEY
npm start              # Streamable HTTP MCP server on http://localhost:3333/mcp
```

Smoke test with curl (note the `Accept` header — Streamable HTTP requires it):

```bash
# health
curl -s http://localhost:3333/health

# list tools
curl -s -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# search
curl -s -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_rentals","arguments":{"location":"Brooklyn, NY","maxPrice":3000,"beds":2,"neighborhood":"Williamsburg"}}}'
```

Or inspect it visually:

```bash
npx @modelcontextprotocol/inspector
# then connect to http://localhost:3333/mcp (Streamable HTTP)
```

## Publish to the Dedalus marketplace

Dedalus deploys MCP servers straight from a GitHub repo and hosts them for you (no Dockerfiles or IAM). Once public, it shows up on the marketplace and is callable by slug.

1. Push this repo to GitHub (the `nostos-rentals-mcp/` folder is the server).
2. Go to the [Dedalus dashboard](https://dedaluslabs.ai/dashboard) and **connect your GitHub account**.
3. Open the [Marketplace](https://dedaluslabs.ai/marketplace) → **List a Server** (or **My Servers → Add Server**).
4. Select this repository. If prompted for the project root, point it at `nostos-rentals-mcp/`. The server listens on `process.env.PORT` and serves Streamable HTTP at `/mcp`.
5. Add `RAPIDAPI_KEY` as a deployment secret if you want live Zillow data (optional — it falls back to demo listings).
6. Set the server **visibility to Public** to feature it on the marketplace.

After deploy, verify it on the website:

- Open [dedaluslabs.ai/marketplace](https://dedaluslabs.ai/marketplace), filter **My servers**, and search for `nostos-rentals` — your server card should appear with its slug (e.g. `your-username/nostos-rentals`).

## Wire it into the Nostos agent

Once it has a marketplace slug, add it to the app's MCP env so the agent runs it server-side via Dedalus:

```
NOSTOS_MCP_SERVERS=your-username/nostos-rentals
```

(Same mechanism already used for `tsion/exa`.)
