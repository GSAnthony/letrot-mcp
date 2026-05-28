import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface Suggestion {
  label: string;
  prompt: string;
}

export type AppView = "program" | "partants" | "favoris" | "confrontation";

export interface AppResult<T = unknown> {
  view?: AppView;
  data: T | null;
  suggestions: Suggestion[];
}

/**
 * Normalize a tool result into `{ view, data, suggestions }`. Prefers
 * `structuredContent` (the shape produced by `buildAppResult` on the server)
 * and falls back to parsing the first text content block as the data.
 */
export function extractAppResult<T = unknown>(result: CallToolResult): AppResult<T> {
  const struct = result.structuredContent as
    | { view?: AppView; data?: T; suggestions?: Suggestion[] }
    | undefined;

  if (struct && "data" in struct) {
    return {
      view: struct.view,
      data: (struct.data ?? null) as T | null,
      suggestions: struct.suggestions ?? [],
    };
  }

  const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
  if (text?.text) {
    try {
      return { data: JSON.parse(text.text) as T, suggestions: [] };
    } catch {
      /* fall through */
    }
  }
  return { data: null, suggestions: [] };
}
