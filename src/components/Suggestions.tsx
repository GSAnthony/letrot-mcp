import type { App } from "@modelcontextprotocol/ext-apps";
import type { Suggestion } from "../appResult.js";
import styles from "./Suggestions.module.css";

interface Props {
  app: App;
  suggestions: Suggestion[];
}

/**
 * Follow-up prompt chips shown under a view. Clicking a chip injects the prompt
 * as a new user turn into the host chat via `app.sendMessage`, which triggers
 * the matching tool and renders the next frame below.
 */
export function Suggestions({ app, suggestions }: Props) {
  if (!suggestions || suggestions.length === 0) return null;

  const send = (prompt: string) => {
    app
      .sendMessage({ role: "user", content: [{ type: "text", text: prompt }] })
      .catch((e) => console.error("sendMessage failed", e));
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.heading}>Et ensuite ?</span>
      <div className={styles.chips}>
        {suggestions.map((s) => (
          <button
            key={s.prompt}
            type="button"
            className={styles.chip}
            onClick={() => send(s.prompt)}
            title={s.prompt}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
