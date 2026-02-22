# Conversation API (in-memory)

Small in-memory API used so the backend can poll conversation updates (e.g. every 5–10 seconds) and feed them to an LLM for suggestions.

- **Run:** `npm run conversation-api` (listens on port 3001, or `CONVERSATION_API_PORT`).
- **Vite proxy:** In dev, the frontend uses `/api` which is proxied to this server.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversation` | Append new messages. Body: `{ "messages": [{ "role": "user" \| "agent", "text": "..." }] }`. Called by the frontend (only sends new messages since last push). |
| GET | `/api/conversation/updates?after=N` | Return only messages after index `N`. Response: `{ "messages": [...], "after": N, "lastIndex": M }`. Backend should poll every 5–10s and use `after=lastIndex` on the next request. |
| POST | `/api/conversation/clear` | Clear in-memory conversation (e.g. when starting a new session). |

Storage is in-memory only (no DB or file). For production you may want to move this behind your main backend or add persistence.
