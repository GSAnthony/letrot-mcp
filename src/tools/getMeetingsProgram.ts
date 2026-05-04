import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const LETROT_API_BASE = "https://www.letrot.com/v1/api";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getMeetingsProgram(): Promise<CallToolResult> {
  const date = todayDate();
  const url = `${LETROT_API_BASE}/meetings/${date}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Letrot API returned ${response.status} ${response.statusText} for ${url}`,
        },
      ],
    };
  }

  const data = await response.json();

  return {
    content: [
      { type: "text", text: JSON.stringify({ date, meetings: data }) },
    ],
    structuredContent: { date, meetings: data },
  };
}
