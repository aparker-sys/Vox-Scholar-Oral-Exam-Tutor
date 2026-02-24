import * as idb from "./indexedDb.js";

var API_BASE = "";
var TOKEN_KEY = "vox_scholar_token";
var STORAGE_KEYS = {
  lastSession: "oralExam_lastSession",
  sessionHistory: "oralExam_sessionHistory",
  weakAreas: "oralExam_weakAreas",
  examDate: "oralExam_examDate",
  focusToday: "oralExam_focusToday",
  customSubjects: "oralExam_customSubjects",
  subjectRenames: "oralExam_subjectRenames",
  charlotteVoice: "oralExam_charlotteVoice",
};

var USE_BACKEND = false;
var AUTH_TOKEN = null;
var CACHE = {};

function getToken() {
  if (AUTH_TOKEN) return AUTH_TOKEN;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  AUTH_TOKEN = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}

export function clearToken() {
  setToken(null);
  USE_BACKEND = false;
}

export async function fetchApi(method, path, body) {
  const opts = { method, headers: {} };
  const token = getToken();
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body !== undefined) opts.headers["Content-Type"] = "application/json";
  if (body !== undefined && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}

export async function initBackend() {
  try {
    await fetch(API_BASE + "/api/health");
  } catch (_) {
    USE_BACKEND = false;
    return { backendOk: false };
  }
  try {
    const [lastSession, sessionHistory, weakAreas, settings] = await Promise.all([
      fetchApi("GET", "/api/last-session"),
      fetchApi("GET", "/api/session-history"),
      fetchApi("GET", "/api/weak-areas"),
      fetchApi("GET", "/api/settings"),
    ]);
    CACHE[STORAGE_KEYS.lastSession] = lastSession;
    CACHE[STORAGE_KEYS.sessionHistory] = Array.isArray(sessionHistory) ? sessionHistory : [];
    CACHE[STORAGE_KEYS.weakAreas] = Array.isArray(weakAreas) ? weakAreas : [];
    CACHE[STORAGE_KEYS.examDate] = settings?.examDate ?? null;
    CACHE[STORAGE_KEYS.focusToday] = settings?.focusToday ?? null;
    CACHE[STORAGE_KEYS.customSubjects] = settings?.customSubjects ?? [];
    CACHE[STORAGE_KEYS.subjectRenames] = settings?.subjectRenames ?? {};
    USE_BACKEND = true;
    return { backendOk: true };
  } catch (_) {
    USE_BACKEND = false;
    return { backendOk: true };
  }
}

function loadStorageLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorageLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

export function loadStorage(key, fallback) {
  if (USE_BACKEND && key in CACHE) return CACHE[key];
  return loadStorageLocal(key, fallback);
}

export function saveStorage(key, value) {
  CACHE[key] = value;
  if (!USE_BACKEND) {
    saveStorageLocal(key, value);
    return;
  }
  (async () => {
    try {
      if (key === STORAGE_KEYS.lastSession) {
        await fetchApi("POST", "/api/last-session", value);
      } else if (key === STORAGE_KEYS.sessionHistory) {
        await fetchApi("POST", "/api/session-history", value);
      } else if (key === STORAGE_KEYS.weakAreas) {
        await fetchApi("POST", "/api/weak-areas", value);
      } else if (
        key === STORAGE_KEYS.examDate ||
        key === STORAGE_KEYS.focusToday ||
        key === STORAGE_KEYS.customSubjects ||
        key === STORAGE_KEYS.subjectRenames
      ) {
        const settings = await fetchApi("GET", "/api/settings");
        if (key === STORAGE_KEYS.examDate)
          await fetchApi("PUT", "/api/settings", { ...settings, examDate: value });
        else if (key === STORAGE_KEYS.focusToday)
          await fetchApi("PUT", "/api/settings", { ...settings, focusToday: value });
        else if (key === STORAGE_KEYS.customSubjects)
          await fetchApi("PUT", "/api/settings", { ...settings, customSubjects: value });
        else await fetchApi("PUT", "/api/settings", { ...settings, subjectRenames: value });
      }
    } catch (_) {}
  })();
}

