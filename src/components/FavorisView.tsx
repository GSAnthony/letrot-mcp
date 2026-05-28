import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { extractAppResult } from "../appResult.js";
import type { Partant } from "../types.js";
import { Suggestions } from "./Suggestions.js";
import styles from "./FavorisView.module.css";

/** Shape produced by the `get_race_favoris` tool. Mirrors `RaceFavoris` server-side. */
interface FavorisData {
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

interface Props {
  app: App;
  initialResult: CallToolResult | null;
  onBack: () => void;
}

function formatEuro(raw: string | undefined): string {
  if (!raw) return "—";
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  return `${n.toLocaleString("fr-FR")} €`;
}

function sexeAge(p: Partant): string {
  return `${p.sexe ?? ""}${p.age ?? ""}` || "—";
}

export function FavorisView({ app, initialResult, onBack }: Props) {
  const extracted = initialResult ? extractAppResult<FavorisData>(initialResult) : null;
  const data = extracted?.data ?? null;
  const suggestions = extracted?.suggestions ?? [];

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>Aucune donnée de favoris.</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" onClick={onBack} className={styles.back}>
          ← Retour au programme
        </button>
      </header>

      <div className={styles.titleBlock}>
        <span className={styles.eyebrow}>Sélection · Top {data.favoris.length}</span>
        <h1 className={styles.title}>Les favoris</h1>
        <div className={styles.subtitle}>
          {data.hippodromeName && <span>{data.hippodromeName}</span>}
          {data.raceName && <span> · {data.raceName}</span>}
          {data.numCourse != null && <span> · C{data.numCourse}</span>}
        </div>
        <div className={styles.counter}>
          {data.favoris.length} sélections sur {data.totalPartants} partants
        </div>
      </div>

      <div className={styles.cards}>
        {data.favoris.map((p, idx) => (
          <article
            key={p.id ?? idx}
            className={`${styles.card} ${idx === 0 ? styles.top : ""}`}
          >
            <div className={styles.rank}>
              <span className={styles.rankNum}>{idx + 1}</span>
              <span className={styles.rankLabel}>{idx === 0 ? "Favori" : `${idx + 1}ᵉ`}</span>
            </div>
            <div className={styles.body}>
              <div className={styles.row1}>
                <span className={styles.num}>N°{p.leavingNumber ?? "—"}</span>
                <h2 className={styles.name}>{p.name ?? "—"}</h2>
                <span className={styles.sa}>{sexeAge(p)}</span>
                {p.ferrure && <span className={styles.fer}>Fer : {p.ferrure}</span>}
              </div>
              <div className={styles.meta}>
                <div>
                  <span className={styles.label}>Driver :</span> {p.driver ?? "—"}
                </div>
                <div>
                  <span className={styles.label}>Record :</span> {p.record ?? "—"}
                </div>
                <div>
                  <span className={styles.label}>Gains :</span> {formatEuro(p.earnings)}
                </div>
                <div>
                  <span className={styles.label}>Rap. prob. :</span>{" "}
                  {p.rapportProbable ? p.rapportProbable.toFixed(1) : "—"}
                </div>
              </div>
              {p.song && (
                <div className={styles.musique}>
                  <span className={styles.label}>Musique :</span> {p.song}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <Suggestions app={app} suggestions={suggestions} />
    </div>
  );
}
