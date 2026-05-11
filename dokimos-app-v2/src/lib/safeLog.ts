import axios from "axios";

/** Log server-side errors without echoing upstream response bodies (may contain hints). */
export function logApiError(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : "unknown error";
  console.error(`${context}:`, msg);
}

const UNREACHABLE =
  "Cannot reach the verification server. Check network access to TEE_ENDPOINT (default: deployed EigenCloud). For a local Fastify instance, set TEE_ENDPOINT in dokimos-app-v2/.env.local (e.g. http://localhost:8080).";

/** Safe client response from an axios proxy error (does not log response bodies). */
export function axiosErrorResponse(
  error: unknown,
  fallback: string
): { message: string; status: number } {
  if (!axios.isAxiosError(error)) {
    return { message: fallback, status: 500 };
  }
  const code = error.code;
  if (!error.response && (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT")) {
    return { message: UNREACHABLE, status: 503 };
  }
  const status = error.response?.status ?? 500;
  const data = error.response?.data;
  if (data && typeof data === "object" && data !== null && "error" in data) {
    return { message: String((data as { error: unknown }).error), status };
  }
  return { message: fallback, status };
}
