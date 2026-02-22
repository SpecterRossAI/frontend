/**
 * In-memory conversation API for the voice agent.
 * - Each session has a unique case_id. All documents and conversation are linked to it.
 * - Frontend POSTs new messages with case_id; we append to defense (user) or prosecutor (agent) buffers.
 * - Backend polls GET /api/conversation/updates?case_id=X every X seconds. Response:
 *   { case_id, thread_id, defense, prosecutor } (all user/agent text since last poll, then buffers are cleared).
 * - File uploads: POST /api/files/upload stores files on disk under uploads/<caseId>/; GET /api/files/:caseId/:storedName serves them for preview.
 */

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.CONVERSATION_API_PORT) || 3001;

const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** Sanitize filename: basename only, safe chars (alphanumeric, dash, underscore, dot). */
function sanitizeFilename(name) {
  const base = path.basename(String(name || "file"));
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || "file";
}

/** Validate caseId: non-empty, no path chars (UUID-style allowed). */
function isValidCaseId(id) {
  return typeof id === "string" && id.length > 0 && /^[a-zA-Z0-9-]+$/.test(id);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

/** POST /api/files/upload — multipart: caseId (field), files (file field). Stores under uploads/<caseId>/<sanitized>. */
app.post("/api/files/upload", upload.array("files", 20), (req, res) => {
  const caseId = req.body?.caseId;
  if (!isValidCaseId(caseId)) {
    return res.status(400).json({ error: "Invalid or missing caseId" });
  }
  const caseDir = path.join(UPLOADS_DIR, caseId);
  fs.mkdirSync(caseDir, { recursive: true });
  const result = [];
  for (const f of req.files || []) {
    const storedName = sanitizeFilename(f.originalname || f.fieldname);
    const filePath = path.join(caseDir, storedName);
    fs.writeFileSync(filePath, f.buffer);
    result.push({
      name: f.originalname || storedName,
      size: f.size,
      type: f.mimetype || "",
      path: f.originalname || storedName,
      storedName,
    });
  }
  res.json({ files: result });
});

/** GET /api/files/:caseId/:storedName — serve file for preview (inline). */
app.get("/api/files/:caseId/:storedName", (req, res) => {
  const { caseId, storedName } = req.params;
  if (!isValidCaseId(caseId) || !storedName) {
    return res.status(400).json({ error: "Invalid caseId or storedName" });
  }
  const safeStored = sanitizeFilename(storedName);
  const caseDir = path.join(UPLOADS_DIR, caseId);
  const filePath = path.join(caseDir, safeStored);
  const resolved = path.resolve(filePath);
  const caseDirResolved = path.resolve(caseDir);
  if (!resolved.startsWith(caseDirResolved) || resolved === caseDirResolved) {
    return res.status(400).json({ error: "Invalid path" });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return res.status(404).json({ error: "File not found" });
  }
  const ext = path.extname(safeStored).toLowerCase();
  const mime =
    ext === ".pdf"
      ? "application/pdf"
      : [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)
        ? (ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : `image/${ext.slice(1)}`)
        : "application/octet-stream";
  res.setHeader("Content-Disposition", `inline; filename="${safeStored}"`);
  res.setHeader("Content-Type", mime);
  fs.createReadStream(resolved).pipe(res);
});

/** @type {Map<string, { defenseBuffer: string[], prosecutorBuffer: string[], threadId: number }>} */
const cases = new Map();
/** Set by frontend when it sends conversation/clear or conversation messages. Backend polls without passing case_id. */
let activeCaseId = null;

function getOrCreateCase(caseId) {
  if (!caseId || typeof caseId !== "string") return null;
  let c = cases.get(caseId);
  if (!c) {
    c = { defenseBuffer: [], prosecutorBuffer: [], threadId: 0 };
    cases.set(caseId, c);
  }
  return c;
}

/** Append new messages; user → defense buffer, agent → prosecutor buffer. Frontend sends case_id; we set it as active for GET /updates. */
app.post("/api/conversation", (req, res) => {
  const { case_id: caseId, messages } = req.body || {};
  if (caseId && typeof caseId === "string") activeCaseId = caseId;
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
  const Defence = c.defenseBuffer.join(" ");
  const Plaintiff = c.prosecutorBuffer.join(" ");
  res.json({
    ok: true,
    Defence,
    Plaintiff,
  });
});

/**
 * Backend polls this every X seconds (e.g. 10s). No query params needed — case_id is set by the frontend
 * when it sends POST /api/conversation or POST /api/conversation/clear. Returns concatenated Defence (user)
 * and Plaintiff (agent) arguments since last poll, then clears the buffers and increments thread_id.
 * Response: { case_id, thread_id, Defence, Plaintiff }
 */
app.get("/api/conversation/updates", (req, res) => {
  const caseId = req.query.case_id || activeCaseId;
  const c = caseId ? cases.get(caseId) : null;
  if (!caseId || !c) {
    return res.status(400).json({ error: "No active case. Frontend must send case_id via POST /api/conversation or POST /api/conversation/clear first." });
  }
  const Defence = c.defenseBuffer.join(" ");
  const Plaintiff = c.prosecutorBuffer.join(" ");
  const threadId = String(c.threadId);
  c.defenseBuffer = [];
  c.prosecutorBuffer = [];
  c.threadId += 1;
  res.json({
    case_id: caseId,
    thread_id: threadId,
    Defence,
    Plaintiff,
  });
});

/** Clear conversation for this case (e.g. when starting a new session). Frontend sends case_id; we set it as active and reset buffers so GET /updates still finds the case. */
app.post("/api/conversation/clear", (req, res) => {
  const { case_id: caseId } = req.body || {};
  if (caseId && typeof caseId === "string") {
    activeCaseId = caseId;
    cases.set(caseId, { defenseBuffer: [], prosecutorBuffer: [], threadId: 0 });
  }
  res.json({ ok: true });
});

// Prevent silent exit from uncaught errors (so we see why the process might close)
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exitCode = 1;
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exitCode = 1;
});

const server = app.listen(PORT, () => {
  console.log(`Conversation API listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exitCode = 1;
});

// Graceful shutdown on Ctrl+C or SIGTERM
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nConversation API stopped.");
    process.exit(0);
  });
});
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("\nConversation API stopped.");
    process.exit(0);
  });
});
