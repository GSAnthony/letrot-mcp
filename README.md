# Letrot MCP

React MCP App that displays today's French harness racing (trot) meetings and race partants.

## Tools
- `get_meetings_program` — Today's meetings + races from `https://www.letrot.com/v1/api/meetings/{date}`
- `get_race_partants` — MongoDB lookup on `courses` collection by `_id`

## Local development

```bash
npm install
MONGODB_URI="mongodb+srv://..." npm run dev
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

### Required env vars (in `Letrot` Environment Group)
- `MONGODB_URI` — MongoDB Atlas connection string
- `MONGODB_DB` *(optional)* — Database name (defaults to `letrot`)
