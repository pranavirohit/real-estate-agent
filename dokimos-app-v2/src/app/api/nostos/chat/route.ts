import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToCoreMessages, jsonSchema, type Message } from "ai";
import { NextRequest } from "next/server";
import { fallbackMockListings, type AgentListing } from "@/lib/agentListings";
import type { ScheduledTour, TourRequest } from "@/app/api/schedule-tours/route";

export const maxDuration = 60;

const gateway = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY,
});

const model = gateway("anthropic/claude-sonnet-4-5");

const SYSTEM_PROMPT = `You are Nostos, a personal apartment-hunting concierge for NYC. You are warm, opinionated, and deeply knowledgeable about New York City neighborhoods. You handle everything — so the user never has to click buttons or fill out forms.

## Your conversation flow — follow this order strictly:

**STEP 1 — Commute:** Your very first question is always:
"Where do you commute to most days — or are you working from home?"
Wait for the answer before asking anything else.

**STEP 2 — Preferences:** Ask about key must-haves in one message. Cover: bedrooms, must-have amenities (e.g. dishwasher, in-unit laundry, gym, outdoor space), any dealbreakers (no walk-ups, pet policy, specific neighborhoods). You can ask 2–3 questions together here since they're related.

**STEP 3 — Budget + timeline:** Ask for their monthly budget and ideal move-in date.

**STEP 4 — Confirm and count:** Briefly summarize what you heard (commute context, preferences, budget), then ask:
"How many properties would you like to tour? I usually recommend 4–6 so you have real options to compare."

**STEP 5 — Availability:** After you have the tour count, ask exactly this (preserve the line breaks and bullets):
"What days and times work best for you? For example:
• Weekday evenings
• Saturday mornings
• Any weekday after 2pm"
Keep this brief — one question, then wait.

**STEP 6 — Search:** Once you have availability, call searchListings with the criteria you've gathered. Tell the user what you searched for in one sentence.

**STEP 7 — Schedule tours:** After searchListings returns, immediately call scheduleTours with the top N listings and the user's availability note. Do not ask the user to choose — you pick the best matches. Tell the user you're booking the tours right now.

**STEP 8 — Confirm:** After scheduleTours returns, give a warm confirmation. List each property with its date and time, like:
"You're confirmed for these tours:
• [Address] — [Day, Date] at [Time]
• ...
Check your inbox — calendar invites are on their way."

## Rules:
- Never ask more than one phase of questions at a time. One step at a time.
- Sound like a smart, efficient friend — not a form or a search engine. Keep replies concise (2–4 sentences) unless listing out tour schedules.
- Once you have all the info you need, act immediately. Don't ask for confirmation before calling tools.
- Never mention Dokimos, TEE, attestation, blockchain, or identity verification. Just help them find an apartment.
- Present all listings as real and current. Never mention that listings are samples, demos, or placeholders.`;

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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { messages: Message[]; userEmail?: string; userName?: string };
  const { messages, userEmail, userName } = body;
  const coreMessages = convertToCoreMessages(messages);

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:8081";
  const baseUrl = `${proto}://${host}`;

  const result = streamText({
    onError: (event) => {
      console.error("[nostos/chat] streamText error:", event.error);
    },
    model,
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    maxSteps: 8,
    tools: {
      searchListings: tool({
        description: "Search for available rental listings in NYC based on the user's criteria. Call after gathering commute, preferences, budget, and tour count.",
        parameters: jsonSchema<{
          location: string;
          maxPrice: number;
          beds: number;
          petFriendly?: boolean;
          amenities?: string[];
          minBaths?: number;
          neighborhood?: string;
        }>({
          type: "object",
          properties: {
            location: { type: "string", description: "Neighborhood or borough, e.g. 'Brooklyn, NY'" },
            maxPrice: { type: "number", description: "Maximum monthly rent in USD" },
            beds: { type: "number", description: "Minimum number of bedrooms" },
            petFriendly: { type: "boolean" },
            amenities: { type: "array", items: { type: "string" }, description: "Required amenities e.g. dishwasher, gym, doorman" },
            minBaths: { type: "number" },
            neighborhood: { type: "string", description: "Specific neighborhood e.g. Williamsburg, Astoria" },
          },
          required: ["location", "maxPrice", "beds"],
        }),
        execute: async ({ location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood }) => {
          const listings = await fetchListings({ location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood }, baseUrl);
          return { listings };
        },
      }),

      scheduleTours: tool({
        description: "Schedule apartment tours for multiple listings and send calendar invites by email. Call this immediately after searchListings returns — pick the top N listings where N is the tour count the user requested. Pass the user's availability note so tours get scheduled at times that work for them. Do not ask for confirmation first.",
        parameters: jsonSchema<{
          listings: Array<{
            id: string;
            address: string;
            price: string;
            beds: number;
            baths: number;
            sqft: number;
            imageUrl: string;
            url: string;
            landlordEmail?: string;
          }>;
          tourCount: number;
          availabilityNote: string;
        }>({
          type: "object",
          properties: {
            listings: {
              type: "array",
              description: "The top N listings to schedule tours for (in priority order). N should match tourCount.",
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
              description: "Plain-English description of when the user is free, e.g. 'weekday evenings after 6pm', 'Saturday mornings', 'any weekday afternoon'. Pass exactly what the user said.",
            },
          },
          required: ["listings", "tourCount", "availabilityNote"],
        }),
        execute: async ({ listings, tourCount, availabilityNote }) => {
          const tenantEmail = userEmail ?? "demo@nostos-app.com";
          const tenantName = userName ?? tenantEmail.split("@")[0];

          const toursToSchedule = listings.slice(0, tourCount);
          const tourRequests: TourRequest[] = toursToSchedule.map((l) => ({
            listingAddress: l.address,
            landlordEmail: l.landlordEmail,
            listingUrl: l.url || undefined,
          }));

          try {
            const res = await fetch(`${baseUrl}/api/schedule-tours`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tours: tourRequests, tenantEmail, tenantName, availabilityNote }),
            });
            if (!res.ok) {
              const err = (await res.json().catch(() => ({}))) as { error?: string };
              return { success: false, error: err.error ?? `HTTP ${res.status}`, scheduledTours: [] };
            }
            const data = (await res.json()) as { scheduledTours: ScheduledTour[] };
            return { success: true, scheduledTours: data.scheduledTours, listings: toursToSchedule };
          } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : "Unknown error", scheduledTours: [] };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
