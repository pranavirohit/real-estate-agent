/**
 * Browser agent on a Dedalus Machine.
 *
 * Closes the "live listings" data gap: instead of a single rentals API, this drives
 * a real headless browser (Playwright + Chromium) running on a persistent Dedalus
 * Machine, renders a live rentals search page, and uses the Dedalus Models API to
 * turn the rendered page into structured RentalListing objects.
 *
 * Why a Machine: scraping needs a real browser (JS-rendered pages, scrolling) and a
 * stable residential-ish runtime — not something you want inside a stateless MCP
 * request. The Machine is provisioned ONCE (see provision-machine.ts), then woken,
 * used, and put back to sleep per search so it costs ~nothing while idle.
 *
 * This path is OPT-IN and best-effort: searchRentals() always falls back to the
 * Zillow API / demo listings if it is disabled or fails, so nothing ever breaks.
 */

import type { RentalListing, SearchParams } from "./listings.js";
import {
  getMachine,
  runAndWait,
  sleepMachine,
  wakeMachine,
  waitForRunning,
} from "./dedalusMachine.js";

const AGENT_DIR = "/root/agent";
const MODELS_BASE = "https://api.dedaluslabs.ai/v1";

export function isBrowserAgentEnabled(): boolean {
  const flag = process.env.RENTALS_BROWSER_AGENT?.trim().toLowerCase();
  const on = flag === "1" || flag === "true" || flag === "yes";
  return on && Boolean(process.env.DEDALUS_API_KEY?.trim());
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Best-effort live search URL. Override with RENTALS_TARGET_URL to point at any
 * rentals site/search you prefer; the agent extracts from whatever renders.
 */
function buildTargetUrl(params: SearchParams): string {
  const override = process.env.RENTALS_TARGET_URL?.trim();
  if (override) return override;
  const area = slugify(params.neighborhood ? `${params.neighborhood} ${params.location}` : params.location);
  const beds = Math.max(1, Math.floor(params.beds || 1));
  const price = Math.max(0, Math.floor(params.maxPrice || 0));
  const priceSeg = price > 0 ? `-under-${price}` : "";
  return `https://www.apartments.com/${area}/${beds}-bedrooms${priceSeg}/`;
}

/**
 * The script that runs INSIDE the Dedalus Machine. Plain ESM, no template literals
 * (to keep this host-side string simple). Reads config from env, renders the page
 * with Playwright, then asks the Dedalus Models API to structure the listings.
 */
const MACHINE_SCRIPT = [
  'import { chromium } from "playwright";',
  '',
  'const url = process.env.TARGET_URL;',
  'const query = JSON.parse(process.env.NOSTOS_QUERY || "{}");',
  'const apiKey = process.env.DEDALUS_API_KEY;',
  'const model = process.env.NOSTOS_MODEL || "openai/gpt-4o-mini";',
  '',
  'function done(obj) { process.stdout.write(JSON.stringify(obj)); }',
  '',
  'async function main() {',
  '  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });',
  '  try {',
  '    const page = await browser.newPage({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" });',
  '    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });',
  '    try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch (e) {}',
  '    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 2400); await page.waitForTimeout(800); }',
  '',
  '    const links = await page.$$eval("a[href]", (els) =>',
  '      els.map((a) => ({ text: (a.textContent || "").trim().slice(0, 160), href: a.href }))',
  '         .filter((l) => l.text.length > 0).slice(0, 400)',
  '    );',
  '    const bodyText = (await page.evaluate(() => document.body ? document.body.innerText : "")).slice(0, 14000);',
  '',
  '    const sys = "You extract rental apartment listings from rendered web pages. Return ONLY JSON.";',
  '    const instr = "From the page text and links below, extract up to 8 rental listings that match: " +',
  '      JSON.stringify(query) + ". Respond with a JSON object {\\"listings\\":[{\\"address\\":string,\\"price\\":string,\\"beds\\":number,\\"baths\\":number,\\"sqft\\":number,\\"url\\":string,\\"imageUrl\\":string}]}. " +',
  '      "Use a listing detail URL from the links when possible. Prices like \\"$2,800/mo\\". If unsure use 0 or empty string. No commentary.\\n\\nPAGE TEXT:\\n" +',
  '      bodyText + "\\n\\nLINKS:\\n" + JSON.stringify(links).slice(0, 6000);',
  '',
  '    const resp = await fetch("' + MODELS_BASE + '/chat/completions", {',
  '      method: "POST",',
  '      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },',
  '      body: JSON.stringify({',
  '        model,',
  '        messages: [{ role: "system", content: sys }, { role: "user", content: instr }],',
  '        response_format: { type: "json_object" },',
  '        temperature: 0,',
  '      }),',
  '    });',
  '    if (!resp.ok) { done({ listings: [], error: "models HTTP " + resp.status + ": " + (await resp.text()).slice(0, 200) }); return; }',
  '    const data = await resp.json();',
  '    const content = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";',
  '    let parsed = {};',
  '    try { parsed = JSON.parse(content); } catch (e) { done({ listings: [], error: "bad model json" }); return; }',
  '    const listings = Array.isArray(parsed.listings) ? parsed.listings : [];',
  '    done({ listings: listings.slice(0, 8) });',
  '  } catch (e) {',
  '    done({ listings: [], error: String(e && e.message ? e.message : e) });',
  '  } finally {',
  '    await browser.close().catch(() => {});',
  '  }',
  '}',
  'main();',
].join("\n");

interface RawAgentListing {
  address?: unknown;
  price?: unknown;
  beds?: unknown;
  baths?: unknown;
  sqft?: unknown;
  url?: unknown;
  imageUrl?: unknown;
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalize(raw: RawAgentListing[], target: string): RentalListing[] {
  return raw
    .map((r, i): RentalListing => ({
      id: `browser-${i}`,
      address: toStr(r.address) || "Address unavailable",
      price: toStr(r.price) || "Rent N/A",
      beds: toNum(r.beds),
      baths: toNum(r.baths),
      sqft: toNum(r.sqft),
      imageUrl: toStr(r.imageUrl),
      url: toStr(r.url) || target,
    }))
    .filter((l) => l.address !== "Address unavailable");
}

export interface BrowserAgentResult {
  listings: RentalListing[];
  machineId: string;
  targetUrl: string;
}

/**
 * Run the browser agent on a (pre-provisioned) Dedalus Machine. Requires
 * DEDALUS_MACHINE_ID (run `npm run provision` once to create it). Wakes the
 * machine, runs the scrape+extract, then puts it back to sleep.
 */
export async function scrapeRentalsViaBrowser(params: SearchParams): Promise<BrowserAgentResult> {
  const machineId = process.env.DEDALUS_MACHINE_ID?.trim();
  if (!machineId) {
    throw new Error(
      "DEDALUS_MACHINE_ID not set — provision a machine first with `npm run provision`."
    );
  }

  const targetUrl = buildTargetUrl(params);
  const scriptB64 = Buffer.from(MACHINE_SCRIPT, "utf8").toString("base64");

  await wakeMachine(machineId).catch(() => {});
  await waitForRunning(machineId, 120_000);

  try {
    const result = await runAndWait(
      machineId,
      [
        "/bin/bash",
        "-c",
        // Decode the script, then run it from the agent dir so `playwright` resolves.
        'echo "$NOSTOS_SCRIPT_B64" | base64 -d > /tmp/scrape.mjs && node /tmp/scrape.mjs',
      ],
      {
        cwd: AGENT_DIR,
        timeoutMs: 180_000,
        env: {
          NOSTOS_SCRIPT_B64: scriptB64,
          TARGET_URL: targetUrl,
          NOSTOS_QUERY: JSON.stringify(params),
          DEDALUS_API_KEY: process.env.DEDALUS_API_KEY ?? "",
          NOSTOS_MODEL: process.env.NOSTOS_BROWSER_MODEL?.trim() || "openai/gpt-4o-mini",
        },
      }
    );

    if (result.status !== "succeeded") {
      throw new Error(
        `Browser agent execution ${result.status}: ${result.stderr.slice(0, 300) || "no stderr"}`
      );
    }

    const stdout = result.stdout.trim();
    const jsonStart = stdout.indexOf("{");
    if (jsonStart === -1) throw new Error("Browser agent produced no JSON output");
    const parsed = JSON.parse(stdout.slice(jsonStart)) as {
      listings?: RawAgentListing[];
      error?: string;
    };
    if (parsed.error && (!parsed.listings || parsed.listings.length === 0)) {
      throw new Error(`Browser agent error: ${parsed.error}`);
    }

    return {
      listings: normalize(parsed.listings ?? [], targetUrl),
      machineId,
      targetUrl,
    };
  } finally {
    // Best-effort: let the machine sleep so idle cost is ~zero.
    await sleepMachine(machineId).catch(() => {});
  }
}

/** Light reachability check used by tooling/diagnostics. */
export async function browserAgentMachineReachable(): Promise<boolean> {
  const machineId = process.env.DEDALUS_MACHINE_ID?.trim();
  if (!machineId) return false;
  try {
    await getMachine(machineId);
    return true;
  } catch {
    return false;
  }
}
