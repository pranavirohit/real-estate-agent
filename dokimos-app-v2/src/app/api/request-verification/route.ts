import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verifierId, userEmail, requestedAttributes, workflow } = body;

    if (!verifierId || !userEmail || !requestedAttributes) {
      return NextResponse.json(
        { error: "verifierId, userEmail, and requestedAttributes are required" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/request-verification`,
      { verifierId, userEmail, requestedAttributes, workflow },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Request verification failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Request failed. Please try again."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
