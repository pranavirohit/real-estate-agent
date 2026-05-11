import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios, { type AxiosResponse } from "axios";
import { z } from "zod";
import { authOptions } from "@/lib/authOptions";
import { logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";
import type { VerifyErrorBody } from "@/types/api";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const verifyBodySchema = z.object({
  imageBase64: z.string().min(1),
  livePhotoBase64: z.string().optional(),
  requestedAttributes: z.array(z.string()).optional(),
});

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function verifyAxiosTimeoutMs(): number {
  const raw = process.env.VERIFY_AXIOS_TIMEOUT_MS?.trim();
  if (!raw) return 120_000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
}

function jsonVerifyError(
  status: number,
  error: string,
  code: string,
  details?: unknown
): NextResponse<VerifyErrorBody> {
  const body: VerifyErrorBody = {
    success: false,
    error,
    code,
    ...(isDev() && details !== undefined ? { details } : {}),
  };
  return NextResponse.json(body, { status });
}

function parseUpstreamData(data: unknown): {
  error: string;
  code: string;
  details?: unknown;
} {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const err = o.error;
    const code = o.code;
    return {
      error: typeof err === "string" && err.length > 0 ? err : "Upstream error",
      code:
        typeof code === "string" && code.length > 0 ? code : "UPSTREAM_ERROR",
      ...(isDev() && "details" in o ? { details: o.details } : {}),
    };
  }
  return { error: "Upstream error", code: "UPSTREAM_ERROR" };
}

function isRetryableNetworkError(err: {
  response?: unknown;
  code?: string;
}): boolean {
  if (err.response) return false;
  const c = err.code;
  return (
    c === "ECONNREFUSED" ||
    c === "ETIMEDOUT" ||
    c === "ENOTFOUND" ||
    c === "ECONNABORTED" ||
    c === "ECONNRESET" ||
    c === "EPIPE" ||
    c === "ERR_NETWORK"
  );
}

const UNREACHABLE_MSG_LOCAL =
  "Cannot reach the verification server (connection failed, timed out, or reset). Start the Fastify TEE from the repo root (`npm run dev`, default port 8080) and set `TEE_ENDPOINT=http://localhost:8080` in dokimos-app-v2/.env.local (or unset `TEE_ENDPOINT` in development), then restart Next.js.";

/** When axios has no HTTP response, tailor copy: local dev vs remote deployment URL. */
function teeUnreachableUserMessage(resolvedOrigin: string): string {
  let host = "";
  try {
    if (resolvedOrigin && resolvedOrigin !== "invalid") {
      host = new URL(resolvedOrigin).hostname.toLowerCase();
    }
  } catch {
    host = "";
  }
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1";
  if (isLocal) {
    return UNREACHABLE_MSG_LOCAL;
  }
  const origin = resolvedOrigin && resolvedOrigin !== "invalid" ? resolvedOrigin : "your configured TEE";
  return `Cannot reach the verification server at ${origin} (connection failed, timed out, or reset). This is usually a network or hosting issue: confirm the TEE process is running, the host and port are correct, and inbound traffic is allowed (firewall / security group). Test from your machine: open or curl ${origin}/health — it should respond if the deployment is reachable. Then ensure TEE_ENDPOINT in dokimos-app-v2/.env.local matches that deployment.`;
}

export async function POST(request: NextRequest) {
  let resolvedTeeOrigin = "";
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonVerifyError(400, "Invalid JSON body", "INVALID_JSON");
    }

    const parsed = verifyBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonVerifyError(
        400,
        "Invalid request body",
        "INVALID_INPUT",
        parsed.error.flatten()
      );
    }

    const { imageBase64, livePhotoBase64, requestedAttributes } = parsed.data;

    if (imageBase64.length > MAX_IMAGE_SIZE * 1.37) {
      return jsonVerifyError(
        400,
        "Image too large. Maximum size is 10MB",
        "PAYLOAD_TOO_LARGE"
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ?? undefined;

    const TEE_ENDPOINT = getTeeEndpoint();
    try {
      resolvedTeeOrigin = new URL(TEE_ENDPOINT).origin;
    } catch {
      resolvedTeeOrigin = "invalid";
    }

    const timeoutMs = verifyAxiosTimeoutMs();
    const url = `${TEE_ENDPOINT}/verify`;

    const payload = {
      imageBase64,
      ...(typeof livePhotoBase64 === "string" && livePhotoBase64.length > 0
        ? { livePhotoBase64 }
        : {}),
      requestedAttributes: requestedAttributes ?? [],
      ...(userId ? { userId } : {}),
    };

    const axiosConfig = {
      timeout: timeoutMs,
      headers: { "Content-Type": "application/json" as const },
      validateStatus: () => true,
    };

    let response: AxiosResponse<unknown>;
    try {
      response = await axios.post(url, payload, axiosConfig);
    } catch (first: unknown) {
      if (
        axios.isAxiosError(first) &&
        isRetryableNetworkError(first)
      ) {
        await new Promise((r) => setTimeout(r, 400));
        response = await axios.post(url, payload, axiosConfig);
      } else {
        throw first;
      }
    }

    if (response.status >= 200 && response.status < 300) {
      return NextResponse.json(response.data);
    }

    const { error, code, details } = parseUpstreamData(response.data);
    return jsonVerifyError(response.status, error, code, details);
  } catch (error: unknown) {
    logApiError("TEE verification failed", error);

    if (axios.isAxiosError(error)) {
      if (!error.response && isRetryableNetworkError(error)) {
        return jsonVerifyError(
          503,
          teeUnreachableUserMessage(resolvedTeeOrigin),
          "TEE_UNREACHABLE"
        );
      }
      if (error.response) {
        const { error: msg, code, details } = parseUpstreamData(
          error.response.data
        );
        return jsonVerifyError(error.response.status, msg, code, details);
      }
    }

    const message =
      error instanceof Error ? error.message : "Verification failed";
    return jsonVerifyError(500, message, "INTERNAL_ERROR");
  }
}
