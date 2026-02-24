const DB_NAME = "oralExamFolders";
const DB_VERSION = 1;
const STORE_NAME = "items";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("subject", "subject", { unique: false });
        store.createIndex("subject_subfolder", ["subject", "subfolder"], { unique: false });
      }
    };
  });
}
async function getAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function getUniqueSubjects$1() {
  const items = await getAll();
  const subjects = new Set(items.map((i) => i.subject).filter(Boolean));
  return Array.from(subjects).sort();
}
async function getAllBySubject$1(subject) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("subject");
    const req = index.getAll(subject);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function addItem$1(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record = {
      id: item.id || "item_" + Date.now() + "_" + Math.random().toString(36).slice(2),
      subject: item.subject,
      subfolder: item.subfolder || "",
      name: item.name,
      type: item.type,
      tags: item.tags || [],
      content: item.content,
      mimeType: item.mimeType || null,
      size: item.size || null,
      createdAt: item.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record.id);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function getItem$1(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function updateItem$1(id, updates) {
  const existing = await getItem$1(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (!("content" in updates) && existing.content !== void 0) merged.content = existing.content;
  await addItem$1(merged);
  return merged.id;
}
async function deleteItem$1(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
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
  charlotteVoice: "oralExam_charlotteVoice"
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
function setToken(token) {
  AUTH_TOKEN = token;
  try {
    if (token) ;
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
  }
}
function clearToken() {
  setToken(null);
  USE_BACKEND = false;
}
async function fetchApi(method, path, body) {
  const opts = { method, headers: {} };
  const token = getToken();
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body !== void 0) opts.headers["Content-Type"] = "application/json";
  if (body !== void 0 && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  return res.json();
}
async function initBackend() {
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
      fetchApi("GET", "/api/settings")
    ]);
    CACHE[STORAGE_KEYS.lastSession] = lastSession;
    CACHE[STORAGE_KEYS.sessionHistory] = Array.isArray(sessionHistory) ? sessionHistory : [];
    CACHE[STORAGE_KEYS.weakAreas] = Array.isArray(weakAreas) ? weakAreas : [];
    CACHE[STORAGE_KEYS.examDate] = (settings == null ? void 0 : settings.examDate) ?? null;
    CACHE[STORAGE_KEYS.focusToday] = (settings == null ? void 0 : settings.focusToday) ?? null;
    CACHE[STORAGE_KEYS.customSubjects] = (settings == null ? void 0 : settings.customSubjects) ?? [];
    CACHE[STORAGE_KEYS.subjectRenames] = (settings == null ? void 0 : settings.subjectRenames) ?? {};
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
  } catch (_) {
  }
}
function loadStorage(key, fallback) {
  if (USE_BACKEND && key in CACHE) return CACHE[key];
  return loadStorageLocal(key, fallback);
}
function saveStorage(key, value) {
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
      } else if (key === STORAGE_KEYS.examDate || key === STORAGE_KEYS.focusToday || key === STORAGE_KEYS.customSubjects || key === STORAGE_KEYS.subjectRenames) {
        const settings = await fetchApi("GET", "/api/settings");
        if (key === STORAGE_KEYS.examDate)
          await fetchApi("PUT", "/api/settings", { ...settings, examDate: value });
        else if (key === STORAGE_KEYS.focusToday)
          await fetchApi("PUT", "/api/settings", { ...settings, focusToday: value });
        else if (key === STORAGE_KEYS.customSubjects)
          await fetchApi("PUT", "/api/settings", { ...settings, customSubjects: value });
        else await fetchApi("PUT", "/api/settings", { ...settings, subjectRenames: value });
      }
    } catch (_) {
    }
  })();
}
function clearLastSessionStorage() {
  delete CACHE[STORAGE_KEYS.lastSession];
  if (!USE_BACKEND) {
    localStorage.removeItem(STORAGE_KEYS.lastSession);
    return;
  }
  fetch(API_BASE + "/api/last-session", {
    method: "DELETE",
    headers: getToken() ? { Authorization: "Bearer " + getToken() } : {}
  }).catch(() => {
  });
}
async function getAllBySubject(subject) {
  if (!USE_BACKEND) return getAllBySubject$1(subject);
  const list = await fetchApi("GET", "/api/items?subject=" + encodeURIComponent(subject));
  return list || [];
}
async function getUniqueSubjects() {
  if (!USE_BACKEND) return getUniqueSubjects$1();
  const list = await fetchApi("GET", "/api/items/subjects");
  return list || [];
}
async function getItem(id) {
  if (!USE_BACKEND) return getItem$1(id);
  const item = await fetchApi("GET", "/api/items/" + encodeURIComponent(id));
  if (!item) return null;
  if (item.type === "file") {
    const token = getToken();
    const res = await fetch(API_BASE + "/api/items/" + encodeURIComponent(id) + "/download", {
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    const buf = await res.arrayBuffer();
    item.content = buf;
  }
  return item;
}
async function addItem(item) {
  if (!USE_BACKEND) return addItem$1(item);
  if (item.type === "file" && (item.content instanceof ArrayBuffer || item.content instanceof Blob)) {
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
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    const data2 = await res.json();
    if (res.status === 401) {
      clearToken();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(data2.error || "Upload failed");
    return data2.id;
  }
  const body = {
    subject: item.subject,
    subfolder: item.subfolder || "",
    name: item.name,
    type: item.type || "note",
    content: item.type === "note" ? item.content : void 0
  };
  const data = await fetchApi("POST", "/api/items", body);
  return data.id;
}
async function updateItem(id, updates) {
  if (!USE_BACKEND) return updateItem$1(id, updates);
  await fetchApi("PATCH", "/api/items/" + encodeURIComponent(id), updates);
}
async function deleteItem(id) {
  if (!USE_BACKEND) return deleteItem$1(id);
  await fetchApi("DELETE", "/api/items/" + encodeURIComponent(id));
}
async function fetchTTSAudio(text, voice = null) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...token ? { Authorization: "Bearer " + token } : {}
    },
    body: JSON.stringify({ text: String(text).trim(), ...voice ? { voice } : {} })
  });
  if (res.status === 503) {
    try {
      const data = await res.json();
      if (data.code === "TTS_NOT_CONFIGURED") return null;
    } catch (_) {
    }
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (data.detail) detail = data.detail;
      else if (data.error) detail = data.error;
    } catch (_) {
    }
    throw new Error(`TTS ${res.status}: ${detail}`);
  }
  return res.blob();
}
async function fetchChat(message, history = []) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...token ? { Authorization: "Bearer " + token } : {}
    },
    body: JSON.stringify({ message: String(message).trim(), history })
  });
  if (res.status === 503) {
    const data2 = await res.json().catch(() => ({}));
    if (data2.code === "CHAT_NOT_CONFIGURED") return null;
  }
  if (!res.ok) throw new Error("Chat failed");
  const data = await res.json();
  return data.reply ?? "";
}
async function fetchGenerateQuestions(material) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api/generate-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...token ? { Authorization: "Bearer " + token } : {}
    },
    body: JSON.stringify({ material: String(material).trim() })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.hint || data.error || "Could not generate questions";
    throw new Error(msg);
  }
  return data;
}
async function getSubfolders(subject) {
  if (!USE_BACKEND) {
    const items2 = await getAllBySubject$1(subject);
    const set2 = new Set(items2.map((i) => i.subfolder || "").filter(Boolean));
    return Array.from(set2).sort();
  }
  const items = await getAllBySubject(subject);
  const set = new Set(items.map((i) => i.subfolder || "").filter(Boolean));
  return Array.from(set).sort();
}
export {
  STORAGE_KEYS as S,
  fetchChat as a,
  getAllBySubject as b,
  getItem as c,
  fetchGenerateQuestions as d,
  clearLastSessionStorage as e,
  fetchTTSAudio as f,
  getUniqueSubjects as g,
  addItem as h,
  initBackend as i,
  deleteItem as j,
  getSubfolders as k,
  loadStorage as l,
  saveStorage as s,
  updateItem as u
};
