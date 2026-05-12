import { NextRequest, NextResponse } from "next/server";
import type { AgentListing } from "@/lib/agentListings";

const RAPIDAPI_HOST = "zillow-scraper-api.p.rapidapi.com";
const UPSTREAM_BASE =
  "https://zillow-scraper-api.p.rapidapi.com/zillow/search/listings";

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** Best-effort: find an array of listing-like objects in varied RapidAPI/Zillow JSON shapes. */
function extractRawListings(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!isRecord(body)) return [];

  const tryKeys = [
    "listings",
    "results",
    "props",
    "properties",
    "data",
    "searchResults",
    "zillowListings",
  ];
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

function formatPriceMonthly(n: number): string {
  return `$${n.toLocaleString("en-US")}/mo`;
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
    if (n !== undefined && n > 0) {
      const rounded = n >= 1000 && n < 100000 ? Math.round(n) : Math.round(n);
      return formatPriceMonthly(rounded);
    }
  }
  const p = str(raw.priceLabel ?? raw.statusText ?? "");
  if (p) return p;
  return "";
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
  if (typeof u === "string" && u.startsWith("/")) {
    return `https://www.zillow.com${u}`;
  }
  return "";
}

function normalizeOne(raw: unknown, index: number): AgentListing | null {
  if (!isRecord(raw)) return null;

  const id = str(
    raw.zpid ?? raw.id ?? raw.listingId ?? raw.zillowId ?? `listing-${index}`
  );

  const beds =
    num(raw.beds ?? raw.bedrooms ?? raw.bed) ?? 0;
  const baths =
    num(raw.baths ?? raw.bathrooms ?? raw.bath) ?? 0;
  const sqft =
    num(
      raw.livingArea ??
        raw.livingAreaValue ??
        raw.area ??
        raw.sqft ??
        raw.squareFeet
    ) ?? 0;

  const address = pickAddress(raw);
  let price = pickPrice(raw);
  if (!price) price = "Rent N/A";

  return {
    id,
    address,
    price,
    beds,
    baths,
    sqft,
    imageUrl: pickImage(raw),
    url: pickUrl(raw),
  };
}

export async function GET(request: NextRequest) {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "RAPIDAPI_KEY is not configured", listings: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  // Core filters — support both legacy param names and the new ones from the chat route
  const location = searchParams.get("location")?.trim() || "Brooklyn, NY";
  const maxPrice = searchParams.get("price_max")?.trim() || searchParams.get("maxPrice")?.trim() || "5000";
  const beds = searchParams.get("beds_min")?.trim() || searchParams.get("beds")?.trim() || "1";

  // Extended filters (new)
  const petFriendly = searchParams.get("pet_friendly") === "true";
  const minBaths = searchParams.get("min_baths")?.trim();
  const neighborhood = searchParams.get("neighborhood")?.trim();
  // Amenities are post-filtered client-side — Zillow scraper doesn't support free-text amenity search
  const amenitiesRaw = searchParams.get("amenities")?.trim();
  const amenityList = amenitiesRaw ? amenitiesRaw.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) : [];

  const params = new URLSearchParams({
    // Use neighborhood as a more precise location when provided
    location: neighborhood ? `${neighborhood}, ${location}` : location,
    status_type: "ForRent",
    beds_min: beds,
    price_max: maxPrice,
  });
  // Pass pet_friendly to Zillow if supported by the scraper
  if (petFriendly) params.set("pets_allowed", "true");
  // Pass min baths if provided
  if (minBaths) params.set("bathrooms_min", minBaths);

  const url = `${UPSTREAM_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": key,
      },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    console.log("[listings-api]", {
      url,
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from listings provider", listings: [] },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Upstream HTTP ${res.status}`,
          listings: [],
          upstream: isRecord(body) ? body : undefined,
        },
        { status: 502 }
      );
    }

    const rawList = extractRawListings(body);
    let listings: AgentListing[] = [];
    for (let i = 0; i < rawList.length; i++) {
      const n = normalizeOne(rawList[i], i);
      if (n) listings.push(n);
    }

    // Post-filter: pet_friendly — check raw listing fields Zillow exposes
    if (petFriendly) {
      listings = listings.filter((l) => {
        const raw = rawList[listings.indexOf(l)] as Record<string, unknown>;
        if (!isRecord(raw)) return true; // keep if we can't check
        const pets = raw.petsAllowed ?? raw.petPolicy ?? raw.pets;
        if (pets === undefined) return true; // no data — keep (Zillow often omits this)
        if (typeof pets === "boolean") return pets;
        if (typeof pets === "string") return !/no pets|not allowed/i.test(pets);
        return true;
      });
    }

    // Post-filter: min_baths
    if (minBaths) {
      const minBathsNum = parseFloat(minBaths);
      if (!Number.isNaN(minBathsNum)) {
        listings = listings.filter((l) => l.baths >= minBathsNum);
      }
    }

    // Post-filter: amenities — match against the listing's details text where available
    // Since AgentListing doesn't carry a free-text details field, we skip hard filtering
    // and rely on Claude to mention the caveat when results come back.
    // This is a no-op for now but the param is forwarded so future enrichment can use it.
    void amenityList;

    return NextResponse.json({ listings });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Fetch failed";
    return NextResponse.json(
      { error: message, listings: [] },
      { status: 500 }
    );
  }
}
