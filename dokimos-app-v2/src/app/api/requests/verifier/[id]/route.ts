import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Verifier ID is required" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.get(
      `${TEE_ENDPOINT}/api/requests/verifier/${encodeURIComponent(id)}`,
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Get verifier requests failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Failed to fetch requests."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
