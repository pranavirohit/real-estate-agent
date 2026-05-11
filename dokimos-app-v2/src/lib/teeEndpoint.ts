/**
 * Resolved base URL for the Fastify / TEE API (verify, auth, requests, etc.).
 *
 * - Override with `TEE_ENDPOINT` in `.env.local` (no spaces around `=`).
 * - **Development** default (unset): `http://localhost:8080`.
 * - **Production:** `TEE_ENDPOINT` must be set explicitly to a valid `http:` or `https:` URL.
 */

const DEFAULT_TEE_DEVELOPMENT = "http://localhost:8080";

let loggedResolvedEndpoint = false;

function validateTeeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `TEE_ENDPOINT must be a valid absolute URL (got: ${JSON.stringify(url)})`
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `TEE_ENDPOINT must use http or https (got protocol ${parsed.protocol})`
    );
  }
}

/** @deprecated Use getTeeEndpoint(); kept for README / docs that reference a single string. */
export const DEFAULT_TEE_ENDPOINT = DEFAULT_TEE_DEVELOPMENT;

export function getTeeEndpoint(): string {
  const fromEnv = process.env.TEE_ENDPOINT?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!fromEnv) {
      throw new Error(
        "TEE_ENDPOINT is required in production (set it in your deployment environment)."
      );
    }
    validateTeeUrl(fromEnv);
    return fromEnv.replace(/\/$/, "");
  }

  const resolved = fromEnv || DEFAULT_TEE_DEVELOPMENT;
  validateTeeUrl(resolved);

  if (process.env.NODE_ENV === "development" && !loggedResolvedEndpoint) {
    loggedResolvedEndpoint = true;
    console.log(
      "[dokimos] TEE_ENDPOINT:",
      resolved,
      fromEnv ? "(from env)" : "(default for development)"
    );
  }

  return resolved.replace(/\/$/, "");
}
