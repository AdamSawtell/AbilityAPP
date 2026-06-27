"use client";

import { AppShell } from "@/components/app-shell";
import { PayPeriodAdminPanel } from "@/components/pay-period-admin-panel";

export default function PayPeriodsAdminPage() {
  return (
    <AppShell title="Pay periods" audit={{ moduleLabel: "Pay periods" }}>
      <PayPeriodAdminPanel />
    </AppShell>
  );
}
