import { getTeeEndpoint } from "@/lib/teeEndpoint";

export type TeeHealthResult =
  | { ok: true; status: number; body?: unknown }
  | { ok: false; error: string; status?: number };

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * GET `${TEE_ENDPOINT}/health` with timeout. Safe to call from API routes or startup hooks.
 */
export async function checkTeeHealth(options?: {
  timeoutMs?: number;
}): Promise<TeeHealthResult> {
  const base = getTeeEndpoint().replace(/\/$/, "");
  const url = `${base}/health`;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    let body: unknown;
    const text = await res.text();
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}`,
        status: res.status,
      };
    }
    return { ok: true, status: res.status, body };
  } catch (e: unknown) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? `Timed out after ${timeoutMs}ms`
          : e.message
        : "Unknown error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}