export function clearLastSessionStorage() {
  delete CACHE[STORAGE_KEYS.lastSession];
  if (!USE_BACKEND) {
    localStorage.removeItem(STORAGE_KEYS.lastSession);
    return;
  }
  fetch(API_BASE + "/api/last-session", {
    method: "DELETE",
    headers: getToken() ? { Authorization: "Bearer " + getToken() } : {},
  }).catch(() => {});
}

export async function getAllBySubject(subject) {
  if (!USE_BACKEND) return idb.getAllBySubject(subject);
  const list = await fetchApi("GET", "/api/items?subject=" + encodeURIComponent(subject));
  return list || [];
}

export async function getUniqueSubjects() {
  if (!USE_BACKEND) return idb.getUniqueSubjects();
  const list = await fetchApi("GET", "/api/items/subjects");
  return list || [];
}

export async function getItem(id) {
  if (!USE_BACKEND) return idb.getItem(id);
  const item = await fetchApi("GET", "/api/items/" + encodeURIComponent(id));
  if (!item) return null;
  if (item.type === "file" && item.content) {
    const token = getToken();
    const res = await fetch(API_BASE + "/api/items/" + encodeURIComponent(id) + "/download", {
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
    const buf = await res.arrayBuffer();
    item.content = buf;
  }
  return item;
}

export async function addItem(item) {
  if (!USE_BACKEND) return idb.addItem(item);
  if (
    item.type === "file" &&
    (item.content instanceof ArrayBuffer || item.content instanceof Blob)
  ) {
    const blob = item.content instanceof Blob ? item.content : new Blob([item.content]);
    const fd = new FormData();
    fd.append("subject", item.subject || "");
    fd.append("subfolder", item.subfolder || "");
    fd.append("name", item.name || "file");
    fd.append("type", "file");
    fd.append("file", blob, item.name || "file");
    const token = getToken();
    const res = await fetch(API_BASE + "/api/items", {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
    const data = await res.json();
    if (res.status === 401) {
      clearToken();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.id;
  }
  const body = {
    subject: item.subject,
    subfolder: item.subfolder || "",
    name: item.name,
    type: item.type || "note",
    content: item.type === "note" ? item.content : undefined,
  };
  const data = await fetchApi("POST", "/api/items", body);
  return data.id;
}

export async function updateItem(id, updates) {
  if (!USE_BACKEND) return idb.updateItem(id, updates);
  await fetchApi("PATCH", "/api/items/" + encodeURIComponent(id), updates);
}

export async function deleteItem(id) {
  if (!USE_BACKEND) return idb.deleteItem(id);
  await fetchApi("DELETE", "/api/items/" + encodeURIComponent(id));
}

/**
 * Fetch TTS audio from backend (API key stays on server). Returns a Blob (audio/mpeg) or null if TTS not configured.
 */
export async function fetchTTSAudio(text, voice = null) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({ text: String(text).trim(), ...(voice ? { voice } : {}) }),
  });
  if (res.status === 503) {
    try {
      const data = await res.json();
      if (data.code === "TTS_NOT_CONFIGURED") return null;
    } catch (_) {}
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (data.detail) detail = data.detail;
      else if (data.error) detail = data.error;
    } catch (_) {}
    throw new Error(`TTS ${res.status}: ${detail}`);
  }
  return res.blob();
}

/**
 * Send a message to Charlotte (LLM) and get a reply. history: [{ role, content }].
 */
export async function fetchChat(message, history = []) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({ message: String(message).trim(), history }),
  });
  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "CHAT_NOT_CONFIGURED") return null;
  }
  if (!res.ok) throw new Error("Chat failed");
  const data = await res.json();
  return data.reply ?? "";
}

export async function getSubfolders(subject) {
  if (!USE_BACKEND) {
    const items = await idb.getAllBySubject(subject);
    const set = new Set(items.map((i) => i.subfolder || "").filter(Boolean));
    return Array.from(set).sort();
  }
  const items = await getAllBySubject(subject);
  const set = new Set(items.map((i) => i.subfolder || "").filter(Boolean));
  return Array.from(set).sort();
}

export { STORAGE_KEYS };
