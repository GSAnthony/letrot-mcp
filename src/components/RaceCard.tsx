import { getStatusByCode, statusLabel } from "../utils/raceStatus.js";
import styles from "./RaceCard.module.css";

interface Props {
  race: any;
  meetingNum: number | string;
  onSelectRace: (raceId: string) => void;
}

function extractHour(hour: string | undefined): string {
  if (!hour) return "";
  const match = /T(\d{2}:\d{2})/.exec(hour);
  return match ? match[1] : hour;
}

function disciplineIcon(discipline: string): string {
  // M = Monté (mounted), A = Attelé (harness/sulky), P = Plat, O = Obstacle
  if (discipline === "M") return "🏇";
  return "🛞";
}

export function RaceCard({ race, onSelectRace }: Props) {
  const id: string | undefined = race.id ?? race._id;
  const num = race.numCourse ?? "?";
  const heure = extractHour(race.hour) || race.heureCourse || "";
  const codeRaw = race.codeStatus;
  const code = typeof codeRaw === "string" ? parseInt(codeRaw, 10) : codeRaw;
  const status = getStatusByCode(code ?? race.statut);
  const discipline = race.discipline ?? "A";

  const handleClick = () => {
    if (id) onSelectRace(id);
  };

  return (
    <button
      type="button"
      className={styles.card}
      onClick={handleClick}
      disabled={!id}
      title={race.prix ?? ""}
    >
      <div className={styles.row}>
        <span className={styles.heure}>{heure}</span>
        <span className={styles.label}>C{num}</span>
      </div>
      <div className={styles.statusRow}>
        <span className={styles.status}>{statusLabel(status)}</span>
        <span className={styles.discipline} aria-label={`Discipline ${discipline}`}>
          {disciplineIcon(discipline)}
        </span>
      </div>
      {(race.quinte || race.pick5) && (
        <div className={styles.tags}>
          {race.quinte && <span className={`${styles.tag} ${styles.tagQuinte}`}>Quinté+</span>}
          {race.pick5 && <span className={`${styles.tag} ${styles.tagPick5}`}>Pick 5</span>}
        </div>
      )}
    </button>
  );
}
