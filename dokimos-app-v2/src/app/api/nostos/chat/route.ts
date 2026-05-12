import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, convertToCoreMessages, jsonSchema, type Message } from "ai";
import { NextRequest } from "next/server";
import { fallbackMockListings, type AgentListing } from "@/lib/agentListings";

export const maxDuration = 30;

const gateway = createOpenAI({
  baseURL: "https://ai-gateway.vercel.sh/v1",
  apiKey: process.env.VERCEL_AI_GATEWAY_KEY,
});

const model = gateway("anthropic/claude-sonnet-4-5");

const SYSTEM_PROMPT = `You are a knowledgeable, opinionated NYC apartment concierge. You know New York City deeply — neighborhoods, subway lines, what streets are actually like to live on, what $2,500/month gets you in Williamsburg versus Crown Heights versus Astoria.

Your job is to help someone find and apply to an apartment. You ask smart clarifying questions before searching — commute destination, must-have amenities, dealbreakers, move-in timeline. You give opinions. If someone asks for "something near the G train under $2,800" you don't just return results, you tell them which listing you'd actually recommend and why.

When you call searchListings, always tell the user what you searched for and why. When results come back, don't just list them — pick a favorite and say so.

When a user says they want to apply to a listing, call submitApplication. Before you do, confirm the address and price with the user in one sentence. Then call the tool. Do not ask them to click anything — you handle it.

If results seem like demo data (addresses like "142 Wythe Ave" with no photos), tell the user you're showing sample listings and the real search would pull live inventory.

Never mention Dokimos, TEE, attestation, blockchain, or cryptographic proof. Just say "we verify your identity securely — no documents get shared, only what the landlord needs to know."

Keep responses concise. Two to four sentences maximum unless the user asks for detail. Sound like a smart friend who knows NYC, not a search engine.`;

interface FetchListingsOptions {
  location: string;
  maxPrice: number;
  beds: number;
  petFriendly?: boolean;
  amenities?: string[];
  minBaths?: number;
  neighborhood?: string;
}

async function fetchListings(
  opts: FetchListingsOptions,
  baseUrl: string
): Promise<AgentListing[]> {
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

    const res = await fetch(`${baseUrl}/api/listings?${params}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { listings?: AgentListing[] };
    const listings = Array.isArray(data.listings) ? data.listings : [];
    if (listings.length === 0) throw new Error("empty");
    return listings.slice(0, 6);
  } catch {
    return fallbackMockListings();
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { messages: Message[] };
  const { messages } = body;
  const coreMessages = convertToCoreMessages(messages);

  // Derive the base URL from the incoming request for internal fetch
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
    maxSteps: 5,
    tools: {
      searchListings: tool({
        description:
          "Search for available rental listings in NYC based on the user's criteria.",
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
            location: {
              type: "string",
              description: "Neighborhood or borough, e.g. 'Brooklyn, NY' or 'Williamsburg, NY'",
            },
            maxPrice: {
              type: "number",
              description: "Maximum monthly rent in USD, e.g. 3000",
            },
            beds: {
              type: "number",
              description: "Minimum number of bedrooms, e.g. 2",
            },
            petFriendly: {
              type: "boolean",
              description: "Whether the listing must allow pets",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              description: "List of required amenities e.g. dishwasher, gym, doorman, outdoor space",
            },
            minBaths: {
              type: "number",
              description: "Minimum number of bathrooms",
            },
            neighborhood: {
              type: "string",
              description: "Specific neighborhood within the city e.g. Williamsburg, Crown Heights, Astoria",
            },
          },
          required: ["location", "maxPrice", "beds"],
        }),
        execute: async ({ location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood }) => {
          const listings = await fetchListings(
            { location, maxPrice, beds, petFriendly, amenities, minBaths, neighborhood },
            baseUrl
          );
          return { listings };
        },
      }),

      submitApplication: tool({
        description:
          "Submit a rental application for a specific listing. Call this when the user explicitly says they want to apply to a listing.",
        parameters: jsonSchema<{
          listing: {
            id: string;
            address: string;
            price: string;
            beds: number;
            baths: number;
            sqft: number;
            imageUrl: string;
            url: string;
          };
        }>({
          type: "object",
          properties: {
            listing: {
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
              },
              required: ["id", "address", "price", "beds", "baths", "sqft", "imageUrl", "url"],
            },
          },
          required: ["listing"],
        }),
        // No execute — this is a client-side tool handled by onToolCall in useChat
      }),
    },
  });

  return result.toDataStreamResponse();
}
