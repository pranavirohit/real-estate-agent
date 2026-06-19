/**
 * Standalone NYC rental search. Ported from the Nostos app's /api/listings route
 * and demo fallback so the MCP server has no dependency on the Next.js app. Returns
 * clean, structured listing objects (unlike a generic web-search MCP).
 */

export interface RentalListing {
  id: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  url: string;
  landlordEmail?: string;
}

export interface SearchParams {
  location: string;
  maxPrice: number;
  beds: number;
  minBaths?: number;
  neighborhood?: string;
  petFriendly?: boolean;
}

const RAPIDAPI_HOST = "zillow-property-data1.p.rapidapi.com";
const UPSTREAM_BASE = "https://zillow-property-data1.p.rapidapi.com/v1";

// --- Demo fallback listings (used when RAPIDAPI_KEY is absent or upstream fails) ---

const DEMO_LISTINGS: RentalListing[] = [
  {
    id: "wythe-3b",
    address: "142 Wythe Ave, Apt 3B, Williamsburg, Brooklyn",
    price: "$2,800/mo",
    beds: 2,
    baths: 1,
    sqft: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop",
    url: "",
    landlordEmail: "landlord.wythe@nostos-demo.com",
  },
  {
    id: "nostrand-2f",
    address: "67 Nostrand Ave, Apt 2F, Bedford-Stuyvesant, Brooklyn",
    price: "$2,650/mo",
    beds: 2,
    baths: 1,
    sqft: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&fit=crop",
    url: "",
    landlordEmail: "landlord.nostrand@nostos-demo.com",
  },
  {
    id: "flatbush-4a",
    address: "234 Flatbush Ave, Apt 4A, Park Slope, Brooklyn",
    price: "$2,950/mo",
    beds: 2,
    baths: 2,
    sqft: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80&fit=crop",
    url: "",
    landlordEmail: "landlord.flatbush@nostos-demo.com",
  },
];

export function demoListings(): RentalListing[] {
  return DEMO_LISTINGS.map((l) => ({ ...l }));
}

export function findDemoListing(id: string): RentalListing | undefined {
  const found = DEMO_LISTINGS.find((l) => l.id === id);
  return found ? { ...found } : undefined;
}

