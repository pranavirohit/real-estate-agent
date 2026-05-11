import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

const COOKIE_NAME = "dokimos_verifier_session";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const TEE_ENDPOINT = getTeeEndpoint();

  try {
    const response = await axios.get(
      `${TEE_ENDPOINT}/api/auth/verifier/session`,
      {
        timeout: 10000,
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return NextResponse.json(response.data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
