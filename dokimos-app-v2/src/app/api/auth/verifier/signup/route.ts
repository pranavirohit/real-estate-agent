import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

const signupSchema = z.object({
  companyName: z.string().min(1).max(200),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const COOKIE_NAME = "dokimos_verifier_session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { companyName, email, password } = parsed.data;

    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.post(
      `${TEE_ENDPOINT}/api/auth/verifier/signup`,
      { companyName, email, password },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data as {
      sessionToken: string;
      verifierId: string;
      companyName: string;
      email: string;
    };

    const res = NextResponse.json({
      verifierId: data.verifierId,
      companyName: data.companyName,
      email: data.email,
    });

    res.cookies.set(COOKIE_NAME, data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error: unknown) {
    logApiError("Verifier signup failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Signup failed. Please try again."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
