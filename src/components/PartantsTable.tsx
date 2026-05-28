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

function formatEuro(raw: string | undefined): string {
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  return `${n.toLocaleString("fr-FR")} €`;
}

/** Sex + age, e.g. "H6" (Hongre/Mâle 6 ans), "F4" (Femelle 4 ans). */
function sexeAge(p: Partant): string {
  const sexe = p.sexe ?? "";
  const age = p.age != null ? String(p.age) : "";
  return `${sexe}${age}` || "—";
}

export function PartantsTable({ partants }: Props) {
  const sorted = [...partants].sort(
    (a, b) => (a.leavingNumber ?? 0) - (b.leavingNumber ?? 0),
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>N°</th>
            <th>Cheval</th>
            <th>Fer</th>
            <th>SA</th>
            <th>Distance</th>
            <th>Driver<br /><span className={styles.subhead}>Entraîneur</span></th>
            <th>Avis<br />Entraîneur</th>
            <th>Musique</th>
            <th>Record<br /><span className={styles.subhead}>Spécialité</span></th>
            <th>Gains</th>
            <th>Rap. prob.</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, idx) => {
            const isOut = p.nonPartant;
            return (
              <tr key={p.id ?? idx} className={isOut ? styles.nonPartant : ""}>
                <td className={styles.num}>{p.leavingNumber ?? idx + 1}</td>
                <td>
                  <div className={styles.horseName}>{p.name ?? "—"}</div>
                </td>
                <td>{p.ferrure ?? "—"}</td>
                <td>{sexeAge(p)}</td>
                <td>{p.distance ?? "—"}</td>
                <td>
                  <div>{p.driver ?? "—"}</div>
                  <div className={styles.subhead}>{p.coach ?? ""}</div>
                </td>
                <td>
                  {p.avisEntraineur != null && (
                    <span
                      className={styles.dot}
                      style={{ background: AVIS_COLOR[p.avisEntraineur] ?? "#9ca3af" }}
                      title={`Avis : ${p.avisEntraineur}`}
                    />
                  )}
                </td>
                <td className={styles.musique}>{p.song ?? "—"}</td>
                <td>
                  <div>{p.record ?? "—"}</div>
                  <div className={styles.subhead}>{p.specialiteRecord ?? ""}</div>
                </td>
                <td>{formatEuro(p.earnings)}</td>
                <td>{p.rapportProbable ? p.rapportProbable.toFixed(1) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
