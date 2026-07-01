"use client";

import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobilePushSettings } from "@/components/mobile/mobile-push-settings";

export function MobileNotificationsPage() {
  return (
    <MobileAuthGuard windowKey="my-workplace">
      <MobileEmployeeShell title="Notifications" subtitle="Shift and credential reminders">
        <MobilePushSettings />
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
