import { tool, jsonSchema } from "ai";
import { fallbackMockListings } from "@/lib/agentListings";
import type { ScheduledTour, TourRequest } from "@/app/api/schedule-tours/route";

interface TourListing {
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

interface ScheduleToursParams {
  listings: TourListing[];
  tourCount: number;
  userAvailability: string;
}

export function createScheduleToursTool(
  baseUrl: string,
  userEmail: string,
  userName: string
) {
  return tool({
    description:
      "Schedule apartment tours and send calendar invites. Call immediately after searchListings — pass the full listing objects returned by searchListings (not just IDs), pick the top N where N equals tourCount. Do not ask for confirmation first.",
    parameters: jsonSchema<ScheduleToursParams>({
      type: "object",
      properties: {
        listings: {
          type: "array",
          description:
            "Full listing objects from searchListings results (not just IDs — pass the entire object). Top N in priority order, N = tourCount.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              address: { type: "string" },
              price: { type: "string" },
              beds: { type: "number" },
              baths: { type: "number" },
              sqft: { type: "number" },
              imageUrl: { type: "string" },
              url: { type: "string" },
              landlordEmail: { type: "string" },
            },
            required: ["id", "address", "price", "beds", "baths", "sqft", "imageUrl", "url"],
          },
        },
        tourCount: {
          type: "number",
          description: "How many tours to schedule (should match what the user requested)",
        },
        userAvailability: {
          type: "string",
          description:
            "When the user is free, e.g. 'weekday evenings after 6pm', 'Saturday mornings'. Pass exactly what the user said.",
        },
      },
      required: ["listings", "tourCount", "userAvailability"],
    }),
    execute: async ({ listings, tourCount, userAvailability }) => {
      const toursToSchedule = listings.slice(0, tourCount);
      const tourRequests: TourRequest[] = toursToSchedule.map((l) => ({
        listingAddress: l.address,
        listingId: l.id,
        landlordEmail: l.landlordEmail,
        listingUrl: l.url || undefined,
      }));

      try {
        const res = await fetch(`${baseUrl}/api/schedule-tours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tours: tourRequests,
            tenantEmail: userEmail,
            tenantName: userName,
            availabilityNote: userAvailability,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          return { success: false, error: err.error ?? `HTTP ${res.status}`, scheduledTours: [] };
        }
        const data = (await res.json()) as { scheduledTours: ScheduledTour[] };
        const mockById = new Map(fallbackMockListings().map((l) => [l.id, l.address]));
        const enriched: ScheduledTour[] = data.scheduledTours.map((st, i) => {
          const row = toursToSchedule[i];
          const canon = row?.id ? mockById.get(row.id) : undefined;
          return { ...st, listingId: row?.id, address: canon ?? row?.address ?? st.address };
        });
        return { success: true, scheduledTours: enriched, listings: toursToSchedule };
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
          scheduledTours: [],
        };
      }
    },
  });
}
