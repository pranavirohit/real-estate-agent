import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, userId, attestationRequestId, listingAddress } = body;

    if (
      !listingId ||
      !userId ||
      !attestationRequestId ||
      !listingAddress
    ) {
      return NextResponse.json(
        {
          error:
            "listingId, userId, attestationRequestId, and listingAddress are required",
        },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/rental-application`,
      {
        listingId,
        userId,
        attestationRequestId,
        listingAddress,
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Rental application submit failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Could not submit application."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
