import { tool, jsonSchema } from "ai";
import { fallbackMockListings, type AgentListing } from "@/lib/agentListings";

interface FetchListingsOptions {
  location: string;
  maxPrice: number;
  beds: number;
  petFriendly?: boolean;
  amenities?: string[];
  minBaths?: number;
  neighborhood?: string;
}

async function fetchListings(opts: FetchListingsOptions, baseUrl: string): Promise<AgentListing[]> {
  const { location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood } = opts;
  try {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (maxPrice) params.set("price_max", String(maxPrice));
    if (beds) params.set("beds_min", String(beds));
    if (petFriendly) params.set("pet_friendly", "true");
    if (minBaths) params.set("min_baths", String(minBaths));
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (amenities?.length) params.set("amenities", amenities.join(","));

    const res = await fetch(`${baseUrl}/api/listings?${params}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { listings?: AgentListing[] };
    const listings = Array.isArray(data.listings) ? data.listings : [];
    if (listings.length === 0) throw new Error("empty");
    return listings.slice(0, 8);
  } catch {
    return fallbackMockListings();
  }
}

export function createSearchListingsTool(baseUrl: string) {
  return tool({
    description:
      "Search for available rental listings in NYC based on the user's criteria. Call after gathering commute, preferences, budget, and tour count.",
    parameters: jsonSchema<FetchListingsOptions>({
      type: "object",
      properties: {
        location: { type: "string", description: "Neighborhood or borough, e.g. 'Brooklyn, NY'" },
        maxPrice: { type: "number", description: "Maximum monthly rent in USD" },
        beds: { type: "number", description: "Minimum number of bedrooms" },
        petFriendly: { type: "boolean" },
        amenities: {
          type: "array",
          items: { type: "string" },
          description: "Required amenities e.g. dishwasher, gym, doorman",
        },
        minBaths: { type: "number" },
        neighborhood: {
          type: "string",
          description: "Specific neighborhood e.g. Williamsburg, Astoria",
        },
      },
      required: ["location", "maxPrice", "beds"],
    }),
    execute: async ({ location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood }) => {
      const listings = await fetchListings(
        { location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood },
        baseUrl
      );
      return { listings };
    },
  });
}
