/**
 * Vox Scholar backend — Express + SQLite, with auth and user-scoped data.
 */
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "voxscholar.db");
const JWT_SECRET = process.env.JWT_SECRET || "vox-scholar-dev-secret-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "30d";

let db = null;
try {
  const dataDir = path.dirname(DB_PATH);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.warn("Could not create data dir:", e.message);
  }
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT DEFAULT '',
      onboardingComplete INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      subfolder TEXT DEFAULT '',
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content BLOB,
      mimeType TEXT,
      size INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_items_subject ON items(subject);
  `);
  try {
    db.prepare("SELECT user_id FROM items LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE items ADD COLUMN user_id TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id)");
} catch (e) {
  console.error("Database init failed:", e.message);
  console.error("App will start but API/storage will not work. Check DB_PATH and volume mount.");
}

// ----- Helpers -----
function getSetting(userId, key) {
  if (userId) {
    const row = db.prepare("SELECT value FROM user_settings WHERE user_id = ? AND key = ?").get(userId, key);
    return row ? JSON.parse(row.value) : null;
  }
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}

function setSetting(userId, key, value) {
  if (userId) {
    db.prepare("INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)").run(userId, key, JSON.stringify(value));
    return;
  }
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 12);
}

// ----- Auth middleware -----
function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.userId;
      req.user = payload;
    } catch (_) {
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.user = payload;
    next();
  } catch (_) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const app = express();
app.use(cors());

// Redirect root domain to www when request reaches this server (e.g. after DNS points root to Railway)
app.use((req, res, next) => {
  const host = (req.get("host") || "").split(":")[0];
  if (host === "oralexamtutor.com") {
    return res.redirect(301, "https://www.oralexamtutor.com" + (req.originalUrl || "/"));
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// When DB is down, still allow health (for Railway) and TTS/chat so the app can load
app.use((req, res, next) => {
  if (req.path === "/api/health") return next();
  if (req.method === "POST" && (req.path === "/api/tts" || req.path === "/api/chat")) return next();
  if (req.path.startsWith("/api/") && !db) return res.status(503).json({ error: "Database unavailable" });
  next();
});

// ----- Public routes -----
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// No sign-up: all API routes work without a token (auth optional)
app.use("/api", authOptional);

// Last session (scoped by user)
app.get("/api/last-session", (req, res) => {
  res.json(getSetting(req.userId, "lastSession"));
});
app.post("/api/last-session", (req, res) => {
  setSetting(req.userId, "lastSession", req.body);
  res.json({ ok: true });
});
app.delete("/api/last-session", (req, res) => {
  if (req.userId) {
    db.prepare("DELETE FROM user_settings WHERE user_id = ? AND key = 'lastSession'").run(req.userId);
  } else {
    db.prepare("DELETE FROM settings WHERE key = 'lastSession'").run();
  }
  res.json({ ok: true });
});

// Session history
app.get("/api/session-history", (req, res) => {
  const data = getSetting(req.userId, "sessionHistory");
  res.json(Array.isArray(data) ? data : []);
});
app.post("/api/session-history", (req, res) => {
  const history = Array.isArray(req.body) ? req.body : [];
  setSetting(req.userId, "sessionHistory", history.slice(0, 20));
  res.json({ ok: true });
});

// Weak areas
app.get("/api/weak-areas", (req, res) => {
  const data = getSetting(req.userId, "weakAreas");
  res.json(Array.isArray(data) ? data : []);
});
app.post("/api/weak-areas", (req, res) => {
  const areas = Array.isArray(req.body) ? req.body : [];
  setSetting(req.userId, "weakAreas", areas.slice(0, 30));
  res.json({ ok: true });
});

// Settings
app.get("/api/settings", (req, res) => {
  res.json({
    examDate: getSetting(req.userId, "examDate"),
    focusToday: getSetting(req.userId, "focusToday"),
    customSubjects: getSetting(req.userId, "customSubjects") || [],
    subjectRenames: getSetting(req.userId, "subjectRenames") || {},
  });
});
app.put("/api/settings", (req, res) => {
  const current = {
    examDate: getSetting(req.userId, "examDate"),
    focusToday: getSetting(req.userId, "focusToday"),
    customSubjects: getSetting(req.userId, "customSubjects") || [],
    subjectRenames: getSetting(req.userId, "subjectRenames") || {},
  };
  const { examDate, focusToday, customSubjects, subjectRenames } = req.body || {};
  if (examDate !== undefined) current.examDate = examDate;
  if (focusToday !== undefined) current.focusToday = focusToday;
  if (Array.isArray(customSubjects)) current.customSubjects = customSubjects;
  if (subjectRenames !== undefined && typeof subjectRenames === "object") current.subjectRenames = subjectRenames;
  setSetting(req.userId, "examDate", current.examDate);
  setSetting(req.userId, "focusToday", current.focusToday);
  setSetting(req.userId, "customSubjects", current.customSubjects);
  setSetting(req.userId, "subjectRenames", current.subjectRenames);
  res.json({ ok: true });
});

// Library items (scoped by user_id)
function itemsWhereUser(userId) {
  return userId ? "user_id = ?" : "user_id IS NULL";
}
function itemsParams(userId) {
  return userId ? [userId] : [];
}

app.get("/api/items/subjects", (req, res) => {
  const where = itemsWhereUser(req.userId);
  const params = itemsParams(req.userId);
  const rows = db.prepare(
    `SELECT DISTINCT subject FROM items WHERE (${where}) AND subject IS NOT NULL AND subject != '' ORDER BY subject`
  ).all(...params);
  res.json(rows.map((r) => r.subject));
});
app.get("/api/items", (req, res) => {
  const subject = req.query.subject;
  if (!subject) return res.status(400).json({ error: "subject required" });
  const where = itemsWhereUser(req.userId) + " AND subject = ?";
  const params = [...itemsParams(req.userId), subject];
  const rows = db.prepare(
    `SELECT id, subject, subfolder, name, type, mimeType, size, createdAt, updatedAt FROM items WHERE ${where} ORDER BY updatedAt DESC`
  ).all(...params);
  res.json(rows.map((row) => ({ ...row, content: undefined })));
});
app.get("/api/items/:id", (req, res) => {
  const where = itemsWhereUser(req.userId) + " AND id = ?";
  const params = [...itemsParams(req.userId), req.params.id];
  const row = db.prepare(`SELECT * FROM items WHERE ${where}`).get(...params);
  if (!row) return res.status(404).json({ error: "not found" });
  const item = {
    id: row.id,
    subject: row.subject,
    subfolder: row.subfolder || "",
    name: row.name,
    type: row.type,
    mimeType: row.mimeType,
    size: row.size,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.type === "note") {
    item.content = row.content ? row.content.toString("utf8") : "";
  }
  res.json(item);
});
app.get("/api/items/:id/download", (req, res) => {
  const where = itemsWhereUser(req.userId) + " AND id = ?";
  const params = [...itemsParams(req.userId), req.params.id];
  const row = db.prepare(`SELECT * FROM items WHERE ${where}`).get(...params);
  if (!row || row.type === "note") return res.status(404).end();
  res.setHeader("Content-Type", row.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(row.name)}"`);
  res.send(row.content);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.post("/api/items", upload.single("file"), (req, res) => {
  const body = req.body || {};
  const id = body.id || "item_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const subject = body.subject || "";
  const subfolder = (body.subfolder || "").trim();
  const name = body.name || "Untitled";
  const type = body.type || "note";
  const now = new Date().toISOString();
  const userId = req.userId || null;
  let content = null;
  let mimeType = body.mimeType || null;
  let size = body.size || null;
  if (req.file) {
    content = req.file.buffer;
    mimeType = req.file.mimetype || "application/octet-stream";
    size = req.file.size;
  } else if (type === "note" && body.content !== undefined) {
    content = Buffer.from(String(body.content), "utf8");
  } else if (type === "file" && body.content) {
    const buf = Buffer.isBuffer(body.content) ? body.content : Buffer.from(body.content, "base64");
    content = buf;
    mimeType = body.mimeType || "application/octet-stream";
    size = body.size != null ? body.size : buf.length;
  }
  db.prepare(
    `INSERT OR REPLACE INTO items (id, user_id, subject, subfolder, name, type, content, mimeType, size, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, subject, subfolder, name, type, content, mimeType, size, now, now);
  res.json({ id });
});
app.patch("/api/items/:id", (req, res) => {
  const where = itemsWhereUser(req.userId) + " AND id = ?";
  const params = [...itemsParams(req.userId), req.params.id];
  const row = db.prepare(`SELECT * FROM items WHERE ${where}`).get(...params);
  if (!row) return res.status(404).json({ error: "not found" });
  const { name, content, subfolder, subject } = req.body || {};
  const updates = [];
  const values = [];
  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }
  if (subfolder !== undefined) {
    updates.push("subfolder = ?");
    values.push(subfolder);
  }
  if (subject !== undefined && typeof subject === "string") {
    updates.push("subject = ?");
    values.push(subject);
  }
  if (content !== undefined && row.type === "note") {
    updates.push("content = ?");
    values.push(Buffer.from(String(content), "utf8"));
  }
  updates.push("updatedAt = ?");
  values.push(new Date().toISOString());
  values.push(req.params.id);
  db.prepare(`UPDATE items SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});
app.delete("/api/items/:id", (req, res) => {
  const where = itemsWhereUser(req.userId) + " AND id = ?";
  const params = [...itemsParams(req.userId), req.params.id];
  const r = db.prepare(`DELETE FROM items WHERE ${where}`).run(...params);
  if (r.changes === 0) return res.status(404).json({ error: "not found" });
  res.json({ ok: true });
});

// ----- TTS (Text-to-Speech) — API key on server only -----
const TTS_API_KEY = process.env.OPENAI_API_KEY || process.env.TTS_API_KEY || "";
const TTS_MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.TTS_VOICE || "shimmer";
const TTS_SUPPORTS_INSTRUCTIONS = /gpt-4o-mini-tts|gpt-4o-tts/i.test(TTS_MODEL);
const TTS_INSTRUCTIONS =
  process.env.TTS_INSTRUCTIONS ||
  "Speak with natural variation in tone and pace. Sound warm, personable, and engaging—vary your intonation so it feels conversational, not flat or monotone.";

if (TTS_API_KEY) {
  console.log(
    `[TTS] model=${TTS_MODEL} voice=${TTS_VOICE} instructions=${TTS_SUPPORTS_INSTRUCTIONS && TTS_INSTRUCTIONS ? "on" : "off"}`
  );
}

app.post("/api/tts", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ error: "text required" });
  if (text.length > 4096) return res.status(400).json({ error: "text too long (max 4096)" });
  if (!TTS_API_KEY) {
    return res.status(503).json({ error: "TTS not configured", code: "TTS_NOT_CONFIGURED" });
  }
  const voice = req.body?.voice && /^[a-z]+$/.test(req.body.voice) ? req.body.voice : TTS_VOICE;
  const body = {
    model: TTS_MODEL,
    input: text,
    voice: voice,
    response_format: "mp3",
  };
  if (TTS_SUPPORTS_INSTRUCTIONS && TTS_INSTRUCTIONS) body.instructions = TTS_INSTRUCTIONS;
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TTS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[TTS] OpenAI error:", response.status, err);
      return res.status(response.status).json({ error: "TTS request failed", detail: err });
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(buffer);
  } catch (err) {
    console.error("TTS error:", err.message);
    return res.status(502).json({ error: "TTS service error", code: "TTS_ERROR" });
  }
});

