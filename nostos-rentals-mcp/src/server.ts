import "dotenv/config";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { searchRentals, findDemoListing } from "./listings.js";

const SERVER_NAME = "nostos-rentals";
const SERVER_VERSION = "1.0.0";

/** Build a fresh MCP server with the rental tools registered. */
function buildMcpServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "search_rentals",
    {
      title: "Search NYC rentals",
      description:
        "Search for rental apartments in New York City by location, budget, and bedrooms. Returns structured listings (id, address, price, beds, baths, image, url). Uses live Zillow data when configured, otherwise demo listings.",
      inputSchema: {
        location: z
          .string()
          .describe("Borough or city, e.g. 'Brooklyn, NY'. Use this for the broad area."),
        maxPrice: z.number().describe("Maximum monthly rent in USD."),
        beds: z.number().describe("Minimum number of bedrooms."),
        minBaths: z.number().optional().describe("Minimum number of bathrooms."),
        neighborhood: z
          .string()
          .optional()
          .describe("Specific neighborhood, e.g. 'Williamsburg'."),
        petFriendly: z.boolean().optional().describe("Only return pet-friendly listings."),
      },
    },
    async (args) => {
      const result = await searchRentals({
        location: args.location,
        maxPrice: args.maxPrice,
        beds: args.beds,
        minBaths: args.minBaths,
        neighborhood: args.neighborhood,
        petFriendly: args.petFriendly,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    }
  );

  server.registerTool(
    "get_listing",
    {
      title: "Get a rental listing by id",
      description:
        "Fetch a single rental listing by its id (as returned by search_rentals). Useful for confirming details before scheduling a tour.",
      inputSchema: {
        id: z.string().describe("The listing id, e.g. 'wythe-3b'."),
      },
    },
    async (args) => {
      const listing = findDemoListing(args.id);
      if (!listing) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ found: false, id: args.id }, null, 2) },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(listing, null, 2) }],
        structuredContent: listing as unknown as Record<string, unknown>,
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: SERVER_NAME, version: SERVER_VERSION });
});

// Stateless Streamable HTTP: a fresh server + transport per request.
app.post("/mcp", async (req: Request, res: Response) => {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[nostos-rentals-mcp] request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless mode doesn't support server-initiated streams over GET/DELETE.
const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => {
  console.log(`[nostos-rentals-mcp] Streamable HTTP MCP server on http://localhost:${port}/mcp`);
});
