import { MOBILE_PRIVACY_STORAGE_KEY } from "@/lib/mobile/constants";

export function mobilePrivacyAccepted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MOBILE_PRIVACY_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function acceptMobilePrivacy(): void {
  try {
    localStorage.setItem(MOBILE_PRIVACY_STORAGE_KEY, "1");
  } catch {
    // ignore quota errors
  }
}
