import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios from "axios";
import { authOptions } from "@/lib/authOptions";
import { logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json(
        { error: "Sign in required to re-verify from stored ID." },
        { status: 401 }
      );
    }

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/re-verify`,
      {
        userId: email,
        requestedAttributes: [],
      },
      {
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    logApiError("TEE re-verify failed", error);
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const msg =
      axios.isAxiosError(error) && error.response?.data?.error
        ? String(error.response.data.error)
        : "Re-verification failed.";
    return NextResponse.json(
      { error: msg },
      { status: status && status >= 400 && status < 600 ? status : 500 }
    );
  }
}
