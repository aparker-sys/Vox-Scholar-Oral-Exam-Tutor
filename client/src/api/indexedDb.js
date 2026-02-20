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

export async function getAll() {
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

export async function getUniqueSubjects() {
  const items = await getAll();
  const subjects = new Set(items.map((i) => i.subject).filter(Boolean));
  return Array.from(subjects).sort();
}

export async function getAllBySubject(subject) {
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

export async function addItem(item) {
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
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record.id);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getItem(id) {
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

export async function updateItem(id, updates) {
  const existing = await getItem(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  if (!("content" in updates) && existing.content !== undefined) merged.content = existing.content;
  await addItem(merged);
  return merged.id;
}

export async function deleteItem(id) {
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

export async function getSubfolders(subject) {
  const items = await getAllBySubject(subject);
  const subfolders = new Set(items.map((i) => i.subfolder || "").filter(Boolean));
  return Array.from(subfolders).sort();
}
