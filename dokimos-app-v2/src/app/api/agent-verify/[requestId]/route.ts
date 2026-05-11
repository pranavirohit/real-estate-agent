import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function GET(
  _request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.get(
      `${TEE_ENDPOINT}/api/agent-verify/${encodeURIComponent(requestId)}`,
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Agent verify poll failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Failed to fetch verification status."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
