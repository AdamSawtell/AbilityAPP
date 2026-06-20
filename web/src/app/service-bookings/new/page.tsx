import { Suspense } from "react";
import { ServiceBookingNewView } from "@/components/service-booking-pages";

function NewServiceBookingFallback() {
  return <p className="p-6 text-sm text-slate-600">Loading new service booking…</p>;
}

export default function NewServiceBookingPage() {
  return (
    <Suspense fallback={<NewServiceBookingFallback />}>
      <ServiceBookingNewView />
    </Suspense>
  );
}
