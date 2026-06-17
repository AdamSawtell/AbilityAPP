"use client";

import { SystemAuthGate, SystemAuthProvider } from "@/lib/system-auth-store";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <SystemAuthProvider>
      <SystemAuthGate>{children}</SystemAuthGate>
    </SystemAuthProvider>
  );
}
