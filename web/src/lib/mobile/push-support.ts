"use client";

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** True when opened as an installed PWA (home screen), not a Safari tab. */
export function isStandaloneMobileApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function pushSupportHint(): string | null {
  if (!("serviceWorker" in navigator)) {
    return "This browser does not support My Workplace as an installed app.";
  }
  if (!("PushManager" in window)) {
    if (isIosDevice() && !isStandaloneMobileApp()) {
      return "On iPhone, push only works from the home-screen app. Use More → Install on iPhone, open from the icon, then try again.";
    }
    if (isIosDevice()) {
      return "Push needs iOS 16.4 or later on an installed home-screen app.";
    }
    return "Push notifications are not supported in this browser.";
  }
  if (isIosDevice() && !isStandaloneMobileApp()) {
    return "You are in Safari. For push on iPhone, open AbilityVua from your home-screen icon after installing.";
  }
  return null;
}
