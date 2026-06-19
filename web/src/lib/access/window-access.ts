import { isSystemSurfaceWindow, sanitizeAppWindowKeys, windowByKey } from "@/lib/access/catalog";
import type { AppRoleRecord, AuthSession } from "@/lib/access/types";

export type WindowAccessLevel = "read" | "write";
export type WindowAccessMap = Record<string, WindowAccessLevel>;

function isHomePanelKey(key: string): boolean {
  return key.startsWith("home-");
}

export function windowAccessFromKeys(
  windowKeys: string[],
  defaultLevel: WindowAccessLevel = "write"
): WindowAccessMap {
  const map: WindowAccessMap = {};
  for (const key of sanitizeAppWindowKeys(windowKeys)) {
    map[key] = defaultLevel;
  }
  return map;
}

export function windowKeysFromAccess(access: WindowAccessMap): string[] {
  return sanitizeAppWindowKeys(Object.keys(access));
}

export function sanitizeWindowAccess(access: WindowAccessMap): WindowAccessMap {
  const next: WindowAccessMap = {};
  for (const [key, level] of Object.entries(access)) {
    if (isSystemSurfaceWindow(key)) continue;
    if (level !== "read" && level !== "write") continue;
    if (isHomePanelKey(key)) {
      next[key] = "read";
      continue;
    }
    next[key] = level;
  }

  for (const key of Object.keys(next)) {
    const win = windowByKey(key);
    const parent = win?.parentWindowKey;
    if (parent && !next[parent]) {
      delete next[key];
    }
  }

  return next;
}

export function normalizeRoleWindowAccess(role: AppRoleRecord): AppRoleRecord {
  const hasAccessMap = role.windowAccess && Object.keys(role.windowAccess).length > 0;
  const windowAccess = sanitizeWindowAccess(
    hasAccessMap ? { ...role.windowAccess } : windowAccessFromKeys(role.windowKeys ?? [], "write")
  );
  const windowKeys = windowKeysFromAccess(windowAccess);
  return { ...role, windowAccess, windowKeys };
}

export function canReadWindow(access: WindowAccessMap | undefined, key: string): boolean {
  if (!access?.[key]) return false;
  const win = windowByKey(key);
  if (win?.parentWindowKey && !access[win.parentWindowKey]) return false;
  return true;
}

export function canWriteWindow(access: WindowAccessMap | undefined, key: string): boolean {
  return canReadWindow(access, key) && access![key] === "write";
}

export function canReadWindowSession(session: Pick<AuthSession, "windowKeys" | "windowAccess">, key: string): boolean {
  if (session.windowAccess && Object.keys(session.windowAccess).length > 0) {
    return canReadWindow(session.windowAccess, key);
  }
  return session.windowKeys.includes(key);
}

export function canWriteWindowSession(session: Pick<AuthSession, "windowKeys" | "windowAccess">, key: string): boolean {
  if (session.windowAccess && Object.keys(session.windowAccess).length > 0) {
    return canWriteWindow(session.windowAccess, key);
  }
  return session.windowKeys.includes(key);
}

/** True when the role can save a record in a module (write on parent or any child tab). */
export function canSaveModuleRecord(
  session: Pick<AuthSession, "windowKeys" | "windowAccess">,
  moduleKey: string,
  childKeyPrefix: string
): boolean {
  if (canWriteWindowSession(session, moduleKey)) return true;
  const access = session.windowAccess;
  if (access && Object.keys(access).length > 0) {
    return Object.entries(access).some(
      ([key, level]) => level === "write" && key.startsWith(`${childKeyPrefix}-`)
    );
  }
  return session.windowKeys.includes(moduleKey);
}

export function setWindowAccessLevel(
  access: WindowAccessMap,
  key: string,
  level: WindowAccessLevel | null
): WindowAccessMap {
  const next = { ...access };
  if (!level) {
    delete next[key];
    for (const child of Object.keys(next)) {
      if (windowByKey(child)?.parentWindowKey === key) delete next[child];
    }
    return sanitizeWindowAccess(next);
  }

  next[key] = level;
  const win = windowByKey(key);
  if (win?.parentWindowKey && !next[win.parentWindowKey]) {
    next[win.parentWindowKey] = "read";
  }

  if (key === "home") {
    next["home-prompt"] = "read";
    next["home-needs-attention"] = "read";
    next["home-today"] = "read";
  }

  return sanitizeWindowAccess(next);
}

export function windowAccessLevel(access: WindowAccessMap, key: string): WindowAccessLevel | null {
  return access[key] ?? null;
}

export function homePanelAccessLevel(): WindowAccessLevel {
  return "read";
}

export function assertWriteWindowAccess(
  session: Pick<AuthSession, "windowKeys" | "windowAccess"> | null,
  key: string,
  label = "this area"
): void {
  if (!session || !canWriteWindowSession(session, key)) {
    throw new Error(`You do not have write access to ${label}.`);
  }
}
