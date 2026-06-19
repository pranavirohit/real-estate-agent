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
  availabilityNote: string;
}

export function createScheduleToursTool(
  baseUrl: string,
  userEmail: string,
  userName: string
) {
  return tool({
    description:
      "Schedule apartment tours for multiple listings and send calendar invites by email. Call this immediately after searchListings returns — pick the top N listings where N is the tour count the user requested. Pass the user's availability note so tours get scheduled at times that work for them. Do not ask for confirmation first.",
    parameters: jsonSchema<ScheduleToursParams>({
      type: "object",
      properties: {
        listings: {
          type: "array",
          description:
            "The top N listings to schedule tours for (in priority order). N should match tourCount.",
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
        availabilityNote: {
          type: "string",
          description:
            "Plain-English description of when the user is free, e.g. 'weekday evenings after 6pm', 'Saturday mornings', 'any weekday afternoon'. Pass exactly what the user said.",
        },
      },
      required: ["listings", "tourCount", "availabilityNote"],
    }),
    execute: async ({ listings, tourCount, availabilityNote }) => {
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
            availabilityNote,
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
