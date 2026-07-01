# Mobile PWA — iOS limitations (CFO C-04)

AbilityVua’s employee worker app is a **Progressive Web App (PWA)**. On iPhone and iPad, behaviour differs from Android and from a native App Store app.

## Install required for reliable push

Apple supports web push for PWAs added to the **home screen** (iOS 16.4+). Push is **not** reliable in a normal Safari tab.

Workers should use **More → Install on iPhone** and follow **Add to Home Screen**, then open the app from the icon before enabling notifications.

## Background and offline

| Capability | iOS PWA | Notes |
|------------|---------|--------|
| Offline check-in queue | Supported | Syncs when the app regains network |
| Background sync | Limited | iOS may suspend the service worker; user should open the app to flush the queue |
| Geolocation offline cache | Supported | Up to 30 minutes old when offline |
| Push when app closed | Partial | Depends on iOS power settings and home-screen install |

## Location

GPS is requested **only** at check-in and check-out, not continuously. iOS may show a one-time or per-use permission prompt.

## What we do not promise on iOS

- Continuous background GPS tracking
- Guaranteed instant push delivery when the device is in low-power mode
- Full parity with a native App Store app (biometrics, deep OS integrations)

## Operations

- Configure VAPID keys in Amplify (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- Scheduled push runs with workforce automations (`POST /api/workforce/automation/scheduled`).
- Reconciliation: `/system/reports/mobile-sync` for offline check-in audit.

**Last updated:** 2026-07-01
