import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getMeetingsProgram } from "./src/tools/getMeetingsProgram.js";
import { getRacePartants } from "./src/tools/getRacePartants.js";
import { getRaceFavoris } from "./src/tools/getRaceFavoris.js";

const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;
const APP_HTML_PATH = path.join(DIST_DIR, "mcp-app.html");

/**
 * Resource URI derived from a hash of the current `mcp-app.html` content.
 * Hosts cache iframe resources by URI; bumping the URI on every UI change
 * forces them to refetch — otherwise a freshly rebuilt UI gets shadowed by a
 * stale cached iframe carrying old routing/views.
 */
const RESOURCE_URI = buildResourceUri();

function buildResourceUri(): string {
  try {
    const buf = fs.readFileSync(APP_HTML_PATH);
    const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10);
    return `ui://letrot/mcp-app-${hash}.html`;
  } catch {
    // Fallback if the HTML isn't on disk yet (dev cold start before vite build).
    return "ui://letrot/mcp-app.html";
  }
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Letrot MCP",
    version: "1.0.0",
  });

  const resourceUri = RESOURCE_URI;

  registerAppTool(
    server,
    "get_meetings_program",
    {
      title: "Letrot — Meetings Program",
      description:
        "Display today's French harness racing (trot) meetings and race program. Click any race to view its partants.",
      inputSchema: {},
      _meta: { ui: { resourceUri } },
    },
    async (): Promise<CallToolResult> => {
      return await getMeetingsProgram();
    },
  );

  registerAppTool(
    server,
    "get_race_partants",
    {
      title: "Letrot — Race Partants",
      description:
        "Display the partants (starters) for a specific race from the Letrot races endpoint. Provide the race_id (format: YYYY-MM-DD-hippodromeNbr-raceNbr), available as the `id` field of each race in get_meetings_program.",
      inputSchema: {
        race_id: z
          .string()
          .describe("Race identifier, e.g. '2026-05-29-7500-1'"),
      },
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      return await getRacePartants(args);
    },
  );

  registerAppTool(
    server,
    "get_race_favoris",
    {
      title: "Letrot — Race Favoris",
      description:
        "Display the top favorites (best probable odds, or trainer opinion when odds are not yet published) for a race. Provide the race_id (same format as get_race_partants).",
      inputSchema: {
        race_id: z
          .string()
          .describe("Race identifier, e.g. '2026-05-29-7500-1'"),
      },
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      return await getRaceFavoris(args);
    },
  );

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fsp.readFile(APP_HTML_PATH, "utf-8");
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      };
    },
  );

  return server;
}
