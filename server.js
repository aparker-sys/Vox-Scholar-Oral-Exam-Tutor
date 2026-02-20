/**
 * Vox Scholar backend — Express + SQLite
 * Serves static files from ./public and provides REST API for app data.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "voxscholar.db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ensure data dir exists
const dataDir = path.dirname(DB_PATH);
require("fs").mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
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

// Helpers
function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}
function setSetting(key, value) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

// ----- API routes -----

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Last session
app.get("/api/last-session", (req, res) => {
  res.json(getSetting("lastSession"));
});
app.post("/api/last-session", (req, res) => {
  setSetting("lastSession", req.body);
  res.json({ ok: true });
});
app.delete("/api/last-session", (req, res) => {
  db.prepare("DELETE FROM settings WHERE key = 'lastSession'").run();
  res.json({ ok: true });
});

// Session history
app.get("/api/session-history", (req, res) => {
  const data = getSetting("sessionHistory");
  res.json(Array.isArray(data) ? data : []);
});
app.post("/api/session-history", (req, res) => {
  const history = Array.isArray(req.body) ? req.body : [];
  setSetting("sessionHistory", history.slice(0, 20));
  res.json({ ok: true });
});

// Weak areas
app.get("/api/weak-areas", (req, res) => {
  const data = getSetting("weakAreas");
  res.json(Array.isArray(data) ? data : []);
});
app.post("/api/weak-areas", (req, res) => {
  const areas = Array.isArray(req.body) ? req.body : [];
  setSetting("weakAreas", areas.slice(0, 30));
  res.json({ ok: true });
});

// Settings (exam date, focus today, custom subjects)
app.get("/api/settings", (req, res) => {
  res.json({
    examDate: getSetting("examDate"),
    focusToday: getSetting("focusToday"),
    customSubjects: getSetting("customSubjects") || [],
  });
});
app.put("/api/settings", (req, res) => {
  const current = {
    examDate: getSetting("examDate"),
    focusToday: getSetting("focusToday"),
    customSubjects: getSetting("customSubjects") || [],
  };
  const { examDate, focusToday, customSubjects } = req.body || {};
  if (examDate !== undefined) current.examDate = examDate;
  if (focusToday !== undefined) current.focusToday = focusToday;
  if (Array.isArray(customSubjects)) current.customSubjects = customSubjects;
  setSetting("examDate", current.examDate);
  setSetting("focusToday", current.focusToday);
  setSetting("customSubjects", current.customSubjects);
  res.json({ ok: true });
});

// Library items
app.get("/api/items/subjects", (req, res) => {
  const rows = db.prepare("SELECT DISTINCT subject FROM items WHERE subject IS NOT NULL AND subject != '' ORDER BY subject").all();
  res.json(rows.map((r) => r.subject));
});
app.get("/api/items", (req, res) => {
  const subject = req.query.subject;
  if (!subject) return res.status(400).json({ error: "subject required" });
  const rows = db.prepare("SELECT id, subject, subfolder, name, type, mimeType, size, createdAt, updatedAt FROM items WHERE subject = ? ORDER BY updatedAt DESC").all(subject);
  res.json(rows.map((row) => ({ ...row, content: undefined })));
});
app.get("/api/items/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
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
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
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
    `INSERT OR REPLACE INTO items (id, subject, subfolder, name, type, content, mimeType, size, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, subject, subfolder, name, type, content, mimeType, size, now, now);
  res.json({ id });
});
app.patch("/api/items/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  const { name, content, subfolder } = req.body || {};
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
  db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Serve React build when present, else 404 for non-API
const clientDist = path.join(__dirname, "client", "dist");
const fs = require("fs");
const hasReactBuild = fs.existsSync(clientDist);
if (hasReactBuild) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
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

app.listen(PORT, () => {
  console.log(`Vox Scholar server at http://localhost:${PORT}`);
});
