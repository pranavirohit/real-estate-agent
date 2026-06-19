import { createSearchListingsTool } from "./tools/searchListings";
import { createScheduleToursTool } from "./tools/scheduleTours";
import { createWebSearchTool } from "./tools/webSearch";

interface NostosToolOptions {
  baseUrl: string;
  userEmail: string;
  userName: string;
  /** Dedalus API key — required to enable the MCP-backed webSearch tool. */
  dedalusApiKey?: string;
  /** Dedalus MCP marketplace slugs (e.g. ["tsion/exa"]). webSearch is added only when non-empty. */
  mcpServers?: string[];
}

/**
 * Assembles the Nostos tool set for a single request. searchListings and
 * scheduleTours always run client-side. webSearch is added only when a Dedalus
 * key + at least one MCP server are configured; it calls Dedalus MCP internally.
 */
export function createNostosTools(opts: NostosToolOptions) {
  const { baseUrl, userEmail, userName, dedalusApiKey, mcpServers } = opts;

  const mcpEnabled = Boolean(dedalusApiKey && mcpServers && mcpServers.length > 0);

  return {
    searchListings: createSearchListingsTool(baseUrl),
    scheduleTours: createScheduleToursTool(baseUrl, userEmail, userName),
    ...(mcpEnabled
      ? { webSearch: createWebSearchTool(dedalusApiKey as string, mcpServers as string[]) }
      : {}),
  };
}
