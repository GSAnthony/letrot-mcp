import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getMeetingsProgram } from "./src/tools/getMeetingsProgram.js";
import { getRacePartants } from "./src/tools/getRacePartants.js";

const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Letrot MCP",
    version: "1.0.0",
  });

  const resourceUri = "ui://letrot/mcp-app.html";

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

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
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
