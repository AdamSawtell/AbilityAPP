"use client";

import { useEffect } from "react";

import { MOBILE_SW_SCOPE } from "@/lib/mobile/login-redirect";

export function MobileSwRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        const scopePath = new URL(reg.scope).pathname;
        if (scopePath === "/" || scopePath === "") {
          void reg.unregister();
        }
      }
    });
    void navigator.serviceWorker.register("/sw.js", { scope: MOBILE_SW_SCOPE }).catch(() => {
      // SW registration can fail on insecure origins or during dev — non-fatal.
    });
  }, []);
  return null;
}
