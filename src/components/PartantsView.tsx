import { useEffect, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { extractAppResult, type Suggestion } from "../appResult.js";
import type { Partant, RacePartants } from "../types.js";
import { PartantsTable } from "./PartantsTable.js";
import { Suggestions } from "./Suggestions.js";
import styles from "./PartantsView.module.css";

interface Props {
  app: App;
  raceId: string;
  /** Result from the originating tool call, when partants was the entry view. */
  initialResult?: CallToolResult | null;
  onBack: () => void;
}

export function PartantsView({ app, raceId, initialResult, onBack }: Props) {
  const initial = initialResult ? extractAppResult<RacePartants>(initialResult) : null;
  const [race, setRace] = useState<RacePartants | null>(initial?.data ?? null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initial?.suggestions ?? []);
  const [loading, setLoading] = useState(!initial?.data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (race) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    app
      .callServerTool({ name: "get_race_partants", arguments: { race_id: raceId } })
      .then((result) => {
        if (cancelled) return;
        if (result.isError) {
          const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
          setError(text?.text ?? "Erreur lors du chargement des partants");
          return;
        }
        const extracted = extractAppResult<RacePartants>(result);
        setRace(extracted.data);
        setSuggestions(extracted.suggestions);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [app, raceId, race]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={onBack} className={styles.back}>
          ← Retour au programme
        </button>
      </header>

      {loading && <div className={styles.center}>Chargement des partants…</div>}
      {error && <div className={styles.error}>Erreur : {error}</div>}

      {race && (
        <>
          <div className={styles.raceInfo}>
            <h1 className={styles.raceTitle}>
              C{race.numCourse} — {race.raceName ?? "—"}
            </h1>
            <div className={styles.raceMeta}>
              {race.hippodromeName && <span>{race.hippodromeName}</span>}
              {race.distance != null && <span>· {race.distance} m</span>}
              {race.allocation != null && <span>· {race.allocation.toLocaleString("fr-FR")} €</span>}
              {race.countPartant != null && <span>· {race.countPartant} partants</span>}
            </div>
          </div>
          <PartantsTable partants={(race.partants ?? []) as Partant[]} />
          <Suggestions app={app} suggestions={suggestions} />
        </>
      )}
    </div>
  );
}
