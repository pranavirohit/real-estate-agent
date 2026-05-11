import { NextResponse } from "next/server";
import { checkTeeHealth } from "@/lib/checkTeeHealth";

/**
 * App + TEE connectivity. Does not fail the process if TEE is down — surfaces status in JSON.
 */
export async function GET() {
  let tee: { ok: boolean; status?: number; error?: string; body?: unknown };
  try {
    const r = await checkTeeHealth();
    if (r.ok) {
      tee = { ok: true, status: r.status, body: r.body };
    } else {
      tee = { ok: false, error: r.error, status: r.status };
    }
  } catch (e: unknown) {
    tee = {
      ok: false,
      error: e instanceof Error ? e.message : "Health check failed",
    };
  }

  return NextResponse.json({
    ok: true,
    next: true,
    tee,
  });
}
