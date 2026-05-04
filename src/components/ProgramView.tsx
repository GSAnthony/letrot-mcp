import { useEffect, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MeetingCard } from "./MeetingCard.js";
import styles from "./ProgramView.module.css";

interface Props {
  app: App;
  initialResult: CallToolResult | null;
  onSelectRace: (raceId: string) => void;
}

function extractMeetingsData(result: CallToolResult): { date: string; meetings: any } | null {
  if (result.structuredContent) return result.structuredContent as any;
  const text = result.content?.find((c) => c.type === "text") as { text?: string } | undefined;
  if (!text?.text) return null;
  try {
    return JSON.parse(text.text);
  } catch {
    return null;
  }
}

export function ProgramView({ app, initialResult, onSelectRace }: Props) {
  const [data, setData] = useState<{ date: string; meetings: any } | null>(
    initialResult ? extractMeetingsData(initialResult) : null,
  );
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
          setError(text?.text ?? "Failed to load meetings");
          return;
        }
        setData(extractMeetingsData(result));
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
