import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workflowId, agentId } = body;

    if (!userId || !workflowId || !agentId) {
      return NextResponse.json(
        { error: "userId, workflowId, and agentId are required" },
        { status: 400 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/agent-verify`,
      { userId, workflowId, agentId },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("Agent verify request failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Request failed. Please try again."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