// --- Zillow response normalization (best-effort across varied RapidAPI shapes) ---

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function extractRawListings(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!isRecord(body)) return [];

  const tryKeys = ["listings", "results", "props", "properties", "data", "searchResults"];
  for (const k of tryKeys) {
    const v = body[k];
    if (Array.isArray(v)) return v;
    if (isRecord(v)) {
      for (const sub of ["listings", "results", "props", "items", "data"]) {
        const inner = v[sub];
        if (Array.isArray(inner)) return inner;
      }
    }
  }

  for (const v of Object.values(body)) {
    if (Array.isArray(v) && v.length > 0 && isRecord(v[0])) {
      const first = v[0] as Record<string, unknown>;
      if (
        "zpid" in first ||
        "address" in first ||
        "streetAddress" in first ||
        "price" in first ||
        "bedrooms" in first
      ) {
        return v;
      }
    }
  }
  return [];
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function str(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function pickPrice(raw: Record<string, unknown>): string {
  const candidates = [
    raw.unformattedPrice,
    raw.price,
    raw.rentZestimate,
    raw.monthlyRent,
    raw.listPrice,
    raw.rentalPrice,
  ];
  for (const c of candidates) {
    const n = num(c);
    if (n !== undefined && n > 0) return `$${Math.round(n).toLocaleString("en-US")}/mo`;
  }
  const p = str(raw.priceLabel ?? raw.statusText ?? "");
  return p || "Rent N/A";
}

function pickAddress(raw: Record<string, unknown>): string {
  const full = str(raw.address ?? raw.fullAddress ?? raw.streetAddress);
  const city = str(raw.city ?? "");
  const state = str(raw.state ?? "");
  const zip = str(raw.zipcode ?? raw.zipCode ?? "");
  if (full && (city || state)) {
    const tail = [city, state, zip].filter(Boolean).join(" ");
    return tail ? `${full}, ${tail}` : full;
  }
  if (full) return full;
  return str(raw.title ?? "Address unavailable");
}

function pickImage(raw: Record<string, unknown>): string {
  const img = raw.imgSrc ?? raw.image ?? raw.imageUrl;
  if (typeof img === "string" && img.startsWith("http")) return img;
  const photos = raw.photos;
  if (Array.isArray(photos) && photos.length > 0) {
    const p0 = photos[0];
    if (isRecord(p0) && typeof p0.url === "string") return p0.url;
    if (typeof p0 === "string" && p0.startsWith("http")) return p0;
  }
  return "";
}

function pickUrl(raw: Record<string, unknown>): string {
  const u = raw.detailUrl ?? raw.hdpUrl ?? raw.url ?? raw.listingUrl;
  if (typeof u === "string" && u.startsWith("http")) return u;
  if (typeof u === "string" && u.startsWith("/")) return `https://www.zillow.com${u}`;
  return "";
}

function normalizeOne(raw: unknown, index: number): RentalListing | null {
  if (!isRecord(raw)) return null;
  const id = str(raw.zpid ?? raw.id ?? raw.listingId ?? raw.zillowId ?? `listing-${index}`);
  return {
    id,
    address: pickAddress(raw),
    price: pickPrice(raw),
    beds: num(raw.beds ?? raw.bedrooms ?? raw.bed) ?? 0,
    baths: num(raw.baths ?? raw.bathrooms ?? raw.bath) ?? 0,
    sqft: num(raw.livingArea ?? raw.livingAreaValue ?? raw.area ?? raw.sqft ?? raw.squareFeet) ?? 0,
    imageUrl: pickImage(raw),
    url: pickUrl(raw),
  };
}

export interface SearchResult {
  listings: RentalListing[];
  source: "zillow" | "demo";
  note?: string;
}

/**
 * Search NYC rentals. Uses live Zillow data when RAPIDAPI_KEY is set; otherwise
 * (or on upstream failure) returns the demo Brooklyn listings so tools always work.
 */
export async function searchRentals(params: SearchParams): Promise<SearchResult> {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) {
    return {
      listings: demoListings(),
      source: "demo",
      note: "RAPIDAPI_KEY not set — returning demo Brooklyn listings.",
    };
  }

  const { location, maxPrice, beds, minBaths, neighborhood, petFriendly } = params;
  const query = new URLSearchParams({
    location: neighborhood ? `${neighborhood}, ${location}` : location,
    listing_status: "for_rent",
    number_of_bedrooms: String(beds || 1),
    list_price_range: `0,${maxPrice || 10000}`,
  });
  if (minBaths) query.set("number_of_bathrooms", String(minBaths));
  if (petFriendly) query.set("pets", "allows_large_dogs,allows_small_dogs,allows_cats");

  try {
    const res = await fetch(`${UPSTREAM_BASE}?${query.toString()}`, {
      method: "GET",
      headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": key },
    });
    if (!res.ok) {
      return {
        listings: demoListings(),
        source: "demo",
        note: `Upstream HTTP ${res.status} — falling back to demo listings.`,
      };
    }
    const body = (await res.json()) as unknown;
    const raw = extractRawListings(body);
    let listings: RentalListing[] = [];
    for (let i = 0; i < raw.length; i++) {
      const n = normalizeOne(raw[i], i);
      if (n) listings.push(n);
    }
    if (minBaths) listings = listings.filter((l) => l.baths >= minBaths);
    if (listings.length === 0) {
      return {
        listings: demoListings(),
        source: "demo",
        note: "No live results — falling back to demo listings.",
      };
    }
    return { listings: listings.slice(0, 8), source: "zillow" };
  } catch (e) {
    return {
      listings: demoListings(),
      source: "demo",
      note: `Search failed (${e instanceof Error ? e.message : "unknown"}) — demo listings.`,
    };
  }
}
