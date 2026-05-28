import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fetchJson, LETROT_API_BASE } from "../letrotApi.js";
import { buildAppResult, type Suggestion } from "../suggestions.js";
import { fetchRacePartants } from "./getRacePartants.js";

const CP_MOCK_PATH = path.join(import.meta.dirname, "../mocks/cross-performance.json");
const DEFAULT_PERIOD = "two_year";

/** Raw partant entry inside an encounter returned by cross-performance. */
interface CpPartant {
  id?: string;
  name?: string;
  driver?: string;
  coach?: string;
  idCasaque?: string;
  rang?: string;
  leavingNumber?: number;
  temps?: string;
  reduction?: string;
  allocation?: number;
}

interface CpProgramInfo {
  dateCourse?: string;
  hippodromeName?: string;
  raceName?: string;
  distance?: number;
  discipline?: string;
  allocation?: number;
  numCourse?: number;
  numReunion?: number;
}

/** Raw shape of one item in the cross-performance array. */
interface CpEncounter {
  id?: string;
  numero?: number;
  partants?: CpPartant[];
  programCourseInfo?: CpProgramInfo;
}

/** Reference to one of the two compared horses, surfaced in the view header. */
export interface HorseRef {
  id: string;
  name: string;
  idCasaque?: string;
}

/** A single shared past race between the two queried horses. */
export interface Encounter {
  raceId: string;
  date: string;
  hippodrome: string;
  raceName: string;
  distance: number | null;
  discipline: string;
  allocation: number | null;
  positionA: string;
  positionB: string;
  driverA: string;
  driverB: string;
  /** "A" / "B" if one finished strictly ahead; "tie" if equal; "none" if neither finished. */
  winner: "A" | "B" | "tie" | "none";
}

export interface ConfrontationData {
  raceId: string;
  period: string;
  horses: [HorseRef, HorseRef];
  score: { a: number; b: number };
  encounters: Encounter[];
}

interface Args {
  race_id: string;
  horse_ids?: [string, string] | string[];
  horse_names?: [string, string] | string[];
  period?: string;
}

