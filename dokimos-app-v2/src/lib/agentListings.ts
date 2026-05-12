/** Unified listing shape for agent UI (API + fallback mocks). */
export type AgentListing = {
  id: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  url: string;
  landlordEmail?: string;
};

/** Exact copy from CURSOR_CONTEXT — mock NYC listings when API fails or returns empty. */
export const MOCK_RENTAL_LISTINGS = [
  {
    id: "wythe-3b",
    title: "142 Wythe Ave, Apt 3B",
    neighborhood: "Williamsburg, Brooklyn",
    price: "$2,800/mo",
    details: "2BR 1BA | Pet friendly | Available June 1",
  },
  {
    id: "nostrand-2f",
    title: "67 Nostrand Ave, Apt 2F",
    neighborhood: "Bedford-Stuyvesant, Brooklyn",
    price: "$2,650/mo",
    details: "2BR 1BA | Pet friendly | Available May 15",
  },
  {
    id: "flatbush-4a",
    title: "234 Flatbush Ave, Apt 4A",
    neighborhood: "Park Slope, Brooklyn",
    price: "$2,950/mo",
    details: "2BR 2BA | Cats only | Available June 15",
  },
] as const;

const MOCK_LANDLORD_EMAILS: Record<string, string> = {
  "wythe-3b": "landlord.wythe@nostos-demo.com",
  "nostrand-2f": "landlord.nostrand@nostos-demo.com",
  "flatbush-4a": "landlord.flatbush@nostos-demo.com",
};

// Curated Unsplash photos — each matches the neighborhood vibe
const MOCK_IMAGE_URLS: Record<string, string> = {
  // Williamsburg: bright, modern loft interior
  "wythe-3b":
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop",
  // Bed-Stuy: warm pre-war living room with exposed brick
  "nostrand-2f":
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&fit=crop",
  // Park Slope: classic Brooklyn brownstone interior
  "flatbush-4a":
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&fit=crop",
};

/** Map hardcoded demo rows to AgentListing for API fallback. */
export function fallbackMockListings(): AgentListing[] {
  return MOCK_RENTAL_LISTINGS.map((l, i) => ({
    id: l.id,
    address: `${l.title}, ${l.neighborhood}`,
    price: l.price,
    beds: 2,
    baths: i === 2 ? 2 : 1,
    sqft: 0,
    imageUrl: MOCK_IMAGE_URLS[l.id] ?? "",
    url: "",
    landlordEmail: MOCK_LANDLORD_EMAILS[l.id],
  }));
}

export type MockListingId = (typeof MOCK_RENTAL_LISTINGS)[number]["id"];
