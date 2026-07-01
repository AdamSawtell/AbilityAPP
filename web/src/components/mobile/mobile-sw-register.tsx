"use client";

import { useEffect } from "react";

export function MobileSwRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // SW registration can fail on insecure origins or during dev — non-fatal.
    });
  }, []);
  return null;
}
