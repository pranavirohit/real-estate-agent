/**
 * Module-level store mapping applicationId → scheduled tour date (ISO string).
 * Populated by /api/nostos/book after the TEE returns applicationIds.
 * Merged into /api/rental-applications responses for the landlord dashboard.
 * Persists for the lifetime of the Next.js server process.
 */

const store = new Map<string, string>();

export function saveTourDate(applicationId: string, tourDate: string): void {
  store.set(applicationId, tourDate);
}

export function getTourDate(applicationId: string): string | undefined {
  return store.get(applicationId);
}
