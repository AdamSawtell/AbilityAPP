export async function savePreparedActivityDraft(draftId: string) {
  const res = await fetch(`/api/ai/drafts/${encodeURIComponent(draftId)}/save`, {
    method: "POST",
    credentials: "include",
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    clientId?: string;
    clientName?: string;
    subject?: string;
    href?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not save activity.");
  }
  return data;
}
