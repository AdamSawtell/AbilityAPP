export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export function isValidGeoCoordinates(coords: GeoCoordinates): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

export function normalizeGeoInput(lat?: unknown, lng?: unknown): GeoCoordinates | null {
  if (lat == null || lng == null || lat === "" || lng === "") return null;
  const latitude = Number(lat);
  const longitude = Number(lng);
  const coords = { latitude, longitude };
  return isValidGeoCoordinates(coords) ? coords : null;
}

export function geoToStrings(coords: GeoCoordinates | null): { latitude: string; longitude: string } {
  if (!coords) return { latitude: "", longitude: "" };
  return {
    latitude: coords.latitude.toFixed(6),
    longitude: coords.longitude.toFixed(6),
  };
}

export function geoToDbNumber(value: string): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function hasCheckInGeo(shift: {
  checkInLatitude?: string;
  checkInLongitude?: string;
}): boolean {
  return Boolean(shift.checkInLatitude?.trim() && shift.checkInLongitude?.trim());
}

export function hasCheckOutGeo(shift: {
  checkOutLatitude?: string;
  checkOutLongitude?: string;
}): boolean {
  return Boolean(shift.checkOutLatitude?.trim() && shift.checkOutLongitude?.trim());
}

export function hasShiftGeo(shift: {
  checkInLatitude?: string;
  checkInLongitude?: string;
  checkOutLatitude?: string;
  checkOutLongitude?: string;
}): boolean {
  return hasCheckInGeo(shift) || hasCheckOutGeo(shift);
}

export function formatGeoLabel(latitude: string, longitude: string): string {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "—";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function googleMapsUrl(latitude: string, longitude: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

/** Browser geolocation — returns null when unavailable or denied (check-in still proceeds). */
export function captureGeolocation(timeoutMs = 12000): Promise<GeoCoordinates | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        resolve(isValidGeoCoordinates(coords) ? coords : null);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: timeoutMs }
    );
  });
}
