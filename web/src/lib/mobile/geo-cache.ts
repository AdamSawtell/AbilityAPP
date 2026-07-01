import {
  OFFLINE_GEO_MAX_AGE_MS,
  OFFLINE_GEO_MAX_AGE_OFFLINE_MS,
} from "@/lib/mobile/constants";
import { idbGetGeo, idbPutGeo, type GeoCacheEntry } from "@/lib/mobile/idb";
import { captureGeolocation, type GeoCoordinates } from "@/lib/geolocation";

export type MobileGeoResult = {
  coords: GeoCoordinates | null;
  approximate: boolean;
  source: "fresh" | "cache" | "none";
};

async function readCachedGeo(maxAgeMs: number): Promise<MobileGeoResult> {
  try {
    const entry = await idbGetGeo();
    if (!entry) return { coords: null, approximate: false, source: "none" };
    if (Date.now() - entry.capturedAt > maxAgeMs) {
      return { coords: null, approximate: false, source: "none" };
    }
    return {
      coords: { latitude: entry.latitude, longitude: entry.longitude },
      approximate: true,
      source: "cache",
    };
  } catch {
    return { coords: null, approximate: false, source: "none" };
  }
}

async function storeGeo(coords: GeoCoordinates, accuracy?: number): Promise<void> {
  try {
    const entry: GeoCacheEntry = {
      key: "last",
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy,
      capturedAt: Date.now(),
    };
    await idbPutGeo(entry);
  } catch {
    // Non-fatal when quota exceeded.
  }
}

/** Capture GPS for mobile check-in — uses cache when offline or fresh capture fails. */
export async function captureMobileGeolocation(isOffline: boolean): Promise<MobileGeoResult> {
  const maxAge = isOffline ? OFFLINE_GEO_MAX_AGE_OFFLINE_MS : OFFLINE_GEO_MAX_AGE_MS;

  if (!isOffline && typeof navigator !== "undefined" && navigator.onLine) {
    const fresh = await captureGeolocation();
    if (fresh) {
      await storeGeo(fresh);
      return { coords: fresh, approximate: false, source: "fresh" };
    }
  }

  const cached = await readCachedGeo(maxAge);
  if (cached.coords) return cached;

  if (isOffline) return { coords: null, approximate: false, source: "none" };

  const fresh = await captureGeolocation();
  if (fresh) {
    await storeGeo(fresh);
    return { coords: fresh, approximate: false, source: "fresh" };
  }

  return { coords: null, approximate: false, source: "none" };
}
