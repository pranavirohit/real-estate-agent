import { NextResponse } from "next/server";
import axios from "axios";
import { axiosErrorResponse, logApiError } from "@/lib/safeLog";
import { getTeeEndpoint } from "@/lib/teeEndpoint";
import { getTourDate } from "@/lib/tourDateStore";

export async function GET() {
  try {
    const TEE_ENDPOINT = getTeeEndpoint();

    const response = await axios.get<unknown[]>(
      `${TEE_ENDPOINT}/api/rental-applications`,
      { timeout: 10000, headers: { "Content-Type": "application/json" } }
    );

    const records = Array.isArray(response.data) ? response.data : [];

    // Enrich each record with its scheduled tour date if we have one stored.
    const enriched = records.map((rec) => {
      const r = rec as Record<string, unknown>;
      const teeTour =
        typeof r.tourDate === "string" && r.tourDate.trim() !== ""
          ? r.tourDate.trim()
          : undefined;
      const storedTour =
        typeof r.applicationId === "string"
          ? getTourDate(r.applicationId)
          : undefined;
      const tourDate = teeTour ?? storedTour;
      return tourDate ? { ...r, tourDate } : r;
    });

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    logApiError("List rental applications failed", error);
    const { message, status } = axiosErrorResponse(
      error,
      "Failed to load applications."
    );
    return NextResponse.json({ error: message }, { status });
  }
}
