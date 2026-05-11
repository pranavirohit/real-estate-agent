import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, approved, imageBase64 } = body;

    if (!requestId || approved === undefined) {
      return NextResponse.json(
        { error: "requestId and approved are required" },
        { status: 400 }
      );
    }

    if (approved && !imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required for approval" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/approve-request`,
      { requestId, approved, imageBase64 },
      {
        timeout: 60000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Approve request failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Request approval failed."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
