export type AppUserRecord = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  active: boolean;
  employeeBpId: string;
  notes: string;
  roleIds: string[];
};

import type { WindowAccessMap } from "@/lib/access/window-access";

export type TaskTypePermission = {
  taskTypeId: string;
  canSee: boolean;
  canSelect: boolean;
  canCreate: boolean;
};

export type AppRoleRecord = {
  id: string;
  roleKey: string;
  name: string;
  description: string;
  active: boolean;
  windowKeys: string[];
  windowAccess: WindowAccessMap;
  processIds: string[];
  reportIds: string[];
  taskTypePermissions: TaskTypePermission[];
};

export type AuthSession = {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  employeeBpId: string;
  activeRoleId: string;
  activeRoleName: string;
  sessionId: string;
  idleTimeoutMinutes?: number;
  windowKeys: string[];
  windowAccess: WindowAccessMap;
  processIds: string[];
  reportIds: string[];
  taskTypePermissions: TaskTypePermission[];
  agentIds: string[];
};

export function displayName(user: Pick<AppUserRecord, "firstName" | "lastName" | "username">) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.username;
}

export function userInitials(user: Pick<AppUserRecord, "firstName" | "lastName" | "username">) {
  const name = displayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
