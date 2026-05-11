import type { VerificationRequest } from "@/types/dokimos";

/** Title case each word (handles hyphenated segments, e.g. Mary-Jane Smith). */
export function toTitleCaseWords(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return input;
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part.length === 0
            ? part
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("-")
    )
    .join(" ");
}

export function formatIsoDateForVerifier(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Derive a display name from the email local part (first.last, first_last, etc.). */
export function formatNameFromUserEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const base = local.split("+")[0] ?? local;
  const parts = base.replace(/\./g, " ").split(/[._]/).filter(Boolean);
  if (parts.length === 0) return email;
  return parts
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}

function displayNameContainsDigit(s: string): boolean {
  return /\d/.test(s);
}

/** Shown when attestation name and email-derived name both contain digits (e.g. user123@). */
export const VERIFICATION_DISPLAY_NAME_FALLBACK = "Verified applicant";

/**
 * Prefer attestation full name when present; else derive from email.
 * Names containing digits are not shown — falls back to the other source or {@link VERIFICATION_DISPLAY_NAME_FALLBACK}.
 */
export function resolveVerificationDisplayName(
  attestationName: string | undefined | null,
  userEmail: string
): string {
  if (typeof attestationName === "string" && attestationName.trim()) {
    const t = toTitleCaseWords(attestationName.trim());
    if (!displayNameContainsDigit(t)) return t;
  }
  const fromEmail = toTitleCaseWords(formatNameFromUserEmail(userEmail));
  if (!displayNameContainsDigit(fromEmail)) return fromEmail;
  return VERIFICATION_DISPLAY_NAME_FALLBACK;
}

/** Prefer attestation full name when present; else derive from email. */
export function getVerificationDisplayName(req: VerificationRequest): string {
  const att = req.attestation as { attributes?: { name?: string } } | undefined;
  return resolveVerificationDisplayName(att?.attributes?.name, req.userEmail);
}

/** Plain-language rows for “What was verified” (Layer 1). */
export function buildPlainLanguageVerificationRows(
  att: Record<string, unknown>,
  userEmail = ""
): {
  label: string;
  value: string;
}[] {
  const attrs = (att.attributes ?? {}) as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];

  if (attrs.name != null && String(attrs.name).trim() !== "") {
    rows.push({
      label: "Full Name",
      value: resolveVerificationDisplayName(String(attrs.name), userEmail),
    });
  }
  if (
    attrs.dateOfBirth != null &&
    String(attrs.dateOfBirth).trim() !== "" &&
    String(attrs.dateOfBirth) !== "Unknown"
  ) {
    rows.push({
      label: "Date of Birth",
      value: formatIsoDateForVerifier(String(attrs.dateOfBirth)),
    });
  }
  if (
    attrs.nationality != null &&
    String(attrs.nationality).trim() !== "" &&
    String(attrs.nationality) !== "Unknown"
  ) {
    rows.push({ label: "Nationality", value: String(attrs.nationality) });
  }
  if (attrs.documentType != null && String(attrs.documentType).trim() !== "") {
    rows.push({
      label: "Document Type",
      value: String(attrs.documentType),
    });
  }
  const hasDocExpiryDate =
    attrs.documentExpiryDate != null &&
    String(attrs.documentExpiryDate).trim() !== "" &&
    String(attrs.documentExpiryDate) !== "Unknown";

  if (hasDocExpiryDate) {
    rows.push({
      label: "Document Expiry Date",
      value: formatIsoDateForVerifier(String(attrs.documentExpiryDate)),
    });
  }
  if (typeof attrs.notExpired === "boolean" && !hasDocExpiryDate) {
    rows.push({
      label: "ID Document",
      value: attrs.notExpired
        ? "Valid and not expired"
        : "Expired or could not be confirmed",
    });
  }
  if (typeof attrs.ageOver18 === "boolean") {
    rows.push({
      label: "Age (18+)",
      value: attrs.ageOver18 ? "18 or older" : "Under 18",
    });
  }
  if (attrs.address != null && String(attrs.address).trim() !== "") {
    rows.push({ label: "Address", value: String(attrs.address) });
  }
  if (typeof attrs.ageOver21 === "boolean") {
    rows.push({
      label: "Age (21+)",
      value: attrs.ageOver21 ? "Over 21 years old" : "Under 21",
    });
  }

  const bio = att.biometricVerification as
    | { faceMatch?: boolean; confidence?: number }
    | undefined;
  if (bio && typeof bio.faceMatch === "boolean") {
    const pct =
      typeof bio.confidence === "number"
        ? `${Math.round(bio.confidence * 100)}%`
        : "";
    rows.push({
      label: "Photo Match",
      value: bio.faceMatch
        ? `Face matches ID photo${pct ? ` (${pct} match)` : ""}`
        : "Face match not confirmed",
    });
  }

  return rows;
}

/** Labels for `requestedAttributes` when there is no attestation payload yet. */
const REQUESTED_ATTRIBUTE_LABELS: Record<string, string> = {
  name: "Full Name",
  dateOfBirth: "Date of Birth",
  nationality: "Nationality",
  address: "Address",
  documentType: "Document Type",
  documentExpiryDate: "Document Expiry Date",
  notExpired: "ID Document",
  ageOver18: "Age (18+)",
  ageOver21: "Age (21+)",
};

function labelForRequestedAttributeKey(key: string): string {
  return REQUESTED_ATTRIBUTE_LABELS[key] ?? toTitleCaseWords(key.replace(/_/g, " "));
}

/**
 * Rows for the verifier modal “What was verified” block: prefer attestation detail,
 * else derive from `requestedAttributes` so every request shows a consistent checklist.
 */
export function buildVerificationSummaryRows(
  request: VerificationRequest
): { label: string; value: string }[] {
  const att = request.attestation as Record<string, unknown> | undefined;
  if (att) {
    const fromAtt = buildPlainLanguageVerificationRows(att, request.userEmail);
    if (fromAtt.length > 0) return fromAtt;
  }

  const keys = request.requestedAttributes ?? [];
  if (keys.length === 0) return [];

  return keys.map((key) => {
    let value: string;
    if (request.status === "pending") {
      value = "Pending — user has not finished verification";
    } else if (request.status === "approved") {
      value = key === "name" ? getVerificationDisplayName(request) : "Verified";
    } else {
      value = "Not completed";
    }
    return { label: labelForRequestedAttributeKey(key), value };
  });
}
