# Conversation API (in-memory)

Per-case conversation buffers so the backend can poll every X seconds (e.g. 10s) and get Defence (user) / Plaintiff (agent) concatenated arguments since last poll.

- **Run:** `npm run conversation-api` (listens on port 3001, or `CONVERSATION_API_PORT`).
- **Vite proxy:** In dev, `/api` and `/ws` are proxied to this server (port 3001).
- **WebSocket:** Live transcript uses `ws://.../ws/transcription?case_id=X`. **You must run the conversation API** (`npm run conversation-api`) for live transcript; otherwise the app falls back to ElevenLabs messages.

## Case ID

Each simulation session has a unique `case_id` (UUID from the frontend). All conversation and documents for that session are linked to it.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversation` | Append messages for a case. Body: `{ "case_id": "<id>", "messages": [{ "role": "user" \| "agent", "text": "..." }] }`. Response: `{ "ok": true, "Defence": "concatenated user args", "Plaintiff": "concatenated agent args" }`. |
| GET | `/api/conversation/updates` | **Backend polls this every X seconds (e.g. 10s). No parameters.** Case is set by the frontend when it sends POST /api/conversation or POST /api/conversation/clear. Returns `{ "case_id", "thread_id", "Defence", "Plaintiff" }`. Buffers are then cleared and `thread_id` incremented. |
| POST | `/api/conversation/clear` | Clear one case. Body: `{ "case_id": "<uuid>" }`. |

## File upload and preview

When using the **Python backend (Databricks)** for documents, the frontend uploads PDFs via `POST /api/cases/{case_id}/pdf` and previews via `GET /api/cases/{case_id}/files/{filename}`. Add the GET endpoint to your FastAPI app using the snippet in `server/PYTHON_GET_FILE_ENDPOINT.py`.

## Judgement PDF

The "Download Judgement PDF" button calls `POST /api/cases/{case_id}/judgement?format=pdf` to generate and download the judgement. The backend should return a PDF binary. Optional: `?perspective=plaintiff` for plaintiff perspective.

This Node server still provides optional local file upload/preview for development:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/files/upload` | Upload files for a case (local disk). **Multipart form:** `caseId`, `files`. Responds with `{ "files": [{ "name", "size", "type", "path", "storedName" }] }`. |
| GET | `/api/files/:caseId/:storedName` | Serve a stored file for preview (local disk). |

Storage is in-memory for conversation only. File storage is on disk under `server/uploads/` when using this Node server for uploads.
