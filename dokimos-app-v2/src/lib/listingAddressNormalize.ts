/** Stable key for matching landlord showcase addresses to TEE rental rows. */
export function normalizeListingAddress(addr: string): string {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}