export async function getHorsesConfrontation(args: Args): Promise<CallToolResult> {
  const { race_id } = args;
  if (!race_id) {
    return { isError: true, content: [{ type: "text", text: "race_id est requis" }] };
  }

  // Pull the current race's partants once: we need them to (a) resolve names →
  // ids if the caller gave names, and (b) get the canonical horse name + silks
  // even when the cross-performance response itself doesn't carry them.
  let racePartants: Awaited<ReturnType<typeof fetchRacePartants>>;
  try {
    racePartants = await fetchRacePartants(race_id);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erreur lors du chargement des partants de la course : ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  let horses: [HorseRef, HorseRef];
  try {
    horses = pickHorses(racePartants.partants ?? [], args);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Impossible d'identifier les deux chevaux : ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  const ids: [string, string] = [horses[0].id, horses[1].id];

  const period = args.period ?? DEFAULT_PERIOD;
  const url =
    `${LETROT_API_BASE}/races/${race_id}/cross-performance` +
    `?period=${encodeURIComponent(period)}` +
    `&horseIds[]=${encodeURIComponent(ids[0])}&horseIds[]=${encodeURIComponent(ids[1])}`;

  let raw: CpEncounter[];
  try {
    raw = (await fetchJson(url, { mockPath: CP_MOCK_PATH })) as CpEncounter[];
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erreur lors du chargement de la confrontation : ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  const data = summarize(race_id, horses, period, Array.isArray(raw) ? raw : []);
  return buildAppResult("confrontation", data, buildSuggestions(data));
}

/**
 * Resolve the two queried horses against the current race's partants list —
 * supports both explicit ids and names, and returns rich `HorseRef`s (name +
 * silks) so the view stays readable even when cross-performance is sparse.
 */
function pickHorses(
  partants: Array<{ id?: string; name?: string; idCasaque?: string }>,
  args: Args,
): [HorseRef, HorseRef] {
  const byId = (id: string): HorseRef => {
    const hit = partants.find((p) => p.id === id);
    return { id, name: hit?.name ?? id, idCasaque: hit?.idCasaque };
  };
  if (args.horse_ids && args.horse_ids.length >= 2 && args.horse_ids[0] && args.horse_ids[1]) {
    return [byId(args.horse_ids[0]), byId(args.horse_ids[1])];
  }
  if (args.horse_names && args.horse_names.length >= 2) {
    const lookup = (needle: string): HorseRef => {
      const n = needle.trim().toLowerCase();
      const hit = partants.find((p) => (p.name ?? "").trim().toLowerCase() === n);
      if (!hit?.id) {
        throw new Error(`Cheval introuvable parmi les partants : "${needle}"`);
      }
      return { id: hit.id, name: hit.name ?? hit.id, idCasaque: hit.idCasaque };
    };
    return [lookup(args.horse_names[0]), lookup(args.horse_names[1])];
  }
  throw new Error("Fournis horse_ids (deux ids) ou horse_names (deux noms).");
}

function summarize(
  raceId: string,
  horsesIn: [HorseRef, HorseRef],
  period: string,
  encountersRaw: CpEncounter[],
): ConfrontationData {
  const horses: [HorseRef, HorseRef] = [{ ...horsesIn[0] }, { ...horsesIn[1] }];
  const ids: [string, string] = [horses[0].id, horses[1].id];
  const encounters: Encounter[] = [];
  let scoreA = 0;
  let scoreB = 0;

  for (const enc of encountersRaw) {
    const partants = enc.partants ?? [];
    const a = partants.find((p) => p.id === ids[0]);
    const b = partants.find((p) => p.id === ids[1]);
    if (!a || !b) continue;

    // Secondary backfill — used when the race partants endpoint isn't live yet
    // and `pickHorses` couldn't enrich the refs from the current race.
    if (horses[0].name === horses[0].id && a.name) {
      horses[0] = { id: a.id!, name: a.name, idCasaque: a.idCasaque ?? horses[0].idCasaque };
    }
    if (horses[1].name === horses[1].id && b.name) {
      horses[1] = { id: b.id!, name: b.name, idCasaque: b.idCasaque ?? horses[1].idCasaque };
    }

    const winner = compareRang(a.rang, b.rang);
    if (winner === "A") scoreA++;
    else if (winner === "B") scoreB++;

    const info = enc.programCourseInfo ?? {};
    encounters.push({
      raceId: enc.id ?? "",
      date: info.dateCourse ?? "",
      hippodrome: info.hippodromeName ?? "",
      raceName: info.raceName ?? "",
      distance: info.distance ?? null,
      discipline: info.discipline ?? "",
      allocation: info.allocation ?? null,
      positionA: (a.rang ?? "").trim() || "—",
      positionB: (b.rang ?? "").trim() || "—",
      driverA: a.driver ?? "",
      driverB: b.driver ?? "",
      winner,
    });
  }

  // Most recent first.
  encounters.sort((x, y) => (y.date > x.date ? 1 : y.date < x.date ? -1 : 0));

  return {
    raceId,
    period,
    horses,
    score: { a: scoreA, b: scoreB },
    encounters,
  };
}

/** Parse a `rang` string ("1 ", "DA", "0", …) into a finishing position. */
function rankValue(rang: string | undefined): number | null {
  if (!rang) return null;
  const trimmed = rang.trim();
  if (!trimmed) return null;
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num) && num > 0) return num;
  // Non-classed / disqualified / fell — treat as "did not finish".
  return null;
}

function compareRang(a: string | undefined, b: string | undefined): Encounter["winner"] {
  const ra = rankValue(a);
  const rb = rankValue(b);
  if (ra == null && rb == null) return "none";
  if (ra == null) return "B";
  if (rb == null) return "A";
  if (ra < rb) return "A";
  if (rb < ra) return "B";
  return "tie";
}

function buildSuggestions(_data: ConfrontationData): Suggestion[] {
  return [
    {
      label: "Retour aux partants",
      prompt: "Affiche tous les partants de cette course",
    },
    {
      label: "Les favoris",
      prompt: "Donne-moi les favoris de cette course",
    },
  ];
}
