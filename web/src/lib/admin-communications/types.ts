export type AdminMessageAudienceType = "all" | "roles";

export type AdminMessageDisplayMethod = "modal" | "banner";

export type AdminMessageStatus = "scheduled" | "active" | "closed" | "expired";

export type AdminMessageRecurrenceType = "none" | "keep_open" | "weekly";

export type AdminMessageRecurrenceConfig = {
  type: AdminMessageRecurrenceType;
  /** 0 = Sunday … 6 = Saturday (for weekly) */
  weekday?: number;
  /** HH:mm in org local time (for weekly) */
  time?: string;
};

export type AdminMessageRecord = {
  id: string;
  title: string;
  body: string;
  senderUserId: string;
  senderName: string;
  audienceType: AdminMessageAudienceType;
  audienceRoleIds: string[];
  requiresAcknowledgment: boolean;
  displayMethod: AdminMessageDisplayMethod;
  publishAt: string;
  expiresAt: string | null;
  recurrence: AdminMessageRecurrenceConfig;
  status: AdminMessageStatus;
  closedAt: string | null;
  closedBy: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type AdminMessageAcknowledgmentRecord = {
  id: string;
  messageId: string;
  userId: string;
  recurrencePeriod: string;
  seenAt: string | null;
  acknowledgedAt: string | null;
  bannerDismissedAt: string | null;
  createdAt: string;
};

export type AdminMessageSummary = AdminMessageRecord & {
  recipientCount: number;
  seenCount: number;
  acknowledgedCount: number;
  pendingCount: number;
};

export type AdminMessageRecipientStatus = "not_seen" | "seen" | "acknowledged" | "dismissed";

export type AdminMessageRecipientRow = {
  userId: string;
  username: string;
  displayName: string;
  roleNames: string[];
  status: AdminMessageRecipientStatus;
  seenAt: string | null;
  acknowledgedAt: string | null;
};

export type PendingAdminMessage = {
  id: string;
  title: string;
  body: string;
  senderName: string;
  publishAt: string;
  requiresAcknowledgment: boolean;
  displayMethod: AdminMessageDisplayMethod;
  recurrencePeriod: string;
};

export type AdminMessageComposePayload = {
  title: string;
  body: string;
  audienceType: AdminMessageAudienceType;
  audienceRoleIds: string[];
  requiresAcknowledgment: boolean;
  displayMethod: AdminMessageDisplayMethod;
  publishAt: string | null;
  expiresAt: string | null;
  recurrence: AdminMessageRecurrenceConfig;
  publishNow?: boolean;
};

export function newAdminMessageId() {
  return `msg-${Date.now()}`;
}

export function defaultRecurrence(): AdminMessageRecurrenceConfig {
  return { type: "none" };
}

export function normalizeRecurrence(raw: unknown): AdminMessageRecurrenceConfig {
  if (!raw || typeof raw !== "object") return defaultRecurrence();
  const o = raw as Record<string, unknown>;
  const type = o.type;
  if (type === "keep_open" || type === "weekly") {
    return {
      type,
      weekday: typeof o.weekday === "number" ? o.weekday : 1,
      time: typeof o.time === "string" ? o.time : "09:00",
    };
  }
  return { type: "none" };
}

export function normalizeAdminMessage(partial: Partial<AdminMessageRecord> & Pick<AdminMessageRecord, "id">): AdminMessageRecord {
  const now = new Date().toISOString();
  return {
    id: partial.id,
    title: partial.title?.trim() ?? "",
    body: partial.body ?? "",
    senderUserId: partial.senderUserId ?? "",
    senderName: partial.senderName ?? "",
    audienceType: partial.audienceType === "roles" ? "roles" : "all",
    audienceRoleIds: [...(partial.audienceRoleIds ?? [])],
    requiresAcknowledgment: partial.requiresAcknowledgment ?? true,
    displayMethod: partial.displayMethod === "banner" ? "banner" : "modal",
    publishAt: partial.publishAt ?? now,
    expiresAt: partial.expiresAt ?? null,
    recurrence: normalizeRecurrence(partial.recurrence),
    status: partial.status ?? "active",
    closedAt: partial.closedAt ?? null,
    closedBy: partial.closedBy ?? "",
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    createdBy: partial.createdBy ?? "",
    updatedBy: partial.updatedBy ?? "",
  };
}
