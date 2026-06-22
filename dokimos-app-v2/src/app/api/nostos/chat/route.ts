import { streamText, convertToCoreMessages, type Message } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { NOSTOS_SYSTEM_PROMPT } from "@/agent/systemPrompt";
import { createNostosTools } from "@/agent/toolRegistry";
import { createDedalusClient, createVercelGatewayClient } from "@/agent/dedalusProvider";

export const maxDuration = 60;

const NOSTOS_MODEL = "anthropic/claude-sonnet-4-5";

function resolveModel() {
  const dedalusKey = process.env.DEDALUS_API_KEY?.trim();
  if (dedalusKey) {
    return createDedalusClient(dedalusKey)(NOSTOS_MODEL);
  }

  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_KEY?.trim();
  if (gatewayKey) {
    return createVercelGatewayClient(gatewayKey)(NOSTOS_MODEL);
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  const model = resolveModel();
  if (!model) {
    return NextResponse.json(
      {
        error:
          "Nostos chat is not configured. Set DEDALUS_API_KEY (preferred) or AI_GATEWAY_API_KEY in the environment.",
      },
      { status: 503 }
    );
  }

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
    maxSteps: 12,
    tools: createNostosTools({
      baseUrl,
      userEmail: tenantEmail,
      userName: tenantName,
    }),
  });

  return result.toDataStreamResponse();
}