// ----- Charlotte LLM chat (same API key) -----
const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";

const CHARLOTTE_SYSTEM = `You are Charlotte, a warm and encouraging voice tutor for students preparing for oral exams. You help them practice, stay calm, and improve. Keep replies concise (one to three short sentences) so they work well when read aloud. Be supportive and a little upbeat.`;

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "message required" });
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const key = process.env.OPENAI_API_KEY || process.env.TTS_API_KEY || "";
  if (!key) return res.status(503).json({ error: "Chat not configured", code: "CHAT_NOT_CONFIGURED" });
  const messages = [
    { role: "system", content: CHARLOTTE_SYSTEM },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        max_tokens: 150,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: "Chat request failed", detail: err });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(502).json({ error: "Chat service error", code: "CHAT_ERROR" });
  }
});

// ----- Generate practice questions from uploaded material (same API key) -----
const GENERATE_QUESTIONS_SYSTEM = `You are helping a student prepare for oral exams based on SPECIFIC reading material they uploaded.

RULES:
- Use ONLY the text provided below. Do not introduce topics, examples, or questions from outside the material.
- First identify the main points, arguments, and key concepts in the reading.
- Generate 3 to 5 practice questions that an examiner would ask specifically about THIS material. Questions must be answerable using only the uploaded reading.
- Do not ask generic or unrelated questions (e.g. no medical cases, no other subjects). Every question must clearly relate to the content provided.
- For each question, list 2 to 4 short key points the student should include, drawn from the material.

Return only valid JSON in this exact shape, no other text:
{"questions":[{"question":"...","keyPoints":["...","..."]},{"question":"...","keyPoints":["..."]}]}`;

