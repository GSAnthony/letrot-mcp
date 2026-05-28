import { useEffect, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { extractAppResult, type Suggestion } from "../appResult.js";
import { MeetingCard } from "./MeetingCard.js";
import { Suggestions } from "./Suggestions.js";
import styles from "./ProgramView.module.css";

interface MeetingsData {
  date: string;
  meetings: any;
}

interface Props {
  app: App;
  initialResult: CallToolResult | null;
  onSelectRace: (raceId: string) => void;
}

export function ProgramView({ app, initialResult, onSelectRace }: Props) {
  const initial = initialResult ? extractAppResult<MeetingsData>(initialResult) : null;
  const [data, setData] = useState<MeetingsData | null>(initial?.data ?? null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initial?.suggestions ?? []);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    setLoading(true);
    app
      .callServerTool({ name: "get_meetings_program", arguments: {} })
      .then((result) => {
        if (cancelled) return;
        if (result.isError) {
          const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
          setError(text?.text ?? "Échec du chargement du programme");
          return;
        }
        const extracted = extractAppResult<MeetingsData>(result);
        setData(extracted.data);
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
  }, [app, data]);

  if (loading) return <div className={styles.center}>Chargement…</div>;
  if (error) return <div className={styles.error}>Erreur : {error}</div>;
  if (!data) return <div className={styles.center}>Aucune donnée</div>;

  const meetingsArray = normalizeMeetings(data.meetings);

  return (
    <div className={styles.program}>
      <header className={styles.header}>
        <h1 className={styles.title}>Programme du {formatDate(data.date)}</h1>
      </header>
      {meetingsArray.length === 0 ? (
        <div className={styles.center}>Aucune réunion programmée aujourd'hui.</div>
      ) : (
        meetingsArray.map((meeting, idx) => (
          <MeetingCard
            key={meeting.id ?? meeting.numReunion ?? idx}
            meeting={meeting}
            onSelectRace={onSelectRace}
          />
        ))
      )}
      <Suggestions app={app} suggestions={suggestions} />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function normalizeMeetings(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.meetings)) return raw.meetings;
  return [];
}
