import { NextRequest, NextResponse } from "next/server";
import type { AgentListing } from "@/lib/agentListings";

const RENTCAST_BASE = "https://api.rentcast.io/v1";

interface RentcastListing {
  id?: string;
  formattedAddress?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  listingAgent?: { email?: string };
}

function normalize(r: RentcastListing, i: number): AgentListing {
  return {
    id: r.id ?? `listing-${i}`,
    address: r.formattedAddress ?? "Address unavailable",
    price: r.price ? `$${Math.round(r.price).toLocaleString("en-US")}/mo` : "Rent N/A",
    beds: r.bedrooms ?? 0,
    baths: r.bathrooms ?? 0,
    sqft: r.squareFootage ?? 0,
    imageUrl: "",
    url: "",
    ...(r.listingAgent?.email ? { landlordEmail: r.listingAgent.email } : {}),
  };
}

export async function GET(request: NextRequest) {
  const key = process.env.RENTCAST_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "RENTCAST_API_KEY is not configured", listings: [], source: "demo" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() || "Brooklyn, NY";
  const maxPrice = searchParams.get("price_max")?.trim() || "5000";
  const beds = searchParams.get("beds_min")?.trim() || "1";
  const minBaths = searchParams.get("min_baths")?.trim();
  const neighborhood = searchParams.get("neighborhood")?.trim();

  // Parse "Brooklyn, NY" → city=Brooklyn, state=NY
  const [rawCity, rawState] = location.split(",").map((s) => s.trim());
  const city = neighborhood || rawCity || "Brooklyn";
  const state = rawState || "NY";

  const params = new URLSearchParams({
    city,
    state,
    status: "Active",
    bedrooms: beds,
    price: `0,${maxPrice}`,
    limit: "10",
  });
  if (minBaths) params.set("bathrooms", minBaths);

  try {
    const res = await fetch(`${RENTCAST_BASE}/listings/rental/long-term?${params}`, {
      headers: { "X-Api-Key": key },
      next: { revalidate: 0 },
    });

    const body = (await res.json()) as unknown;

    if (!res.ok) {
      console.error("[listings-api] Rentcast error", res.status, body);
      return NextResponse.json(
        { error: `Upstream HTTP ${res.status}`, listings: [], source: "demo" },
        { status: 502 }
      );
    }

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ listings: [], source: "demo" });
    }

    const listings: AgentListing[] = (body as RentcastListing[])
      .filter((r) => r.formattedAddress)
      .map(normalize);

    return NextResponse.json({ listings, source: "rentcast" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Fetch failed";
    console.error("[listings-api] fetch error:", message);
    return NextResponse.json(
      { error: message, listings: [], source: "demo" },
      { status: 500 }
    );
  }
}
