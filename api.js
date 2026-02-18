/**
 * Vox Scholar API client — uses backend when available, else localStorage + IndexedDB
 */
(function () {
  "use strict";
  const API_BASE = ""; // same origin
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

  async function fetchApi(method, path, body) {
    const opts = { method, headers: {} };
    if (body !== undefined) opts.headers["Content-Type"] = "application/json";
    if (body !== undefined && method !== "GET") opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) throw new Error(res.statusText);
    if (res.status === 204 || res.headers.get("content-length") === "0") return null;
    return res.json();
  }

  async function initBackend() {
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
      CACHE[STORAGE_KEYS.examDate] = settings && settings.examDate != null ? settings.examDate : null;
      CACHE[STORAGE_KEYS.focusToday] = settings && settings.focusToday != null ? settings.focusToday : null;
      CACHE[STORAGE_KEYS.customSubjects] = settings && Array.isArray(settings.customSubjects) ? settings.customSubjects : [];
      USE_BACKEND = true;
      installBackendStorage();
      installBackendItems();
    } catch (_) {
      USE_BACKEND = false;
    }
    window.dispatchEvent(new Event("vox-api-ready"));
  }

  function installBackendStorage() {
    window.loadStorage = function (key, fallback) {
      if (key in CACHE) return CACHE[key];
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    window.saveStorage = function (key, value) {
      CACHE[key] = value;
      if (!USE_BACKEND) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (_) {}
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
          } else if (key === STORAGE_KEYS.examDate || key === STORAGE_KEYS.focusToday || key === STORAGE_KEYS.customSubjects) {
            const settings = await fetchApi("GET", "/api/settings");
            if (key === STORAGE_KEYS.examDate) await fetchApi("PUT", "/api/settings", { ...settings, examDate: value });
            else if (key === STORAGE_KEYS.focusToday) await fetchApi("PUT", "/api/settings", { ...settings, focusToday: value });
            else await fetchApi("PUT", "/api/settings", { ...settings, customSubjects: value });
          }
        } catch (_) {}
      })();
    };
    window.clearLastSessionStorage = function () {
      delete CACHE[STORAGE_KEYS.lastSession];
      if (!USE_BACKEND) {
        localStorage.removeItem(STORAGE_KEYS.lastSession);
        return;
      }
      fetch(API_BASE + "/api/last-session", { method: "DELETE" }).catch(() => {});
    };
  }

  function installBackendItems() {
    const orig = {
      getAllBySubject: window.getAllBySubject,
      getUniqueSubjects: window.getUniqueSubjects,
      getItem: window.getItem,
      addItem: window.addItem,
      updateItem: window.updateItem,
      deleteItem: window.deleteItem,
      getSubfolders: window.getSubfolders,
    };
    window.getAllBySubject = async function (subject) {
      if (!USE_BACKEND) return orig.getAllBySubject ? await orig.getAllBySubject(subject) : [];
      const list = await fetchApi("GET", "/api/items?subject=" + encodeURIComponent(subject));
      return list || [];
    };
    window.getUniqueSubjects = async function () {
      if (!USE_BACKEND) return orig.getUniqueSubjects ? await orig.getUniqueSubjects() : [];
      const list = await fetchApi("GET", "/api/items/subjects");
      return list || [];
    };
    window.getItem = async function (id) {
      if (!USE_BACKEND) return orig.getItem ? await orig.getItem(id) : null;
      const item = await fetchApi("GET", "/api/items/" + encodeURIComponent(id));
      if (!item) return null;
      if (item.type === "file" && item.content) {
        const buf = await fetch(API_BASE + "/api/items/" + encodeURIComponent(id) + "/download").then((r) => r.arrayBuffer());
        item.content = buf;
      }
      return item;
    };
    window.addItem = async function (item) {
      if (!USE_BACKEND) return orig.addItem ? await orig.addItem(item) : null;
      if (item.type === "file" && (item.content instanceof ArrayBuffer || item.content instanceof Blob)) {
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
    };
    window.updateItem = async function (id, updates) {
      if (!USE_BACKEND) return orig.updateItem ? await orig.updateItem(id, updates) : null;
      await fetchApi("PATCH", "/api/items/" + encodeURIComponent(id), updates);
    };
    window.deleteItem = async function (id) {
      if (!USE_BACKEND) return orig.deleteItem ? await orig.deleteItem(id) : null;
      await fetch(API_BASE + "/api/items/" + encodeURIComponent(id), { method: "DELETE" });
    };
    window.getSubfolders = async function (subject) {
      if (!USE_BACKEND) return orig.getSubfolders ? await orig.getSubfolders(subject) : [];
      const items = await window.getAllBySubject(subject);
      const set = new Set(items.map((i) => i.subfolder || "").filter(Boolean));
      return Array.from(set).sort();
    };
  }

  if (!window.loadStorage) {
    window.loadStorage = function (key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
  }
  if (!window.saveStorage) {
    window.saveStorage = function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    };
  }
  if (!window.clearLastSessionStorage) {
    window.clearLastSessionStorage = function () {
      localStorage.removeItem(STORAGE_KEYS.lastSession);
    };
  }

  initBackend();
})();
