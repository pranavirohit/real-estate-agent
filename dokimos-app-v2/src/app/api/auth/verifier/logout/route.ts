import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { getTeeEndpoint } from "@/lib/teeEndpoint";

const COOKIE_NAME = "dokimos_verifier_session";

export async function POST() {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (token) {
    const TEE_ENDPOINT = getTeeEndpoint();
    try {
      await axios.post(
        `${TEE_ENDPOINT}/api/auth/verifier/logout`,
        {},
        {
          timeout: 5000,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      /* session may already be invalid */
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
