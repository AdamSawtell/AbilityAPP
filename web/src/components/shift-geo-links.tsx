import {
  formatGeoLabel,
  googleMapsUrl,
  hasCheckInGeo,
  hasCheckOutGeo,
} from "@/lib/geolocation";

type ShiftGeoFields = {
  checkInLatitude?: string;
  checkInLongitude?: string;
  checkOutLatitude?: string;
  checkOutLongitude?: string;
};

export function ShiftGeoLinks({ shift, compact = false }: { shift: ShiftGeoFields; compact?: boolean }) {
  const inGeo = hasCheckInGeo(shift);
  const outGeo = hasCheckOutGeo(shift);
  if (!inGeo && !outGeo) return null;

  if (compact) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-950">
        GPS
      </span>
    );
  }

  return (
    <div className="mt-2 space-y-1 text-xs text-slate-600">
      {inGeo ? (
        <p>
          Check-in location:{" "}
          <a
            href={googleMapsUrl(shift.checkInLatitude!, shift.checkInLongitude!)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#b51266] hover:underline"
          >
            {formatGeoLabel(shift.checkInLatitude!, shift.checkInLongitude!)}
          </a>
        </p>
      ) : null}
      {outGeo ? (
        <p>
          Check-out location:{" "}
          <a
            href={googleMapsUrl(shift.checkOutLatitude!, shift.checkOutLongitude!)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#b51266] hover:underline"
          >
            {formatGeoLabel(shift.checkOutLatitude!, shift.checkOutLongitude!)}
          </a>
        </p>
      ) : null}
    </div>
  );
}
