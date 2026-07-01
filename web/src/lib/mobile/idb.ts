import {
  MOBILE_IDB_GEO_STORE,
  MOBILE_IDB_NAME,
  MOBILE_IDB_SHIFTS_STORE,
  MOBILE_IDB_WRITES_STORE,
  type MobileOfflineWrite,
} from "@/lib/mobile/constants";
import type { RosterShiftRecord } from "@/lib/roster-shift";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(MOBILE_IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MOBILE_IDB_WRITES_STORE)) {
        db.createObjectStore(MOBILE_IDB_WRITES_STORE, { keyPath: "syncId" });
      }
      if (!db.objectStoreNames.contains(MOBILE_IDB_SHIFTS_STORE)) {
        db.createObjectStore(MOBILE_IDB_SHIFTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MOBILE_IDB_GEO_STORE)) {
        db.createObjectStore(MOBILE_IDB_GEO_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = run(store);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      })
  );
}

export async function idbPutOfflineWrite(write: MobileOfflineWrite): Promise<void> {
  await tx(MOBILE_IDB_WRITES_STORE, "readwrite", (s) => s.put(write));
}

export async function idbListOfflineWrites(): Promise<MobileOfflineWrite[]> {
  return tx<MobileOfflineWrite[]>(MOBILE_IDB_WRITES_STORE, "readonly", (s) => s.getAll());
}

export async function idbDeleteOfflineWrite(syncId: string): Promise<void> {
  await tx(MOBILE_IDB_WRITES_STORE, "readwrite", (s) => s.delete(syncId));
}

export async function idbUpdateOfflineWrite(write: MobileOfflineWrite): Promise<void> {
  await idbPutOfflineWrite(write);
}

export async function idbClearShiftCache(): Promise<void> {
  await tx(MOBILE_IDB_SHIFTS_STORE, "readwrite", (s) => s.clear());
}

export async function idbPutShifts(shifts: RosterShiftRecord[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MOBILE_IDB_SHIFTS_STORE, "readwrite");
    const store = transaction.objectStore(MOBILE_IDB_SHIFTS_STORE);
    for (const shift of shifts) store.put(shift);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("shift cache write failed"));
  });
}

export async function idbGetAllShifts(): Promise<RosterShiftRecord[]> {
  return tx<RosterShiftRecord[]>(MOBILE_IDB_SHIFTS_STORE, "readonly", (s) => s.getAll());
}

export type GeoCacheEntry = {
  key: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: number;
};

export async function idbPutGeo(entry: GeoCacheEntry): Promise<void> {
  await tx(MOBILE_IDB_GEO_STORE, "readwrite", (s) => s.put(entry));
}

export async function idbGetGeo(): Promise<GeoCacheEntry | null> {
  const row = await tx<GeoCacheEntry | undefined>(MOBILE_IDB_GEO_STORE, "readonly", (s) => s.get("last"));
  return row ?? null;
}