app.post("/api/generate-questions", async (req, res) => {
  const material = typeof req.body?.material === "string" ? req.body.material.trim() : "";
  if (!material || material.length < 100) {
    return res.status(400).json({
      error: "material required",
      hint: "Add at least a few sentences (or notes) to your folder so we can generate questions from it.",
    });
  }
  const key = process.env.OPENAI_API_KEY || process.env.TTS_API_KEY || "";
  if (!key) return res.status(503).json({ error: "Questions not configured", code: "OPENAI_NOT_CONFIGURED" });

  const truncated = material.length > 12000 ? material.slice(0, 12000) + "\n\n[... truncated ...]" : material;
  const userContent = `Study material (use this and only this to create questions):\n\n${truncated}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: GENERATE_QUESTIONS_SYSTEM },
          { role: "user", content: userContent },
        ],
        max_tokens: 1200,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-questions] OpenAI error:", response.status, err);
      return res.status(response.status).json({ error: "Failed to generate questions", detail: err });
    }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = (() => {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    })();
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      console.error("[generate-questions] Invalid response shape:", raw.slice(0, 200));
      return res.status(502).json({ error: "Could not parse questions from response" });
    }
    const questions = parsed.questions
      .filter((q) => q && typeof q.question === "string" && Array.isArray(q.keyPoints))
      .map((q) => ({
        question: String(q.question).trim(),
        keyPoints: q.keyPoints.map((p) => String(p).trim()).filter(Boolean),
      }))
      .filter((q) => q.question.length > 0 && q.keyPoints.length > 0)
      .slice(0, 8);
    if (questions.length === 0) {
      return res.status(502).json({ error: "No valid questions generated" });
    }
    res.json({ questions });
  } catch (err) {
    console.error("Generate questions error:", err.message);
    return res.status(502).json({ error: "Question generation failed", code: "GENERATE_QUESTIONS_ERROR" });
  }
});

// ----- Static / SPA -----
const clientDist = path.join(__dirname, "client", "dist");
const hasReactBuild = fs.existsSync(clientDist);
console.log("client/dist exists:", hasReactBuild, "path:", clientDist);

if (hasReactBuild) {
  app.use(express.static(clientDist, { index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    // Don't serve index.html for asset paths; let them 404 so we don't break JS/CSS
    if (req.path.startsWith("/assets/")) return next();
    const indexPath = path.join(clientDist, "index.html");
    // Prevent caching of index.html so users always get the latest script URLs after deploy
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("SendFile error:", err.message);
        res.status(500).send("Error loading app.");
      }
    });
  });
} else {
  const allowedFiles = ["index.html", "styles.css", "app.js", "db.js", "questions.js", "api.js"];
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    const name = path.basename(req.path) || "index.html";
    if (req.path === "/" || req.path === "" || name === "index.html") {
      return res.sendFile(path.join(__dirname, "index.html"));
    }
    if (allowedFiles.includes(name)) return res.sendFile(path.join(__dirname, name));
    next();
  });
}

const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Vox Scholar server at http://${HOST}:${PORT}`);
});
