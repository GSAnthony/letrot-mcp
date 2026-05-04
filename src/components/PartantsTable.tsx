import type { Partant } from "../types.js";
import styles from "./PartantsTable.module.css";

interface Props {
  partants: Partant[];
}

const AVIS_COLOR: Record<number, string> = {
  1: "var(--color-avis-1)",
  2: "var(--color-avis-2)",
  3: "var(--color-avis-3)",
};

function formatEuro(n: number | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR")} €`;
}

export function PartantsTable({ partants }: Props) {
  const sorted = [...partants].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>N°</th>
            <th>Cheval<br /><span className={styles.subhead}>Crack series au Partant</span></th>
            <th>Fer</th>
            <th>SA</th>
            <th>Distance</th>
            <th>Pds</th>
            <th>Jockey<br /><span className={styles.subhead}>Entraineur</span></th>
            <th>Avis<br />Entraineur</th>
            <th>Musique</th>
            <th>Record absolu<br /><span className={styles.subhead}>Spécialité</span></th>
            <th>Gains</th>
            <th>Moy. Gains<br />en France</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => {
            const isOut = p.nonPartant;
            return (
              <tr key={p.numSire ?? idx} className={isOut ? styles.nonPartant : ""}>
                <td className={styles.num}>{p.ordre ?? idx + 1}</td>
                <td>
                  <div className={styles.horseName}>{p.nomCheval ?? "—"}</div>
                  <div className={styles.subhead}>{p.crackSeries ?? ""}</div>
                </td>
                <td>{p.ferrure ?? "—"}</td>
                <td>—</td>
                <td>{p.distance ?? "—"}</td>
                <td>{p.poids ?? 57}</td>
                <td>
                  <div>{p.libelleJockey ?? "—"}</div>
                  <div className={styles.subhead}>{p.libelleEntraineur ?? ""}</div>
                </td>
                <td>
                  {p.avisEntraineur != null && (
                    <span
                      className={styles.dot}
                      style={{ background: AVIS_COLOR[p.avisEntraineur] ?? "#9ca3af" }}
                      title={`Avis: ${p.avisEntraineur}`}
                    />
                  )}
                </td>
                <td className={styles.musique}>{p.musique ?? "—"}</td>
                <td>
                  <div>{p.record ?? "—"}</div>
                  <div className={styles.subhead}>{p.specialiteRecord ?? ""}</div>
                </td>
                <td>{formatEuro(p.gain)}</td>
                <td>{formatEuro(p.gainsMoyensFr)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
