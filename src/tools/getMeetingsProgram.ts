import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { fetchJson, LETROT_API_BASE } from "../letrotApi.js";
import { buildAppResult, type Suggestion } from "../suggestions.js";

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

interface ProgramRace {
  id?: string;
  numCourse?: number;
  raceName?: string;
  hippodromeName?: string;
  quinte?: boolean;
}

export async function getMeetingsProgram(): Promise<CallToolResult> {
  const date = todayDate();
  const url = `${LETROT_API_BASE}/meetings/${date}`;

  let meetings: unknown;
  try {
    meetings = await fetchJson(url);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  const data = { date, meetings };
  return buildAppResult("program", data, buildProgramSuggestions(meetings));
}

/** Collect every race across all meetings/reunions of the program payload. */
function collectRaces(meetings: unknown): ProgramRace[] {
  if (!meetings || typeof meetings !== "object") return [];
  const races = (meetings as { races?: ProgramRace[] }).races;
  return Array.isArray(races) ? races : [];
}

function buildProgramSuggestions(meetings: unknown): Suggestion[] {
  const races = collectRaces(meetings);
  if (races.length === 0) return [];

  // Prefer the Quinté+ race, otherwise the first races of the day.
  const quinte = races.find((r) => r.quinte);
  const picks = quinte ? [quinte] : races.slice(0, 2);

  return picks
    .filter((r) => r.id)
    .map((r) => {
      const where = [r.raceName, r.hippodromeName].filter(Boolean).join(" — ");
      return {
        label: `Partants C${r.numCourse ?? "?"}`,
        prompt: `Affiche les partants de la course C${r.numCourse ?? "?"}${where ? ` (${where})` : ""}`,
      };
    });
}
