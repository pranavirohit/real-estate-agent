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

/** Map hardcoded demo rows to AgentListing for API fallback. */
export function fallbackMockListings(): AgentListing[] {
  return MOCK_RENTAL_LISTINGS.map((l, i) => ({
    id: l.id,
    address: `${l.title}, ${l.neighborhood}`,
    price: l.price,
    beds: 2,
    baths: i === 2 ? 2 : 1,
    sqft: 0,
    imageUrl: "",
    url: "",
  }));
}

export type MockListingId = (typeof MOCK_RENTAL_LISTINGS)[number]["id"];
