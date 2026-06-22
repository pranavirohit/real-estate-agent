import { createSearchListingsTool } from "./tools/searchListings";
import { createScheduleToursTool } from "./tools/scheduleTours";

interface NostosToolOptions {
  baseUrl: string;
  userEmail: string;
  userName: string;
}

export function createNostosTools(opts: NostosToolOptions) {
  const { baseUrl, userEmail, userName } = opts;
  return {
    searchListings: createSearchListingsTool(baseUrl),
    scheduleTours: createScheduleToursTool(baseUrl, userEmail, userName),
  };
}
