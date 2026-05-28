import type { App } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { extractAppResult } from "./appResult.js";
import { ProgramView } from "./components/ProgramView.js";
import { PartantsView } from "./components/PartantsView.js";

type View =
  | { name: "program" }
  | { name: "partants"; raceId: string }
  | { name: "favoris" }
  | { name: "confrontation" };

function LetrotApp() {
  // User-driven navigation; null means "show the entry view derived from the
  // originating tool result".
  const [view, setView] = useState<View | null>(null);
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

  const isEntry = view === null;
  const current = view ?? deriveView(initialResult);

  return (
    <Inner
      app={app}
      view={current}
      setView={setView}
      initialResult={isEntry ? initialResult : null}
    />
  );
}

/** Map the originating tool result to the view it should open. */
function deriveView(result: CallToolResult | null): View {
  if (!result) return { name: "program" };
  const { view, data } = extractAppResult<{ id?: string }>(result);
  if (view === "partants") return { name: "partants", raceId: data?.id ?? "" };
  if (view === "favoris") return { name: "favoris" };
  if (view === "confrontation") return { name: "confrontation" };
  return { name: "program" };
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
        initialResult={initialResult}
        onBack={() => setView({ name: "program" })}
      />
    );
  }
  if (view.name === "favoris" || view.name === "confrontation") {
    return <div style={{ padding: 16, color: "#6b7280" }}>Bientôt disponible.</div>;
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
