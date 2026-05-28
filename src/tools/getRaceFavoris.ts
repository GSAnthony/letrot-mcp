import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { buildAppResult, type Suggestion } from "../suggestions.js";
import type { Partant, RacePartants } from "../types.js";
import { fetchRacePartants, rankPartants } from "./getRacePartants.js";

const FAVORIS_COUNT = 5;

/**
 * Race summary and the top-N starters considered favorites — used to render the
 * "Sélection · Top 5" view. Selection is by probable odds when available,
 * otherwise by trainer opinion (see {@link rankPartants}).
 */
export interface RaceFavoris {
  id?: string;
  raceName?: string;
  numCourse?: number;
  hippodromeName?: string;
  discipline?: string;
  distance?: number;
  allocation?: number;
  countPartant?: number;
  totalPartants: number;
  favoris: Partant[];
}

export async function getRaceFavoris(args: { race_id: string }): Promise<CallToolResult> {
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
          text: `Erreur lors du chargement des favoris : ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  const all = race.partants ?? [];
  const favoris = rankPartants(all).slice(0, FAVORIS_COUNT);

  const data: RaceFavoris = {
    id: race.id,
    raceName: race.raceName,
    numCourse: race.numCourse,
    hippodromeName: race.hippodromeName,
    discipline: race.discipline,
    distance: race.distance,
    allocation: race.allocation,
    countPartant: race.countPartant,
    totalPartants: all.length,
    favoris,
  };

  return buildAppResult("favoris", data, buildFavorisSuggestions(data));
}

function buildFavorisSuggestions(data: RaceFavoris): Suggestion[] {
  const suggestions: Suggestion[] = [];
  if (data.favoris.length >= 2) {
    const [a, b] = data.favoris;
    suggestions.push({
      label: "Confrontation",
      prompt: `Compare ${a.name} et ${b.name}`,
    });
  }
  suggestions.push({
    label: "Tous les partants",
    prompt: "Affiche tous les partants de cette course",
  });
  return suggestions;
}
