import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fetchJson, LETROT_API_BASE } from "../letrotApi.js";
import { buildAppResult, type Suggestion } from "../suggestions.js";
import type { Partant, RacePartants } from "../types.js";

const PARTANTS_MOCK_PATH = path.join(import.meta.dirname, "../mocks/partants.json");

/** Fetch the partants (starters) of a race from the live Letrot endpoint. */
export async function fetchRacePartants(raceId: string): Promise<RacePartants> {
  const url = `${LETROT_API_BASE}/races/${raceId}/partants`;
  return (await fetchJson(url, { mockPath: PARTANTS_MOCK_PATH })) as RacePartants;
}

export async function getRacePartants(args: { race_id: string }): Promise<CallToolResult> {
  const { race_id } = args;
  if (!race_id) {
    return {
      isError: true,
      content: [{ type: "text", text: "race_id est requis" }],
    };
  }

  let race: RacePartants;
  try {
    race = await fetchRacePartants(race_id);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erreur lors du chargement des partants : ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  return buildAppResult("partants", race, buildPartantsSuggestions(race));
}

/** Top starters used to seed contextual follow-up prompts. */
function rankPartants(partants: Partant[]): Partant[] {
  const running = partants.filter((p) => !p.nonPartant);
  const withOdds = running.filter((p) => (p.rapportProbable ?? 0) > 0);
  if (withOdds.length > 0) {
    return [...withOdds].sort((a, b) => (a.rapportProbable ?? 0) - (b.rapportProbable ?? 0));
  }
  // Pre-race: no odds yet — fall back to trainer opinion then start order.
  return [...running].sort((a, b) => {
    const avis = (b.avisEntraineur ?? 0) - (a.avisEntraineur ?? 0);
    if (avis !== 0) return avis;
    return (a.leavingNumber ?? 0) - (b.leavingNumber ?? 0);
  });
}

function buildPartantsSuggestions(race: RacePartants): Suggestion[] {
  const suggestions: Suggestion[] = [
    { label: "Les favoris", prompt: "Donne-moi les favoris de cette course" },
  ];

  const top = rankPartants(race.partants ?? []);
  if (top.length >= 2) {
    const [a, b] = top;
    suggestions.push({
      label: "Confrontation",
      prompt: `Compare ${a.name} et ${b.name}`,
    });
  }

  return suggestions;
}
