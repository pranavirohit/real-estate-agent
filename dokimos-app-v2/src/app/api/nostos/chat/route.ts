import { streamText, convertToCoreMessages, type Message } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { NOSTOS_SYSTEM_PROMPT } from "@/agent/systemPrompt";
import { createNostosTools } from "@/agent/toolRegistry";
import {
  createDedalusClient,
  createVercelGatewayClient,
  resolveMcpServers,
} from "@/agent/dedalusProvider";

export const maxDuration = 60;

const NOSTOS_MODEL = "anthropic/claude-sonnet-4-5";

type ProviderName = "dedalus" | "vercel";

interface ResolvedModel {
  model: ReturnType<ReturnType<typeof createDedalusClient>>;
  providerName: ProviderName;
  dedalusApiKey?: string;
  mcpServers: string[];
}

/**
 * Prefer Dedalus (model routing + MCP-backed tools); fall back to the Vercel AI
 * Gateway if no Dedalus key is present. Both are OpenAI-compatible, so the
 * streamText + client-side tools pipeline is identical either way. MCP is exposed
 * via the webSearch tool (Dedalus path only), not top-level mcp_servers, because
 * server-side MCP deltas don't compose with the AI SDK's client tool protocol.
 */
function resolveModel(): ResolvedModel | undefined {
  const dedalusKey = process.env.DEDALUS_API_KEY?.trim();
  if (dedalusKey) {
    const client = createDedalusClient(dedalusKey);
    return {
      model: client(NOSTOS_MODEL),
      providerName: "dedalus",
      dedalusApiKey: dedalusKey,
      mcpServers: resolveMcpServers(),
    };
  }

  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_KEY?.trim();
  if (gatewayKey) {
    const client = createVercelGatewayClient(gatewayKey);
    return { model: client(NOSTOS_MODEL), providerName: "vercel", mcpServers: [] };
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  const resolved = resolveModel();
  if (!resolved) {
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
    model: resolved.model,
    system: NOSTOS_SYSTEM_PROMPT,
    messages: coreMessages,
    maxSteps: 8,
    tools: createNostosTools({
      baseUrl,
      userEmail: tenantEmail,
      userName: tenantName,
      dedalusApiKey: resolved.dedalusApiKey,
      mcpServers: resolved.mcpServers,
    }),
  });

  return result.toDataStreamResponse();
}
