import { NextRequest, NextResponse } from "next/server";
import {
  verifyDokimosAttestation,
  DEFAULT_EIGEN_APP_ID,
} from "@/lib/verifyAttestation";
import { logApiError } from "@/lib/safeLog";

/**
 * POST body: full attestation object (same shape as /verify or approve-request returns).
 * Optional query: ?expectedEigenAppId=0x... (defaults to demo app id).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const expectedParam = request.nextUrl.searchParams.get("expectedEigenAppId");
    const expectedEigenAppId =
      expectedParam ?? process.env.EIGEN_APP_ID ?? DEFAULT_EIGEN_APP_ID;

    const result = await verifyDokimosAttestation(body, {
      expectedEigenAppId,
    });

    const ok =
      result.signatureValid &&
      result.eigenAppIdMatchesExpected &&
      result.eigenMetadataPresent &&
      result.hashMatch !== false;

    return NextResponse.json({
      ok,
      ...result,
      expectedEigenAppId,
    });
  } catch (error: unknown) {
    logApiError("verify-attestation", error);
    return NextResponse.json(
      { error: "Invalid payload or verification failed." },
      { status: 400 }
    );
  }
}
