import type { ShiftGeofenceAlert } from "@/lib/shift-geofence";

export function ShiftGeofenceAlerts({
  alerts,
  compact = false,
}: {
  alerts: ShiftGeofenceAlert[];
  compact?: boolean;
}) {
  if (!alerts.length) return null;

  if (compact) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-950">
        Geofence
      </span>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {alerts.map((alert) => (
        <p
          key={alert.event}
          className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950"
        >
          {alert.message}
        </p>
      ))}
    </div>
  );
}
