import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, type Message } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { NOSTOS_SYSTEM_PROMPT } from "@/agent/systemPrompt";
import { createNostosTools } from "@/agent/toolRegistry";

export const maxDuration = 60;

const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";
const VERCEL_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
const NOSTOS_MODEL = "anthropic/claude-sonnet-4-5";

interface ChatProvider {
  baseURL: string;
  apiKey: string;
  name: "dedalus" | "vercel";
}

/**
 * Prefer Dedalus (model-routing layer); fall back to the Vercel AI Gateway if no
 * Dedalus key is present. Both expose an OpenAI-compatible endpoint, so the rest of
 * the streamText + tools pipeline is identical regardless of which one is used.
 * Note: Vercel often rejects user-defined env vars named `VERCEL_*`; use the
 * documented names below in production.
 */
function resolveChatProvider(): ChatProvider | undefined {
  const dedalusKey = process.env.DEDALUS_API_KEY?.trim();
  if (dedalusKey) {
    return { baseURL: DEDALUS_BASE_URL, apiKey: dedalusKey, name: "dedalus" };
  }
  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_KEY?.trim();
  if (gatewayKey) {
    return { baseURL: VERCEL_GATEWAY_BASE_URL, apiKey: gatewayKey, name: "vercel" };
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const provider = resolveChatProvider();
  if (!provider) {
    return NextResponse.json(
      {
        error:
          "Nostos chat is not configured. Set DEDALUS_API_KEY (preferred) or AI_GATEWAY_API_KEY in the environment.",
      },
      { status: 503 }
    );
  }

  const client = createOpenAI({
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  });
  const model = client(NOSTOS_MODEL);

  const body = (await req.json()) as { messages: Message[]; userEmail?: string; userName?: string };
  const { messages, userEmail, userName } = body;
  const coreMessages = convertToCoreMessages(messages);

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:8081";
  const baseUrl = `${proto}://${host}`;

  const tenantEmail = userEmail ?? "demo@nostos-app.com";
  const tenantName = userName ?? tenantEmail.split("@")[0];

  const result = streamText({
    onError: (event) => {
      console.error("[nostos/chat] streamText error:", event.error);
    },
    model,
    system: NOSTOS_SYSTEM_PROMPT,
    messages: coreMessages,
    maxSteps: 8,
    tools: createNostosTools(baseUrl, tenantEmail, tenantName),
  });

  return result.toDataStreamResponse();
}
