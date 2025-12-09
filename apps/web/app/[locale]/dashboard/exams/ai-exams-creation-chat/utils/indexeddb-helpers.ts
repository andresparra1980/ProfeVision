/**
 * Clears IndexedDB stores used by the persistence layer
 * Handles errors gracefully and resolves even if operations fail
 */
export async function clearIndexedDBStores(): Promise<void> {
  if (typeof window === "undefined") return;

  await new Promise<void>((resolve) => {
    const req = window.indexedDB.open("pv_v1");
    req.onsuccess = () => {
      const db = req.result;
      const clearStore = (name: string, done: () => void) => {
        try {
          if (!db.objectStoreNames.contains(name)) {
            done();
            return;
          }
          const tx = db.transaction([name], "readwrite");
          tx.oncomplete = () => done();
          tx.onerror = () => done();
          try {
            tx.objectStore(name).clear();
          } catch {
            done();
          }
        } catch {
          done();
        }
      };
      // Clear sequentially to keep logic simple
      clearStore("docs", () => clearStore("outputs", () => resolve()));
    };
    req.onerror = () => resolve();
  });
}
