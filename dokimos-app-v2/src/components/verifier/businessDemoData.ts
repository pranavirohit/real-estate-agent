import type { VerificationRequest } from "@/types/dokimos";

const V = {
  verifierId: "airbnb_prod",
  verifierName: "Airbnb",
  verifierEmail: "verify@airbnb.com",
} as const;

const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
const fiveHoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
const thirtyMinAgo = new Date(Date.now() - 30 * 60000).toISOString();

/**
 * Offline demo rows for `/business` — aligned with Programs tab workflows (`host_verification`,
 * `guest_verification`) and `airbnb_prod` verifier id.
 *
 * Approved rows intentionally omit synthetic signatures so the verification wizard is only used
 * with live TEE-signed attestations (send a real request or approve from the consumer app).
 */
export const BUSINESS_DEMO_REQUESTS: VerificationRequest[] = [
  {
    requestId: "req_airbnb_001",
    ...V,
    userEmail: "jordan.lee@gmail.com",
    requestedAttributes: ["name", "ageOver18", "address", "notExpired"],
    workflow: "host_verification",
    status: "pending",
    createdAt: twoDaysAgo,
    attestation: null,
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
    status: "pending",
    createdAt: dayAgo,
    attestation: null,
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
