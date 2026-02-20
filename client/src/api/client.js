import * as idb from "./indexedDb.js";

const API_BASE = "";
const STORAGE_KEYS = {
  lastSession: "oralExam_lastSession",
  sessionHistory: "oralExam_sessionHistory",
  weakAreas: "oralExam_weakAreas",
  examDate: "oralExam_examDate",
  focusToday: "oralExam_focusToday",
  customSubjects: "oralExam_customSubjects",
};

let USE_BACKEND = false;
const CACHE = {};

export async function fetchApi(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) opts.headers["Content-Type"] = "application/json";
  if (body !== undefined && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}

export async function initBackend() {
  try {
    await fetch(API_BASE + "/api/health");
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
    USE_BACKEND = true;
  } catch (_) {
    USE_BACKEND = false;
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
        key === STORAGE_KEYS.customSubjects
      ) {
        const settings = await fetchApi("GET", "/api/settings");
        if (key === STORAGE_KEYS.examDate)
          await fetchApi("PUT", "/api/settings", { ...settings, examDate: value });
        else if (key === STORAGE_KEYS.focusToday)
          await fetchApi("PUT", "/api/settings", { ...settings, focusToday: value });
        else await fetchApi("PUT", "/api/settings", { ...settings, customSubjects: value });
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
  fetch(API_BASE + "/api/last-session", { method: "DELETE" }).catch(() => {});
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
    const buf = await fetch(
      API_BASE + "/api/items/" + encodeURIComponent(id) + "/download"
    ).then((r) => r.arrayBuffer());
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
    const res = await fetch(API_BASE + "/api/items", { method: "POST", body: fd });
    const data = await res.json();
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
  await fetch(API_BASE + "/api/items/" + encodeURIComponent(id), { method: "DELETE" });
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
