import { tool, jsonSchema } from "ai";
import { dedalusMcpSearch } from "../dedalusProvider";

interface WebSearchParams {
  query: string;
}

/**
 * Live web search, powered by a Dedalus-hosted MCP server (e.g. Exa). The agent
 * calls this like any other tool; under the hood it runs a separate Dedalus
 * completion with `mcp_servers` so the search executes server-side. Returns plain
 * grounded text for the agent to summarize. Degrades to an empty result (with a
 * note) if MCP is unconfigured or the server errors, so the flow never breaks.
 */
export function createWebSearchTool(apiKey: string, mcpServers: string[]) {
  return tool({
    description:
      "Search the live web for current, real-world information (e.g. actual NYC rental listings, current rent prices, neighborhood details). Use this to ground your apartment recommendations in real market data before assembling tours.",
    parameters: jsonSchema<WebSearchParams>({
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "A focused natural-language search query, e.g. 'current 2-bedroom rental listings in Williamsburg Brooklyn under $3500'.",
        },
      },
      required: ["query"],
    }),
    execute: async ({ query }) => {
      const { text, error } = await dedalusMcpSearch(apiKey, mcpServers, query);
      if (!text) {
        return {
          ok: false,
          note: error ?? "web_search_unavailable",
          results: "",
        };
      }
      return { ok: true, results: text, ...(error ? { warning: error } : {}) };
    },
  });
}
