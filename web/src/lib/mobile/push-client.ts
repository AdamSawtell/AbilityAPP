"use client";

export type PushPreferences = {
  notifyShiftChanges: boolean;
  notifyCredentials: boolean;
  subscribed: boolean;
};

export async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetch("/api/mobile/push/vapid-public-key", { credentials: "include" });
  if (!res.ok) return null;
  const body = (await res.json()) as { publicKey?: string };
  return body.publicKey?.trim() || null;
}

export async function fetchPushPreferences(): Promise<PushPreferences | null> {
  const res = await fetch("/api/mobile/push/preferences", { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<PushPreferences>;
}

export async function updatePushPreferences(prefs: {
  notifyShiftChanges?: boolean;
  notifyCredentials?: boolean;
}): Promise<PushPreferences | null> {
  const res = await fetch("/api/mobile/push/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) return null;
  return res.json() as Promise<PushPreferences>;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push is not supported on this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." };
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    return { ok: false, error: "Push is not configured on this server yet." };
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/mobile/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      deviceLabel: navigator.userAgent.slice(0, 120),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error ?? "Could not save subscription." };
  }
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await fetch("/api/mobile/push/subscribe", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return true;
}
