import axios from "axios";
import type { VerificationRequest } from "@/types/dokimos";

/** Matches seeded verifier in Fastify (`airbnb_prod`). */
export const VERIFIER_LIVE_DEMO_ID = "airbnb_prod";

const WORKFLOW_REQUEST_ATTRIBUTES: Record<
  "host_verification" | "guest_verification",
  string[]
> = {
  host_verification: ["name", "ageOver18", "address", "notExpired"],
  guest_verification: ["name", "ageOver18", "notExpired"],
};

function requestedAttributesForWorkflow(workflow: string): string[] {
  if (workflow === "host_verification" || workflow === "guest_verification") {
    return WORKFLOW_REQUEST_ATTRIBUTES[workflow];
  }
  return ["name", "ageOver18", "notExpired"];
}

/**
 * Same payload as the former “Send verification request (live API)” panel:
 * POST /api/request-verification → TEE.
 */
export async function postVerificationRequest(args: {
  userEmail: string;
  workflow: string | null | undefined;
}): Promise<VerificationRequest> {
  const workflow = (args.workflow?.trim() || "host_verification").slice(0, 128);
  const requestedAttributes = requestedAttributesForWorkflow(workflow);
  const { data } = await axios.post<VerificationRequest>("/api/request-verification", {
    verifierId: VERIFIER_LIVE_DEMO_ID,
    userEmail: args.userEmail,
    requestedAttributes,
    workflow,
  });
  return data;
}
