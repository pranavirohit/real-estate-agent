import { createSearchListingsTool } from "./tools/searchListings";
import { createScheduleToursTool } from "./tools/scheduleTours";

/**
 * Assembles the full Nostos tool set for a single request.
 * baseUrl is derived from the incoming request headers.
 * userEmail / userName come from the authenticated session (or demo fallbacks).
 */
export function createNostosTools(baseUrl: string, userEmail: string, userName: string) {
  return {
    searchListings: createSearchListingsTool(baseUrl),
    scheduleTours: createScheduleToursTool(baseUrl, userEmail, userName),
  };
}
