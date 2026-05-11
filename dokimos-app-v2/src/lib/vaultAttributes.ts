/** Demo / fallback attributes when no attestation is loaded — kept in sync with TEE shape. */
export const VAULT_DEMO_ATTRIBUTES: Record<string, string | boolean> = {
  name: "Janice Sample",
  address: "123 Main St, San Francisco, CA",
  dateOfBirth: "1990-01-15",
  ageOver18: true,
  ageOver21: true,
  nationality: "United States",
  documentType: "Driver's License",
  documentExpiryDate: "2030-12-31",
};

export function formatVaultAttributeDisplay(key: string, value: string | boolean): string {
  if (typeof value === "boolean") {
    return value ? "Verified" : "Not verified";
  }
  const s = String(value);
  if (s === "Unknown") return "—";
  if (key === "dateOfBirth" || key === "documentExpiryDate") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    const d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(s);
    if (!Number.isNaN(d.getTime())) {
      if (key === "documentExpiryDate") {
        return `Expires ${d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      }
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return s;
}

const VAULT_IDENTITY_KEYS = new Set(["name", "address", "dateOfBirth", "nationality"]);

/** Stable order for primary profile fields in vault UI (rows). */
export const VAULT_PRIMARY_IDENTITY_KEYS = ["name", "address", "dateOfBirth", "nationality"] as const;

export function sortIdentityEntries(entries: [string, string | boolean][]) {
  const map = new Map(entries);
  const ordered: [string, string | boolean][] = [];
  for (const k of VAULT_PRIMARY_IDENTITY_KEYS) {
    if (map.has(k)) ordered.push([k, map.get(k)!]);
  }
  return ordered;
}
const VAULT_DOCUMENT_KEYS = new Set(["documentExpiryDate"]);
const VAULT_ELIGIBILITY_KEYS = new Set(["ageOver18", "ageOver21"]);

export function groupVaultAttributes(entries: [string, string | boolean][]) {
  const identity: [string, string | boolean][] = [];
  const documentG: [string, string | boolean][] = [];
  const eligibility: [string, string | boolean][] = [];
  const other: [string, string | boolean][] = [];
  for (const [k, v] of entries) {
    if (k === "notExpired") continue;
    if (VAULT_IDENTITY_KEYS.has(k)) identity.push([k, v]);
    else if (VAULT_DOCUMENT_KEYS.has(k)) documentG.push([k, v]);
    else if (VAULT_ELIGIBILITY_KEYS.has(k)) eligibility.push([k, v]);
    else other.push([k, v]);
  }
  return { identity, document: documentG, eligibility, other };
}

/** Turn camelCase / snake_case keys into Title Case words for unknown attributes. */
export function titleCaseFromAttributeKey(key: string): string {
  const spaced = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  if (!spaced) return key;
  return spaced
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export const VAULT_ATTR_LABELS: Record<string, string> = {
  name: "Full Name",
  dateOfBirth: "Date of Birth",
  ageOver18: "Age Over 18",
  ageOver21: "Age Over 21",
  notExpired: "Document Not Expired",
  nationality: "Nationality",
  documentType: "Document Type",
  documentExpiryDate: "Document Expiry Date",
  address: "Address",
  fullName: "Full Name",
  documentNotExpired: "Document Not Expired",
};

export function labelForVaultAttributeKey(key: string): string {
  return VAULT_ATTR_LABELS[key] ?? titleCaseFromAttributeKey(key);
}
