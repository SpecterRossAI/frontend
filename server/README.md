# Conversation API (in-memory)

Per-case conversation buffers so the backend can poll every X seconds and get defense (user) / prosecutor (agent) text since last poll.

- **Run:** `npm run conversation-api` (listens on port 3001, or `CONVERSATION_API_PORT`).
- **Vite proxy:** In dev, the frontend uses `/api` which is proxied to this server.

## Case ID

Each simulation session has a unique `case_id` (UUID from the frontend). All conversation and documents for that session are linked to it.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversation` | Append messages for a case. Body: `{ "case_id": "<uuid>", "messages": [{ "role": "user" \| "agent", "text": "..." }] }`. User → defense buffer, agent → prosecutor buffer. |
| GET | `/api/conversation/updates?case_id=<uuid>` | **Backend polls this every X seconds.** Returns `{ "case_id", "thread_id", "defense", "prosecutor" }`. Defense = all user text since last poll (concatenated). Prosecutor = all agent text since last poll. Buffers are then cleared and `thread_id` incremented. |
| POST | `/api/conversation/clear` | Clear one case. Body: `{ "case_id": "<uuid>" }`. |

Storage is in-memory only (no DB or file). For production you may want to move this behind your main backend or add persistence.
