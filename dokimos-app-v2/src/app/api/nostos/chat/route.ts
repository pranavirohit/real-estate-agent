import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, type Message } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { NOSTOS_SYSTEM_PROMPT } from "@/agent/systemPrompt";
import { createNostosTools } from "@/agent/toolRegistry";

export const maxDuration = 60;

/** Vercel often rejects user-defined env vars named `VERCEL_*`; use `AI_GATEWAY_API_KEY` in production. */
function resolveAiGatewayApiKey(): string | undefined {
  const key =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_AI_GATEWAY_KEY?.trim();
  return key || undefined;
}

export async function POST(req: NextRequest) {
  const apiKey = resolveAiGatewayApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Nostos chat is not configured. Set AI_GATEWAY_API_KEY (Vercel AI Gateway token) in the environment.",
      },
      { status: 503 }
    );
  }

  const gateway = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey,
  });
  const model = gateway("anthropic/claude-sonnet-4-5");

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
