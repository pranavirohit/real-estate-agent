import type { Metadata } from "next";
import { DokimosLanding } from "@/components/landing/DokimosLanding";

export const metadata: Metadata = {
  title: "Dokimos — The last time you'll ever have to upload your ID",
  description:
    "Verify once in a protected environment. Approve selective disclosure per request. Cryptographic attestations with TEE-backed execution.",
};

export default function HomePage() {
  return <DokimosLanding />;
}
