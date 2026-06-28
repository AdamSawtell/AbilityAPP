import type {
  AdminMessageAcknowledgmentRecord,
  AdminMessageComposePayload,
  AdminMessageDisplayMethod,
  AdminMessageRecord,
  AdminMessageRecurrenceConfig,
  AdminMessageRecipientRow,
  AdminMessageRecipientStatus,
  AdminMessageStatus,
  AdminMessageSummary,
  PendingAdminMessage,
} from "@/lib/admin-communications/types";
import { normalizeAdminMessage, normalizeRecurrence } from "@/lib/admin-communications/types";

type AppUserRow = { id: string; username: string; first_name: string; last_name: string; active: boolean };
type UserRoleRow = { user_id: string; role_id: string };
type RoleRow = { id: string; name: string };

export function messageRowToRecord(row: Record<string, unknown>): AdminMessageRecord {
  return normalizeAdminMessage({
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    senderUserId: String(row.sender_user_id ?? ""),
    senderName: String(row.sender_name ?? ""),
    audienceType: row.audience_type === "roles" ? "roles" : "all",
    audienceRoleIds: Array.isArray(row.audience_role_ids) ? row.audience_role_ids.map(String) : [],
    requiresAcknowledgment: Boolean(row.requires_acknowledgment),
    displayMethod: row.display_method === "banner" ? "banner" : "modal",
    publishAt: String(row.publish_at ?? ""),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    recurrence: normalizeRecurrence(row.recurrence_config),
    status: (row.status as AdminMessageStatus) ?? "active",
    closedAt: row.closed_at ? String(row.closed_at) : null,
    closedBy: String(row.closed_by ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdBy: String(row.created_by ?? ""),
    updatedBy: String(row.updated_by ?? ""),
  });
}

export function messageRecordToRow(record: AdminMessageRecord) {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    sender_user_id: record.senderUserId || null,
    sender_name: record.senderName,
    audience_type: record.audienceType,
    audience_role_ids: record.audienceRoleIds,
    requires_acknowledgment: record.requiresAcknowledgment,
    display_method: record.displayMethod,
    publish_at: record.publishAt,
    expires_at: record.expiresAt,
    recurrence_config: record.recurrence,
    status: record.status,
    closed_at: record.closedAt,
    closed_by: record.closedBy,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function ackRowToRecord(row: Record<string, unknown>): AdminMessageAcknowledgmentRecord {
  return {
    id: String(row.id),
    messageId: String(row.message_id),
    userId: String(row.user_id),
    recurrencePeriod: String(row.recurrence_period ?? ""),
    seenAt: row.seen_at ? String(row.seen_at) : null,
    acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : null,
    bannerDismissedAt: row.banner_dismissed_at ? String(row.banner_dismissed_at) : null,
    createdAt: String(row.created_at ?? ""),
  };
}

/** ISO week key YYYY-Www for weekly recurrence cycles. */
export function recurrencePeriodKey(recurrence: AdminMessageRecurrenceConfig, at: Date): string {
  if (recurrence.type !== "weekly") return "";
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function effectiveMessageStatus(message: AdminMessageRecord, now = new Date()): AdminMessageStatus {
  if (message.status === "closed") return "closed";
  if (message.expiresAt && new Date(message.expiresAt) <= now) return "expired";
  const publishAt = new Date(message.publishAt);
  if (publishAt > now) return "scheduled";
  if (message.status === "expired") return "expired";
  return "active";
}

/** Returns true when the stored status should be updated in the database. */
export function messageStatusNeedsSync(message: AdminMessageRecord, now = new Date()): AdminMessageStatus | null {
  const effective = effectiveMessageStatus(message, now);
  if (effective === message.status) return null;
  if (message.status === "closed") return null;
  return effective;
}

/** A sender never receives or has to acknowledge their own broadcast. */
export function userIsSender(message: AdminMessageRecord, userId: string): boolean {
  return Boolean(message.senderUserId) && message.senderUserId === userId;
}

export function resolveAudienceUserIds(
  message: AdminMessageRecord,
  users: AppUserRow[],
  userRoles: UserRoleRow[]
): string[] {
  const activeUsers = users.filter((u) => u.active && !userIsSender(message, u.id));
  if (message.audienceType === "all") return activeUsers.map((u) => u.id);
  const roleSet = new Set(message.audienceRoleIds);
  const byUser = new Map<string, string[]>();
  for (const link of userRoles) {
    const list = byUser.get(link.user_id) ?? [];
    list.push(link.role_id);
    byUser.set(link.user_id, list);
  }
  return activeUsers
    .filter((u) => (byUser.get(u.id) ?? []).some((roleId) => roleSet.has(roleId)))
    .map((u) => u.id);
}

export function userMatchesAudience(
  message: AdminMessageRecord,
  userId: string,
  userRoleIds: string[]
): boolean {
  if (message.audienceType === "all") return true;
  const roleSet = new Set(message.audienceRoleIds);
  return userRoleIds.some((id) => roleSet.has(id));
}

function effectiveDisplayMethod(message: AdminMessageRecord): AdminMessageDisplayMethod {
  if (!message.requiresAcknowledgment) return "banner";
  return message.displayMethod;
}

function ackForPeriod(
  acks: AdminMessageAcknowledgmentRecord[],
  userId: string,
  period: string
): AdminMessageAcknowledgmentRecord | undefined {
  return acks.find((a) => a.userId === userId && a.recurrencePeriod === period);
}

export function isPendingForUser(
  message: AdminMessageRecord,
  userId: string,
  userRoleIds: string[],
  acks: AdminMessageAcknowledgmentRecord[],
  now = new Date()
): PendingAdminMessage | null {
  const status = effectiveMessageStatus(message, now);
  if (status !== "active") return null;
  if (userIsSender(message, userId)) return null;
  if (!userMatchesAudience(message, userId, userRoleIds)) return null;

  const period = recurrencePeriodKey(message.recurrence, now);
  const ack = ackForPeriod(acks, userId, period);
  const displayMethod = effectiveDisplayMethod(message);

  if (message.requiresAcknowledgment && displayMethod === "modal") {
    if (ack?.acknowledgedAt) return null;
    return {
      id: message.id,
      title: message.title,
      body: message.body,
      senderName: message.senderName,
      publishAt: message.publishAt,
      requiresAcknowledgment: true,
      displayMethod: "modal",
      recurrencePeriod: period,
    };
  }

  if (displayMethod === "banner") {
    if (ack?.bannerDismissedAt || ack?.acknowledgedAt) return null;
    return {
      id: message.id,
      title: message.title,
      body: message.body,
      senderName: message.senderName,
      publishAt: message.publishAt,
      requiresAcknowledgment: message.requiresAcknowledgment,
      displayMethod: "banner",
      recurrencePeriod: period,
    };
  }

  return null;
}

export function buildPendingQueue(
  messages: AdminMessageRecord[],
  userId: string,
  userRoleIds: string[],
  acks: AdminMessageAcknowledgmentRecord[],
  now = new Date()
): PendingAdminMessage[] {
  const modal: PendingAdminMessage[] = [];
  const banners: PendingAdminMessage[] = [];

  for (const message of messages) {
    const pending = isPendingForUser(message, userId, userRoleIds, acks, now);
    if (!pending) continue;
    if (pending.displayMethod === "modal" && pending.requiresAcknowledgment) modal.push(pending);
    else banners.push(pending);
  }

  modal.sort((a, b) => a.publishAt.localeCompare(b.publishAt));
  banners.sort((a, b) => a.publishAt.localeCompare(b.publishAt));
  return [...modal, ...banners];
}

export function buildMessageSummary(
  message: AdminMessageRecord,
  users: AppUserRow[],
  userRoles: UserRoleRow[],
  acks: AdminMessageAcknowledgmentRecord[],
  now = new Date()
): AdminMessageSummary {
  const recipientIds = resolveAudienceUserIds(message, users, userRoles);
  const period = recurrencePeriodKey(message.recurrence, now);
  const relevantAcks = acks.filter(
    (a) =>
      a.messageId === message.id &&
      recipientIds.includes(a.userId) &&
      (message.recurrence.type === "weekly" ? a.recurrencePeriod === period : a.recurrencePeriod === "")
  );

  const seenCount = relevantAcks.filter((a) => a.seenAt || a.acknowledgedAt || a.bannerDismissedAt).length;
  const acknowledgedCount = relevantAcks.filter((a) => a.acknowledgedAt).length;

  return {
    ...message,
    status: effectiveMessageStatus(message, now),
    recipientCount: recipientIds.length,
    seenCount,
    acknowledgedCount,
    pendingCount: Math.max(0, recipientIds.length - acknowledgedCount),
  };
}

export function buildRecipientRegister(
  message: AdminMessageRecord,
  users: AppUserRow[],
  userRoles: UserRoleRow[],
  roles: RoleRow[],
  acks: AdminMessageAcknowledgmentRecord[],
  now = new Date()
): AdminMessageRecipientRow[] {
  const recipientIds = resolveAudienceUserIds(message, users, userRoles);
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const rolesByUser = new Map<string, string[]>();
  for (const link of userRoles) {
    const list = rolesByUser.get(link.user_id) ?? [];
    list.push(link.role_id);
    rolesByUser.set(link.user_id, list);
  }

  const period = recurrencePeriodKey(message.recurrence, now);

  return recipientIds
    .map((userId) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return null;
      const ack = acks.find(
        (a) =>
          a.messageId === message.id &&
          a.userId === userId &&
          (message.recurrence.type === "weekly" ? a.recurrencePeriod === period : a.recurrencePeriod === "")
      );
      let status: AdminMessageRecipientStatus = "not_seen";
      if (ack?.acknowledgedAt) status = "acknowledged";
      else if (ack?.bannerDismissedAt) status = "dismissed";
      else if (ack?.seenAt) status = "seen";

      const roleNames = (rolesByUser.get(userId) ?? [])
        .map((id) => roleNameById.get(id))
        .filter(Boolean) as string[];

      return {
        userId,
        username: user.username,
        displayName: `${user.first_name} ${user.last_name}`.trim() || user.username,
        roleNames,
        status,
        seenAt: ack?.seenAt ?? null,
        acknowledgedAt: ack?.acknowledgedAt ?? null,
      };
    })
    .filter(Boolean) as AdminMessageRecipientRow[];
}

export function composeToRecord(
  payload: AdminMessageComposePayload,
  ctx: { id: string; senderUserId: string; senderName: string; actorName: string; now: string }
): AdminMessageRecord {
  const publishAtRaw = payload.publishAt?.trim();
  let publishAt = publishAtRaw ? new Date(publishAtRaw) : new Date(ctx.now);
  if (Number.isNaN(publishAt.getTime()) || publishAt < new Date(ctx.now)) {
    publishAt = new Date(ctx.now);
  }

  let status: AdminMessageStatus = "active";
  if (publishAt > new Date(ctx.now)) status = "scheduled";

  const displayMethod: AdminMessageDisplayMethod =
    payload.requiresAcknowledgment ? (payload.displayMethod === "banner" ? "banner" : "modal") : "banner";

  return normalizeAdminMessage({
    id: ctx.id,
    title: payload.title,
    body: payload.body,
    senderUserId: ctx.senderUserId,
    senderName: ctx.senderName,
    audienceType: payload.audienceType,
    audienceRoleIds: payload.audienceRoleIds,
    requiresAcknowledgment: payload.requiresAcknowledgment,
    displayMethod,
    publishAt: publishAt.toISOString(),
    expiresAt: payload.expiresAt?.trim() ? payload.expiresAt : null,
    recurrence: payload.recurrence,
    status,
    createdAt: ctx.now,
    updatedAt: ctx.now,
    createdBy: ctx.actorName,
    updatedBy: ctx.actorName,
  });
}

export function validateComposePayload(payload: AdminMessageComposePayload): string | null {
  if (!payload.title?.trim()) return "Title is required.";
  if (!payload.body?.trim()) return "Message body is required.";
  if (payload.audienceType === "roles" && !payload.audienceRoleIds.length) {
    return "Select at least one role for the audience.";
  }
  return null;
}

export function acknowledgmentCsvRows(register: AdminMessageRecipientRow[]): string[][] {
  return [
    ["User", "Username", "Roles", "Status", "Seen at", "Acknowledged at"],
    ...register.map((r) => [
      r.displayName,
      r.username,
      r.roleNames.join("; "),
      r.status,
      r.seenAt ?? "",
      r.acknowledgedAt ?? "",
    ]),
  ];
}

export function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
}
