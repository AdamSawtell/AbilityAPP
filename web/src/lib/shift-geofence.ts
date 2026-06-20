import { normalizeGeoInput, type GeoCoordinates } from "@/lib/geolocation";
import type { LocationRecord } from "@/lib/location";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export const DEFAULT_GEOFENCE_RADIUS_M = 150;

export type ShiftGeofenceEvent = "check-in" | "check-out";

export type ShiftGeofenceAlert = {
  event: ShiftGeofenceEvent;
  distanceMeters: number;
  radiusMeters: number;
  message: string;
};

export type LocationGeofenceFields = Pick<
  LocationRecord,
  "latitude" | "longitude" | "geofenceRadiusM" | "name"
>;

export function locationGeofenceRadiusM(location: Pick<LocationRecord, "geofenceRadiusM">): number {
  const n = Number(location.geofenceRadiusM);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_GEOFENCE_RADIUS_M;
  return Math.round(n);
}

export function locationGeofenceCenter(
  location: Pick<LocationRecord, "latitude" | "longitude">
): GeoCoordinates | null {
  return normalizeGeoInput(location.latitude, location.longitude);
}

export function hasLocationGeofence(
  location?: Pick<LocationRecord, "latitude" | "longitude"> | null
): boolean {
  return Boolean(location && locationGeofenceCenter(location));
}

/** Haversine distance in metres between two lat/lng points. */
export function haversineDistanceMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  const earthRadiusM = 6371000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * earthRadiusM * Math.asin(Math.sqrt(h)));
}

function geofenceAlert(
  event: ShiftGeofenceEvent,
  distanceMeters: number,
  radiusMeters: number,
  locationName: string
): ShiftGeofenceAlert {
  const label = event === "check-in" ? "Check-in" : "Check-out";
  return {
    event,
    distanceMeters,
    radiusMeters,
    message: `${label} was ${distanceMeters} m from ${locationName} (allowed ${radiusMeters} m). Review on site.`,
  };
}

export function shiftGeofenceAlerts(
  shift: Pick<
    RosterShiftRecord,
    "checkInLatitude" | "checkInLongitude" | "checkOutLatitude" | "checkOutLongitude"
  >,
  location?: LocationGeofenceFields | null
): ShiftGeofenceAlert[] {
  if (!location) return [];
  const center = locationGeofenceCenter(location);
  if (!center) return [];
  const radius = locationGeofenceRadiusM(location);
  const name = location.name?.trim() || "site";
  const alerts: ShiftGeofenceAlert[] = [];

  const checkIn = normalizeGeoInput(shift.checkInLatitude, shift.checkInLongitude);
  if (checkIn) {
    const distance = haversineDistanceMeters(checkIn, center);
    if (distance > radius) alerts.push(geofenceAlert("check-in", distance, radius, name));
  }

  const checkOut = normalizeGeoInput(shift.checkOutLatitude, shift.checkOutLongitude);
  if (checkOut) {
    const distance = haversineDistanceMeters(checkOut, center);
    if (distance > radius) alerts.push(geofenceAlert("check-out", distance, radius, name));
  }

  return alerts;
}

export function shiftHasGeofenceAlert(
  shift: Pick<
    RosterShiftRecord,
    "checkInLatitude" | "checkInLongitude" | "checkOutLatitude" | "checkOutLongitude"
  >,
  location?: LocationGeofenceFields | null
): boolean {
  return shiftGeofenceAlerts(shift, location).length > 0;
}

export function geofenceWarningSummary(alerts: ShiftGeofenceAlert[]): string | null {
  if (!alerts.length) return null;
  const first = alerts[0].message;
  const extra = alerts.length > 1 ? ` (+${alerts.length - 1} more)` : "";
  return `${first}${extra}`;
}
