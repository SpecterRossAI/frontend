/**
 * In-memory conversation API for the voice agent.
 * - Each session has a unique case_id. All documents and conversation are linked to it.
 * - Frontend POSTs new messages with case_id; we append to defense (user) or prosecutor (agent) buffers.
 * - Backend polls GET /api/conversation/updates?case_id=X every X seconds. Response:
 *   { case_id, thread_id, defense, prosecutor } (all user/agent text since last poll, then buffers are cleared).
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.CONVERSATION_API_PORT) || 3001;

app.use(cors());
app.use(express.json());

/** @type {Map<string, { defenseBuffer: string[], prosecutorBuffer: string[], threadId: number }>} */
const cases = new Map();

function getOrCreateCase(caseId) {
  if (!caseId || typeof caseId !== "string") return null;
  let c = cases.get(caseId);
  if (!c) {
    c = { defenseBuffer: [], prosecutorBuffer: [], threadId: 0 };
    cases.set(caseId, c);
  }
  return c;
}

/** Append new messages; user → defense buffer, agent → prosecutor buffer. */
app.post("/api/conversation", (req, res) => {
  const { case_id: caseId, messages } = req.body || {};
  const c = getOrCreateCase(caseId);
  if (!c) {
    return res.status(400).json({ error: "Expected { case_id: string, messages: [{ role, text }] }" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Expected { case_id, messages: [{ role, text }] }" });
  }
  const valid = messages.every(
    (m) => m && typeof m.role === "string" && typeof m.text === "string"
  );
  if (!valid) {
    return res.status(400).json({ error: "Each message must have role and text" });
  }
  for (const m of messages) {
    const text = String(m.text).trim();
    if (!text) continue;
    const role = (m.role || "").toLowerCase();
    if (role === "user") {
      c.defenseBuffer.push(text);
    } else {
      // agent, assistant, or anything else → prosecutor
      c.prosecutorBuffer.push(text);
    }
  }
  res.json({
    ok: true,
    defenseCount: c.defenseBuffer.length,
    prosecutorCount: c.prosecutorBuffer.length,
  });
});

/**
 * Backend polls this every X seconds. Returns all defense/prosecutor text since last poll,
 * then clears the buffers and increments thread_id.
 */
app.get("/api/conversation/updates", (req, res) => {
  const caseId = req.query.case_id;
  const c = caseId ? cases.get(caseId) : null;
  if (!caseId || !c) {
    return res.status(400).json({ error: "Query case_id is required and must match an existing case" });
  }
  const defense = c.defenseBuffer.join(" ");
  const prosecutor = c.prosecutorBuffer.join(" ");
  const threadId = c.threadId;
  c.defenseBuffer = [];
  c.prosecutorBuffer = [];
  c.threadId += 1;
  res.json({
    case_id: caseId,
    thread_id: threadId,
    defense,
    prosecutor,
  });
});

/** Clear conversation for this case (e.g. when starting a new session). */
app.post("/api/conversation/clear", (req, res) => {
  const { case_id: caseId } = req.body || {};
  if (caseId && typeof caseId === "string") {
    cases.delete(caseId);
  }
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Conversation API listening on http://localhost:${PORT}`);
});
