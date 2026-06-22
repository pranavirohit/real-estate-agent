import { tool, jsonSchema } from "ai";
import { fallbackMockListings, type AgentListing } from "@/lib/agentListings";

interface FetchListingsOptions {
  location: string;
  maxRent: number;
  bedrooms: number;
  petFriendly?: boolean;
  amenities?: string[];
  minBathrooms?: number;
  neighborhood?: string;
}

interface ListingsResult {
  listings: AgentListing[];
  source: "rentcast" | "demo";
  note?: string;
}

async function fetchListings(opts: FetchListingsOptions, baseUrl: string): Promise<ListingsResult> {
  const { location, maxRent, bedrooms, petFriendly, amenities, minBathrooms, neighborhood } = opts;
  try {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (maxRent) params.set("price_max", String(maxRent));
    if (bedrooms) params.set("beds_min", String(bedrooms));
    if (petFriendly) params.set("pet_friendly", "true");
    if (minBathrooms) params.set("min_baths", String(minBathrooms));
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (amenities?.length) params.set("amenities", amenities.join(","));

    const res = await fetch(`${baseUrl}/api/listings?${params}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { listings?: AgentListing[]; source?: string };
    const listings = Array.isArray(data.listings) ? data.listings : [];
    if (listings.length === 0) throw new Error("empty");
    return { listings: listings.slice(0, 8), source: "rentcast" as const };
  } catch {
    return {
      listings: fallbackMockListings(),
      source: "demo",
      note: "Live listings are unavailable right now. Showing sample Brooklyn apartments for demonstration.",
    };
  }
}

export function createSearchListingsTool(baseUrl: string) {
  return tool({
    description:
      "Search for available rental listings in NYC based on the user's criteria. Call after gathering commute, preferences, budget, and tour count.",
    parameters: jsonSchema<FetchListingsOptions>({
      type: "object",
      properties: {
        location: { type: "string", description: "Borough or city, e.g. 'Brooklyn, NY'" },
        maxRent: { type: "number", description: "Maximum monthly rent in USD" },
        bedrooms: { type: "number", description: "Minimum number of bedrooms" },
        petFriendly: { type: "boolean" },
        amenities: {
          type: "array",
          items: { type: "string" },
          description: "Required amenities e.g. dishwasher, gym, in-unit laundry",
        },
        minBathrooms: { type: "number" },
        neighborhood: {
          type: "string",
          description: "Specific neighborhood e.g. Williamsburg, Astoria",
        },
      },
      required: ["location", "maxRent", "bedrooms"],
    }),
    execute: async ({ location, maxRent, bedrooms, petFriendly, amenities, minBathrooms, neighborhood }) => {
      return fetchListings(
        { location, maxRent, bedrooms, petFriendly, amenities, minBathrooms, neighborhood },
        baseUrl
      );
    },
  });
}
