/* Client-side persistence utilities for settings, chat sessions, documents, and outputs.
 * Storage:
 * - localStorage: small metadata (settings, sessions, last doc context)
 * - IndexedDB: large payloads (documents, outputs)
 */

// Types per mddocs/ai_chat/DOC_persistencia_browser.md
export interface SettingsV1 {
  language: string; // "es", "en"
  theme: "light" | "dark" | "system";
  defaultModel?: string;
  limits?: { maxQuestions?: number; maxTextChars?: number };
}

export interface ChatSessionIndexItemV1 {
  id: string;
  createdAt: string; // ISO
  title: string;
  documentId?: string;
  tags?: string[];
}

const LS_KEYS = {
  settings: "pv.settings.v1",
  sessions: "pv.chat.sessions.v1",
  lastDoc: "pv.lastDocumentContext.v1",
  lastDocs: "pv.lastDocumentsContext.v1",
} as const;

// --- LocalStorage helpers ---
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (_e) {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (_e) {
    // Quota errors ignored silently by design; caller may handle fallbacks
  }
}

// Debounce writes per key
const pendingTimers = new Map<string, number>();
function debounceSet<T>(key: string, value: T, delay = 300) {
  if (typeof window === "undefined") return;
  const existing = pendingTimers.get(key);
  if (existing) window.clearTimeout(existing);
  const id = window.setTimeout(() => {
    lsSet(key, value);
    pendingTimers.delete(key);
  }, delay);
  pendingTimers.set(key, id);
}

// --- IndexedDB helpers ---
interface IDBEntry<T = unknown> {
  id: string; // composite key when needed
  kind?: string; // e.g., "exam" | "summary"
  payload: T;
  createdAt: string;
  updatedAt: string;
}

let idbPromise: Promise<IDBDatabase> | null = null;
function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (idbPromise) {
    // Re-validate stores on every call in case the cached DB lacks them (e.g., after code updates)
    idbPromise = idbPromise.then((db) => new Promise<IDBDatabase>((resolve, reject) => {
      const needsDocs = !db.objectStoreNames.contains("docs");
      const needsOutputs = !db.objectStoreNames.contains("outputs");
      if (!needsDocs && !needsOutputs) {
        resolve(db);
        return;
      }
      const nextVersion = (db.version || 1) + 1;
      try { db.close(); } catch { /* ignore */ }
      const upgradeReq = window.indexedDB.open("pv_v1", nextVersion);
      upgradeReq.onerror = () => reject(upgradeReq.error);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains("docs")) {
          udb.createObjectStore("docs", { keyPath: "id" });
        }
        if (!udb.objectStoreNames.contains("outputs")) {
          const store = udb.createObjectStore("outputs", { keyPath: "id" });
          try { store.createIndex("by_kind", "kind", { unique: false }); } catch { /* ignore */ }
        }
      };
      upgradeReq.onsuccess = () => resolve(upgradeReq.result);
    }));
    return idbPromise;
  }
  idbPromise = new Promise((resolve, reject) => {
    const ensureStores = (db: IDBDatabase) => {
      const needsDocs = !db.objectStoreNames.contains("docs");
      const needsOutputs = !db.objectStoreNames.contains("outputs");
      if (!needsDocs && !needsOutputs) {
        resolve(db);
        return;
      }
      // Bump version to create missing stores
      const nextVersion = (db.version || 1) + 1;
      try { db.close(); } catch { /* ignore */ }
      const upgradeReq = window.indexedDB.open("pv_v1", nextVersion);
      upgradeReq.onerror = () => reject(upgradeReq.error);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains("docs")) {
          udb.createObjectStore("docs", { keyPath: "id" });
        }
        if (!udb.objectStoreNames.contains("outputs")) {
          const store = udb.createObjectStore("outputs", { keyPath: "id" });
          try {
            store.createIndex("by_kind", "kind", { unique: false });
          } catch { /* ignore */ }
        }
      };
      upgradeReq.onsuccess = () => resolve(upgradeReq.result);
    };

    // Open DB without specifying a fixed version to avoid 'requested version < existing version' errors
    const req = window.indexedDB.open("pv_v1");
    req.onerror = () => reject(req.error);
    // If DB exists already, success will fire immediately. We then ensure stores and bump version if needed.
    req.onsuccess = () => ensureStores(req.result);
  });
  return idbPromise;
}

