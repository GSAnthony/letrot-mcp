import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { extractAppResult } from "../appResult.js";
import { Suggestions } from "./Suggestions.js";
import styles from "./ConfrontationView.module.css";

/** Shape produced by `get_horses_confrontation`. Mirrors `ConfrontationData`. */
interface ConfrontationData {
  raceId: string;
  period: string;
  horses: [HorseRef, HorseRef];
  score: { a: number; b: number };
  encounters: Encounter[];
}

interface HorseRef {
  id: string;
  name: string;
  idCasaque?: string;
}

interface Encounter {
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
  winner: "A" | "B" | "tie" | "none";
}

interface Props {
  app: App;
  initialResult: CallToolResult | null;
  onBack: () => void;
}

function periodLabel(period: string): string {
  switch (period) {
    case "two_year":
      return "Historique des 24 derniers mois";
    case "one_year":
      return "Historique des 12 derniers mois";
    default:
      return `Historique (${period})`;
  }
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function interpret(data: ConfrontationData): string {
  const [a, b] = data.horses;
  const { score } = data;
  if (data.encounters.length === 0) {
    return `${a.name} et ${b.name} ne se sont pas affrontés sur la période retenue.`;
  }
  if (score.a > score.b) {
    return `Sur ${data.encounters.length} confrontation${data.encounters.length > 1 ? "s" : ""}, ${a.name} domine ${b.name} (${score.a} – ${score.b}).`;
  }
  if (score.b > score.a) {
    return `Sur ${data.encounters.length} confrontation${data.encounters.length > 1 ? "s" : ""}, ${b.name} domine ${a.name} (${score.b} – ${score.a}).`;
  }
  return `Sur ${data.encounters.length} confrontation${data.encounters.length > 1 ? "s" : ""}, ${a.name} et ${b.name} sont à égalité (${score.a} – ${score.b}).`;
}

export function ConfrontationView({ app, initialResult, onBack }: Props) {
  const extracted = initialResult ? extractAppResult<ConfrontationData>(initialResult) : null;
  const data = extracted?.data ?? null;
  const suggestions = extracted?.suggestions ?? [];

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>Aucune donnée de confrontation.</div>
      </div>
    );
  }

  const [a, b] = data.horses;
  const advantage =
    data.score.a > data.score.b
      ? `avantage ${a.name}`
      : data.score.b > data.score.a
        ? `avantage ${b.name}`
        : "à égalité";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={onBack} className={styles.back}>
          ← Retour au programme
        </button>
      </header>

      <div className={styles.titleBlock}>
        <span className={styles.eyebrow}>Confrontation directe</span>
        <h1 className={styles.title}>{a.name} vs {b.name}</h1>
        <div className={styles.subtitle}>{periodLabel(data.period)}</div>
      </div>

      <div className={styles.vsCard}>
        <div className={`${styles.horse} ${styles.horseA}`}>
          <div className={styles.horseName}>{a.name}</div>
        </div>
        <div className={styles.center2}>
          <div className={styles.vs}>vs</div>
          <div className={styles.count}>
            {data.encounters.length} confrontation{data.encounters.length > 1 ? "s" : ""}
          </div>
          <div className={styles.score}>{data.score.a} – {data.score.b}</div>
          <div className={styles.advantage}>{advantage}</div>
        </div>
        <div className={`${styles.horse} ${styles.horseB}`}>
          <div className={styles.horseName}>{b.name}</div>
        </div>
      </div>

      {data.encounters.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hippodrome · Course</th>
                <th>Dist.</th>
                <th>{a.name}</th>
                <th>{b.name}</th>
                <th>Vainqueur</th>
              </tr>
            </thead>
            <tbody>
              {data.encounters.map((e, idx) => (
                <tr key={e.raceId || idx}>
                  <td>{formatDate(e.date)}</td>
                  <td>
                    <div>{e.hippodrome || "—"}</div>
                    <div className={styles.subhead}>{e.raceName}</div>
                  </td>
                  <td>{e.distance != null ? `${e.distance} m` : "—"}</td>
                  <td>
                    <div className={styles.pos}>{e.positionA}</div>
                    <div className={styles.subhead}>{e.driverA}</div>
                  </td>
                  <td>
                    <div className={styles.pos}>{e.positionB}</div>
                    <div className={styles.subhead}>{e.driverB}</div>
                  </td>
                  <td>
                    <span
                      className={
                        e.winner === "A"
                          ? styles.winA
                          : e.winner === "B"
                            ? styles.winB
                            : styles.winTie
                      }
                    >
                      {e.winner === "A" ? a.name : e.winner === "B" ? b.name : e.winner === "tie" ? "Égalité" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.interpretation}>
        <span className={styles.interpLabel}>Lecture</span>
        <span>{interpret(data)}</span>
      </div>

      <Suggestions app={app} suggestions={suggestions} />
    </div>
  );
}
