import { AppShell } from "@/components/app-shell";
import { ServiceBookingListView } from "@/components/service-booking-pages";

export default function ServiceBookingsPage() {
  return (
    <AppShell
      title="Service bookings"
      subtitle="Schedule and track NDIS service delivery sessions linked to clients, agreements, and staff."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Service bookings" }]}
      audit={{ moduleLabel: "Service bookings" }}
    >
      <ServiceBookingListView />
    </AppShell>
  );
}
