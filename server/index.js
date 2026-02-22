/**
 * In-memory conversation API for the voice agent.
 * - Frontend POSTs new messages (append-only).
 * - Backend polls GET /api/conversation/updates?after=N every 5–10s to get only new messages.
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.CONVERSATION_API_PORT) || 3001;

app.use(cors());
app.use(express.json());

const store = {
  messages: [],
};

/** Append new messages (frontend sends only what wasn't sent before). */
app.post("/api/conversation", (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Expected { messages: [{ role, text }] }" });
  }
  const valid = messages.every(
    (m) => m && typeof m.role === "string" && typeof m.text === "string"
  );
  if (!valid) {
    return res.status(400).json({ error: "Each message must have role and text" });
  }
  store.messages.push(...messages);
  res.json({ ok: true, total: store.messages.length });
});

/** Get only messages after index `after` (for backend polling). Query: after=0 means all; after=N means messages from index N+1. */
app.get("/api/conversation/updates", (req, res) => {
  const after = Math.max(0, parseInt(req.query.after, 10) || 0);
  const slice = store.messages.slice(after);
  res.json({
    messages: slice,
    after,
    lastIndex: store.messages.length,
  });
});

/** Clear conversation (e.g. when starting a new session). */
app.post("/api/conversation/clear", (_req, res) => {
  store.messages = [];
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Conversation API listening on http://localhost:${PORT}`);
});
