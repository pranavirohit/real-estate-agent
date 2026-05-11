import type { VerificationRequest } from "@/types/dokimos";

const V = {
  verifierId: "airbnb_prod",
  verifierName: "Airbnb",
  verifierEmail: "verify@airbnb.com",
} as const;

const EIGEN = {
  verificationUrl:
    "https://verify-sepolia.eigencloud.xyz/app/0x00658e70d8880910277592b3b41f9dd3fe4ce5fd",
  appId: "0x00658e70d8880910277592b3b41f9dd3fe4ce5fd",
} as const;

function demoAttestation(
  attrs: Record<string, string | boolean>,
  ts: string
): NonNullable<VerificationRequest["attestation"]> {
  return {
    attributes: attrs,
    timestamp: ts,
    message: `IdentityAttestation|demo|${ts}`,
    messageHash: "0x0",
    signature:
      "0x89fbde7c3f2a1e5d8b9c4a6f7e2d1c8b5a4e3f2d1c9b8a7e6d5c4b3a2f1e0d9c8",
    signer: "0x4E1B03A5678c52075a7271AfCF4C44E26F64Ef35",
    biometricVerification: {
      faceMatch: true,
      confidence: 0.94,
    },
    eigen: EIGEN,
  };
}

const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
const fiveHoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
const thirtyMinAgo = new Date(Date.now() - 30 * 60000).toISOString();

/**
 * Offline demo rows for `/business` — aligned with Programs tab workflows (`host_verification`,
 * `guest_verification`) and `airbnb_prod` verifier id.
 */
export const BUSINESS_DEMO_REQUESTS: VerificationRequest[] = [
  {
    requestId: "req_airbnb_001",
    ...V,
    userEmail: "jordan.lee@gmail.com",
    requestedAttributes: ["name", "ageOver18", "address", "notExpired"],
    workflow: "host_verification",
    status: "approved",
    createdAt: twoDaysAgo,
    completedAt: twoDaysAgo,
    attestation: demoAttestation(
      {
        name: "Jordan Lee",
        ageOver18: true,
        address: "123 NORTH STREET, SACRAMENTO, CA 00000-1234",
        notExpired: true,
      },
      twoDaysAgo
    ),
  },
  {
    requestId: "req_airbnb_002",
    ...V,
    userEmail: "janice.sample@example.com",
    requestedAttributes: ["name", "ageOver18", "address", "notExpired"],
    workflow: "host_verification",
    status: "pending",
    createdAt: fiveHoursAgo,
    attestation: null,
  },
  {
    requestId: "req_airbnb_003",
    ...V,
    userEmail: "marcus.johnson@yahoo.com",
    requestedAttributes: ["name", "ageOver18", "notExpired"],
    workflow: "guest_verification",
    status: "approved",
    createdAt: dayAgo,
    completedAt: dayAgo,
    attestation: demoAttestation(
      {
        name: "Marcus Johnson",
        ageOver18: true,
        notExpired: true,
      },
      dayAgo
    ),
  },
  {
    requestId: "req_airbnb_004",
    ...V,
    userEmail: "emily.rodriguez@gmail.com",
    requestedAttributes: ["name", "ageOver18", "address", "notExpired"],
    workflow: "host_verification",
    status: "denied",
    createdAt: threeDaysAgo,
    completedAt: threeDaysAgo,
    attestation: null,
  },
  {
    requestId: "req_airbnb_005",
    ...V,
    userEmail: "david.kim@hotmail.com",
    requestedAttributes: ["name", "ageOver18", "notExpired"],
    workflow: "guest_verification",
    status: "pending",
    createdAt: thirtyMinAgo,
    attestation: null,
  },
];
