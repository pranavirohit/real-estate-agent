import { NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function GET() {
  try {
    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.get(`${TEE_ENDPOINT}/api/rental-applications`, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("List rental applications failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Failed to load applications."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
