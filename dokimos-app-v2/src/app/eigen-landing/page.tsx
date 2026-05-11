import type { Metadata } from "next";
import { EigenLabsStyleLanding } from "@/components/landing/EigenLabsStyleLanding";

export const metadata: Metadata = {
  title: "Dokimos — Verification that fits this moment",
  description:
    "Identity verification with selective disclosure and cryptographic attestations. Same bold Eigen Labs–inspired marketing surface.",
};

export default function EigenLandingPage() {
  return <EigenLabsStyleLanding />;
}
