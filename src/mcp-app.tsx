import type { App } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ProgramView } from "./components/ProgramView.js";
import { PartantsView } from "./components/PartantsView.js";

type View =
  | { name: "program" }
  | { name: "partants"; raceId: string };

function LetrotApp() {
  const [view, setView] = useState<View>({ name: "program" });
  const [initialResult, setInitialResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Letrot MCP", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (instance) => {
      instance.ontoolresult = async (result) => {
        if (!initialResult) setInitialResult(result);
      };
      instance.onerror = console.error;
    },
  });

  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Erreur : {error.message}</div>;
  if (!app) return <div style={{ padding: 16 }}>Connexion…</div>;

  return <Inner app={app} view={view} setView={setView} initialResult={initialResult} />;
}

interface InnerProps {
  app: App;
  view: View;
  setView: (v: View) => void;
  initialResult: CallToolResult | null;
}

function Inner({ app, view, setView, initialResult }: InnerProps) {
  if (view.name === "partants") {
    return (
      <PartantsView
        app={app}
        raceId={view.raceId}
        onBack={() => setView({ name: "program" })}
      />
    );
  }
  return (
    <ProgramView
      app={app}
      initialResult={initialResult}
      onSelectRace={(raceId) => setView({ name: "partants", raceId })}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LetrotApp />
  </StrictMode>,
);
