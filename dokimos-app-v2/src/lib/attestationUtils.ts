/**
 * Utility functions for formatting and displaying attestation data.
 */

import type { AttestationData } from "@/types/dokimos";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";

/**
 * Format attributes object into human-readable list.
 * Example: { ageOver21: true, name: "..." } -> "Age verification, Name verification"
 */
export function formatAttributesList(
  attributes: Record<string, string | boolean>
): string {
  const readable: string[] = [];

  if (attributes.ageOver18 || attributes.ageOver21) {
    readable.push("Age verification");
  }
  if (attributes.name) {
    readable.push("Name verification");
  }
  if (attributes.address) {
    readable.push("Address verification");
  }
  if (attributes.notExpired) {
    readable.push("Document validity");
  }

  return readable.length > 0 ? readable.join(", ") : "Identity verification";
}

/**
 * Format attribute key into display name.
 * Example: "ageOver21" -> "Age over 21"
 */
export function formatAttributeName(key: string): string {
  const nameMap: Record<string, string> = {
    ageOver18: "Age over 18",
    ageOver21: "Age over 21",
    name: "Full name",
    address: "Address",
    notExpired: "Document not expired",
    issuingCountry: "Issuing country",
    documentType: "Document type",
  };
  return nameMap[key] || key.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Format attribute value for display.
 * Example: true -> "✓", false -> "✗", "John Doe" -> "John Doe"
 */
export function formatAttributeValue(value: string | boolean): string {
  if (typeof value === "boolean") {
    return value ? "✓" : "✗";
  }
  return String(value);
}

/**
 * Format timestamp into human-readable date.
 * Example: "2026-04-09T10:30:00.000Z" -> "Apr 9, 2026, 10:30 AM"
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Check if message appears to contain raw personal data (privacy leak).
 */
export function containsPersonalData(message: string): boolean {
  return (
    message.includes("{") &&
    (message.includes('"name"') ||
      message.includes('"ssn"') ||
      message.includes('"address"'))
  );
}

/**
 * Etherscan signature verification entrypoint.
 * Note: Etherscan does not support robust prefill through URL params.
 */
export function getEtherscanVerifyUrl(): string {
  return "https://sepolia.etherscan.io/verifiedSignatures#/verify";
}

/**
 * Get EigenCloud dashboard URL from attestation, with a default fallback.
 */
export function getEigenDashboardUrl(attestation: AttestationData): string {
  return (
    attestation.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(attestation.eigen?.appId)
  );
}
