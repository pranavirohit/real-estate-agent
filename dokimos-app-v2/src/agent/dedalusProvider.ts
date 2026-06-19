import { createOpenAI } from "@ai-sdk/openai";

export const DEDALUS_BASE_URL = "https://api.dedaluslabs.ai/v1";
export const VERCEL_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/**
 * Main streaming client for the chat route. No top-level `mcp_servers` here:
 * server-side MCP tool calls don't compose with the Vercel AI SDK's client-side
 * tool protocol (the SDK throws NoSuchToolError on MCP tool deltas it can't map).
 * MCP is instead exposed as a dedicated client tool — see `dedalusMcpSearch`.
 */
export function createDedalusClient(apiKey: string) {
  return createOpenAI({ baseURL: DEDALUS_BASE_URL, apiKey });
}

/** Vercel AI Gateway fallback. No MCP support — plain OpenAI-compatible passthrough. */
export function createVercelGatewayClient(apiKey: string) {
  return createOpenAI({ baseURL: VERCEL_GATEWAY_BASE_URL, apiKey });
}

/** Parse the comma-separated NOSTOS_MCP_SERVERS env var into a clean slug list. */
export function resolveMcpServers(): string[] {
  const raw = process.env.NOSTOS_MCP_SERVERS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Accumulate assistant content deltas from an OpenAI-style SSE stream. */
async function readSseContent(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string | null } }>;
        };
        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === "string") text += delta;
      } catch {
        // Partial/non-JSON SSE line — skip.
      }
    }
  }
  return text.trim();
}

/**
 * Run a Dedalus completion with hosted MCP servers attached and return the answer
 * as plain text. Dedalus executes the MCP tools (e.g. Exa web search) server-side
 * and folds the results into the response. MCP completions require `stream: true`,
 * so we consume the SSE stream and assemble the content. This is the clean way to
 * use MCP from inside a Vercel AI SDK tool: the MCP work happens in a separate
 * request, so the streaming agent only ever sees this as a normal client tool.
 */
export async function dedalusMcpSearch(
  apiKey: string,
  mcpServers: string[],
  query: string,
  model = "anthropic/claude-sonnet-4-5"
): Promise<{ text: string; error?: string }> {
  if (mcpServers.length === 0) {
    return { text: "", error: "no_mcp_servers_configured" };
  }
  try {
    const res = await fetch(`${DEDALUS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        mcp_servers: mcpServers,
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant. Use the available web search tools to find current, real information. Answer concisely with concrete facts (names, addresses, prices, dates) and cite sources inline where possible.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      return { text: "", error: `dedalus_http_${res.status}: ${body.slice(0, 200)}` };
    }

    const text = await readSseContent(res.body);
    return { text };
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : "unknown_error" };
  }
}
