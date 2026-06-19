import type { ChatMessage, ChatThreadState } from "@/lib/ai/types";

const CONFIRM_RE =
  /^(yes|yep|yeah|y|save|proceed|confirm|confirmed|go ahead|ok|okay|please do|do it|sure|sounds good|looks good)\W*$/i;

export function isPrepareConfirmMessage(text: string): boolean {
  return CONFIRM_RE.test(text.trim());
}

function titleFromNotes(notes: string): string {
  const cleaned = notes
    .replace(/[,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Activity note";
  const words = cleaned.split(" ").slice(0, 8).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** When the user confirms after giving visit details, build prepare args from the thread. */
export function buildActivityPrepareFromCoachConfirm(
  messages: ChatMessage[],
  threadState: ChatThreadState
): Record<string, unknown> | null {
  const client = threadState.activityCoachClient;
  if (!client) return null;

  const userMsgs = messages.filter((m) => m.role === "user");
  const last = userMsgs[userMsgs.length - 1];
  if (!last || !isPrepareConfirmMessage(last.content)) return null;

  let detailText = "";
  for (let i = userMsgs.length - 2; i >= 0; i--) {
    const text = userMsgs[i].content.trim();
    if (text.length >= 10 && !isPrepareConfirmMessage(text)) {
      detailText = text;
      break;
    }
  }
  if (!detailText) return null;

  return {
    clientId: client.id,
    subject: titleFromNotes(detailText),
    description: detailText,
    activityType: "Visit",
    activityDate: new Date().toISOString().slice(0, 10),
  };
}

/** When the user gives substantive visit notes in one message during coach flow. */
export function buildActivityPrepareFromCoachDetail(
  messages: ChatMessage[],
  threadState: ChatThreadState
): Record<string, unknown> | null {
  const client = threadState.activityCoachClient;
  if (!client) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return null;

  const text = lastUser.content.trim();
  if (text.length < 20 && !/[,;]/.test(text)) return null;
  if (isPrepareConfirmMessage(text)) return null;
  if (/^(create|add|log|write|prepare|help)\b/i.test(text)) return null;

  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  const coachPrompt =
    lastAssistant?.content.includes("activity") ||
    lastAssistant?.content.includes("Subject") ||
    lastAssistant?.content.includes("description") ||
    lastAssistant?.content.includes("developments");

  if (!coachPrompt && messages.filter((m) => m.role === "user").length < 2) return null;

  return {
    clientId: client.id,
    subject: titleFromNotes(text),
    description: text,
    activityType: "Visit",
    activityDate: new Date().toISOString().slice(0, 10),
  };
}
