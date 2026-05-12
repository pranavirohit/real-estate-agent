import { NextRequest, NextResponse } from "next/server";
import { getTeeEndpoint } from "@/lib/teeEndpoint";
import { saveTourDate } from "@/lib/tourDateStore";
import { normalizeListingAddress } from "@/lib/listingAddressNormalize";

interface BookListing {
  listingId: string;
  listingAddress: string;
  tourDate?: string;
}

interface BookBody {
  tenantEmail?: string;
  tenantName?: string;
  attestationRequestId?: string;
  listings?: BookListing[];
}

interface TeeBookResponse {
  applications?: Array<{ applicationId: string; listingAddress: string }>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BookBody;

  const TEE_ENDPOINT = getTeeEndpoint();
  const resp = await fetch(`${TEE_ENDPOINT}/api/nostos/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await resp.json()) as TeeBookResponse;

  // After TEE assigns applicationIds, save the tourDate for each one.
  if (Array.isArray(data.applications) && Array.isArray(body.listings)) {
    for (const app of data.applications) {
      const listing = body.listings.find(
        (l) =>
          l.listingAddress === app.listingAddress ||
          normalizeListingAddress(l.listingAddress) === normalizeListingAddress(app.listingAddress)
      );
      if (listing?.tourDate) {
        saveTourDate(app.applicationId, listing.tourDate);
      }
    }
  }

  return NextResponse.json(data, { status: resp.status });
}
