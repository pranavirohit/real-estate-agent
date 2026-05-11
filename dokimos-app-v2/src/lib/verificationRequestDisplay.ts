import type { VerificationRequest } from "@/types/dokimos";
import { labelForVaultAttributeKey } from "@/lib/vaultAttributes";

const COMPANY_BADGE_COLORS = [
  "#0d9488",
  "#059669",
  "#DC2626",
  "#EA580C",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
] as const;

/** Stable accent for a verifier name — circular “logo” avatar on activity lists. */
export function getCompanyBadgeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMPANY_BADGE_COLORS[Math.abs(hash) % COMPANY_BADGE_COLORS.length];
}

/** Human-readable label for a TEE / request attribute key (Title Case, shared with vault rows). */
export function formatVerificationAttributeKey(attr: string): string {
  return labelForVaultAttributeKey(attr);
}

/** When both are present, the expiry date row supersedes the boolean “not expired” flag. */
export function dedupeAttributeKeysForDisplay(keys: string[]): string[] {
  if (keys.includes("documentExpiryDate") && keys.includes("notExpired")) {
    return keys.filter((k) => k !== "notExpired");
  }
  return keys;
}

/**
 * For approved rows with attestation, prefer keys present in the proof; else requested attributes.
 */
export function getDisplayedAttributeKeys(request: VerificationRequest): string[] {
  let keys: string[];
  if (
    request.status === "approved" &&
    request.attestation &&
    typeof request.attestation === "object"
  ) {
    const att = request.attestation as { attributes?: Record<string, unknown> };
    if (att.attributes && typeof att.attributes === "object") {
      const fromAtt = Object.keys(att.attributes);
      if (fromAtt.length > 0) keys = fromAtt;
      else keys = request.requestedAttributes ?? [];
    } else keys = request.requestedAttributes ?? [];
  } else keys = request.requestedAttributes ?? [];
  return dedupeAttributeKeysForDisplay(keys);
}

/** Legacy / demo verifiers omitted from consumer Activity lists. */
const EXCLUDED_FROM_CONSUMER_ACTIVITY_VERIFIERS = new Set([
  "Acme Brokerage",
  "Binance",
]);

export function isExcludedFromConsumerActivityList(
  request: VerificationRequest
): boolean {
  const name = (request.verifierName ?? "").trim();
  return EXCLUDED_FROM_CONSUMER_ACTIVITY_VERIFIERS.has(name);
}
