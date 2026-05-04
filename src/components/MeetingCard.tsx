import { RaceCard } from "./RaceCard.js";
import styles from "./MeetingCard.module.css";

interface Props {
  meeting: any;
  onSelectRace: (raceId: string) => void;
}

export function MeetingCard({ meeting, onSelectRace }: Props) {
  const num = meeting.numReunion ?? "?";
  const name = meeting.nomHippodrome ?? "—";
  const heure = meeting.heureReunion ?? "";
  const races: any[] = meeting.races ?? [];
  const isQuinte = meeting.quinteEventuel === true || !!races.find((r) => r.quinte);
  const isPick5 = meeting.pick5 === true || !!races.find((r) => r.pick5);
  const isPremium = meeting.type === "Premium" || !!races.find((r) => r.premium);

  return (
    <section className={styles.meeting}>
      <div className={styles.head}>
        <span className={styles.heure}>{heure}</span>
        <h2 className={styles.title}>
          R{num} <strong>{name}</strong>
        </h2>
        <span className={styles.count}>{races.length} courses</span>
        {isPremium && <span className={`${styles.tag} ${styles.tagPremium}`}>PREMIUM</span>}
        {isQuinte && <span className={`${styles.tag} ${styles.tagQuinte}`}>Quinté+</span>}
        {isPick5 && <span className={`${styles.tag} ${styles.tagPick5}`}>Pick 5</span>}
      </div>
      <div className={styles.races}>
        {races.map((race, idx) => (
          <RaceCard
            key={race.id ?? race._id ?? idx}
            race={race}
            meetingNum={num}
            onSelectRace={onSelectRace}
          />
        ))}
      </div>
    </section>
  );
}