async function idbPut(storeName: "docs" | "outputs", entry: IDBEntry) {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(storeName);
    store.put(entry);
    tx.oncomplete = () => resolve();
  });
}

async function idbGet<T = unknown>(storeName: "docs" | "outputs", id: string): Promise<T | null> {
  const db = await getDB();
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => {
      const val = req.result as IDBEntry<T> | undefined;
      resolve(val ? val.payload : null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: "docs" | "outputs", id: string) {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
  });
}

// --- Public API ---
export function loadSettings(): SettingsV1 {
  const defaults: SettingsV1 = { language: "es", theme: "system" };
  return lsGet<SettingsV1>(LS_KEYS.settings, defaults);
}

export function saveSettings(partial: Partial<SettingsV1>) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  debounceSet(LS_KEYS.settings, next, 300);
}

export function listChatSessions(): ChatSessionIndexItemV1[] {
  return lsGet<ChatSessionIndexItemV1[]>(LS_KEYS.sessions, []);
}

export function saveChatSession(session: ChatSessionIndexItemV1) {
  const list = listChatSessions();
  const idx = list.findIndex((x) => x.id === session.id);
  if (idx >= 0) list[idx] = session; else list.unshift(session);
  debounceSet(LS_KEYS.sessions, list, 300);
}

export function deleteChatSession(id: string) {
  const list = listChatSessions().filter((x) => x.id !== id);
  debounceSet(LS_KEYS.sessions, list, 300);
}

export function saveLastDocumentContext(ctx: { documentId: string; meta?: Record<string, unknown> }) {
  debounceSet(LS_KEYS.lastDoc, ctx, 300);
}

export function loadLastDocumentContext(): { documentId: string; meta?: Record<string, unknown> } | null {
  return lsGet(LS_KEYS.lastDoc, null);
}

export function clearLastDocumentContext() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_KEYS.lastDoc);
    window.localStorage.removeItem(LS_KEYS.lastDocs);
  } catch (_e) {
    // ignore
  }
}

// Multi-document context helpers (non-breaking new API)
export function saveLastDocumentsContext(ctx: { documentIds: string[] }) {
  // Clamp to max 5 when saving
  const unique = Array.from(new Set(ctx.documentIds)).slice(0, 5);
  debounceSet(LS_KEYS.lastDocs, { documentIds: unique }, 300);
}

export function loadLastDocumentsContext(): { documentIds: string[] } | null {
  const val = lsGet<{ documentIds: string[] } | null>(LS_KEYS.lastDocs, null);
  if (val && Array.isArray(val.documentIds)) return { documentIds: val.documentIds };
  // Back-compat: if only single lastDoc exists, adapt to array
  const single = loadLastDocumentContext();
  if (single?.documentId) return { documentIds: [single.documentId] };
  return null;
}

export async function saveDocument(documentId: string, payload: unknown) {
  const now = new Date().toISOString();
  await idbPut("docs", { id: documentId, payload, createdAt: now, updatedAt: now });
}

export async function loadDocument<T = unknown>(documentId: string): Promise<T | null> {
  return idbGet<T>("docs", documentId);
}

export async function deleteDocument(documentId: string) {
  await idbDelete("docs", documentId);
}

export async function saveOutput(kind: string, id: string, payload: unknown) {
  const key = `${kind}:${id}`;
  const now = new Date().toISOString();
  await idbPut("outputs", { id: key, kind, payload, createdAt: now, updatedAt: now });
}

export async function loadOutput<T = unknown>(kind: string, id: string): Promise<T | null> {
  const key = `${kind}:${id}`;
  return idbGet<T>("outputs", key);
}

export async function deleteOutput(kind: string, id: string) {
  const key = `${kind}:${id}`;
  await idbDelete("outputs", key);
}

const browserPersistenceApi = {
  loadSettings,
  saveSettings,
  listChatSessions,
  saveChatSession,
  deleteChatSession,
  saveLastDocumentContext,
  loadLastDocumentContext,
  clearLastDocumentContext,
  saveDocument,
  loadDocument,
  deleteDocument,
  saveOutput,
  loadOutput,
  deleteOutput,
};

export default browserPersistenceApi;
