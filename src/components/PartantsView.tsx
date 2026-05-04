import { useEffect, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { CourseHippodrome, Partant } from "../types.js";
import { PartantsTable } from "./PartantsTable.js";
import styles from "./PartantsView.module.css";

interface Props {
  app: App;
  raceId: string;
  onBack: () => void;
}

function extractRace(result: CallToolResult): CourseHippodrome | null {
  const struct = result.structuredContent as { courseHippodrome?: CourseHippodrome } | undefined;
  if (struct?.courseHippodrome) return struct.courseHippodrome;
  const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
  if (!text?.text) return null;
  try {
    const parsed = JSON.parse(text.text);
    return parsed.courseHippodrome ?? parsed ?? null;
  } catch {
    return null;
  }
}

export function PartantsView({ app, raceId, onBack }: Props) {
  const [course, setCourse] = useState<CourseHippodrome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCourse(null);
    app
      .callServerTool({ name: "get_race_partants", arguments: { race_id: raceId } })
      .then((result) => {
        if (cancelled) return;
        if (result.isError) {
          const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
          setError(text?.text ?? "Erreur lors du chargement des partants");
          return;
        }
        setCourse(extractRace(result));
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
  }, [app, raceId]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={onBack} className={styles.back}>
          ← Retour au programme
        </button>
      </header>

      {loading && <div className={styles.center}>Chargement des partants…</div>}
      {error && <div className={styles.error}>Erreur : {error}</div>}

      {course && (
        <>
          <div className={styles.raceInfo}>
            <h1 className={styles.raceTitle}>
              C{course.numCourse} — {course.prix ?? "—"}
            </h1>
            <div className={styles.raceMeta}>
              <span>{course.nomHippodrome}</span>
              {course.heureCourse && <span>· {course.heureCourse}</span>}
              {course.distance != null && <span>· {course.distance} m</span>}
              {course.allocation != null && <span>· {course.allocation.toLocaleString("fr-FR")} €</span>}
              {course.countPartant != null && <span>· {course.countPartant} partants</span>}
            </div>
          </div>
          <PartantsTable partants={(course.partantList ?? []) as Partant[]} />
        </>
      )}
    </div>
  );
}
