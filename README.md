# Letrot MCP

React MCP App that displays today's French harness racing (trot) meetings and race partants.
After each view, the tools attach contextual follow-up prompts (rendered as in-frame chips
and surfaced by the assistant) to guide the user to the next step.

## Tools
- `get_meetings_program` — Today's meetings + races from `https://www.letrot.com/v1/api/meetings/{date}`
- `get_race_partants` — Starters for a race from `https://www.letrot.com/v1/api/races/{raceId}/partants`
  (falls back to the bundled mock `src/mocks/partants.json` while that endpoint is not yet live)

## Local development

```bash
npm install
npm run dev
```

Server: `http://localhost:3001/mcp`

## Deployment (Render)

1. Push to GitHub
2. Create a new Web Service on Render from the repo
3. Render reads `render.yaml` and uses the `Letrot` Environment Group for secrets
4. After deploy, connect Claude Code:
   ```
   claude mcp add --transport http letrot https://<your-service>.onrender.com/mcp
   ```

### Env vars
No secrets are required: both endpoints are public Letrot APIs. `PORT` is provided by Render.
