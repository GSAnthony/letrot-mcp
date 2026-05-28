import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** A follow-up prompt offered to the user after a resource is displayed. */
export interface Suggestion {
  /** Short French label shown on the in-frame chip. */
  label: string;
  /** Natural-language French prompt sent to the assistant when picked. */
  prompt: string;
}

/** Discriminator read by the React app to pick which view to render. */
export type AppView = "program" | "partants" | "favoris" | "confrontation";

/**
 * Build a tool result that carries the view data, follow-up suggestions, and a
 * model-facing instruction so the assistant also surfaces the prompts in chat.
 *
 * - `structuredContent` = `{ view, data, suggestions }` (consumed by the UI).
 * - `content[0]` = the data as JSON (consumed by the model).
 * - `content[1]` = an assistant-only instruction listing the follow-up prompts.
 */
export function buildAppResult(
  view: AppView,
  data: unknown,
  suggestions: Suggestion[],
): CallToolResult {
  const content: CallToolResult["content"] = [
    { type: "text", text: JSON.stringify(data) },
  ];

  if (suggestions.length > 0) {
    const lines = suggestions.map((s) => `• ${s.prompt}`).join("\n");
    content.push({
      type: "text",
      text:
        "Après avoir présenté ce contenu, propose à l'utilisateur ces questions de suivi " +
        "(reformule-les naturellement, en français) :\n" +
        lines,
      annotations: { audience: ["assistant"] },
    });
  }

  return {
    content,
    structuredContent: { view, data, suggestions } as Record<string, unknown>,
  };
}
