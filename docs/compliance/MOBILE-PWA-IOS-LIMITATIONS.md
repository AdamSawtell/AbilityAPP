# Mobile PWA — iOS limitations (CFO C-04)

AbilityVua **My Workplace** mobile app is a **Progressive Web App (PWA)**. On iPhone and iPad, behaviour differs from Android and from a native App Store app.

## Cache after deploy

iOS home-screen PWAs can keep an old **service worker** or page snapshot longer than Safari tabs.

If My Workplace looks outdated after a release:

1. Force-quit the home-screen app (swipe it away).
2. Open `https://app.abilityvua.com/m/more` once in **Safari** (not the icon).
3. If still stale: **Settings → Safari → Advanced → Website Data** → remove `abilityvua.com`, then re-add to home screen.

Deploys bump the service worker cache name so new installs pick up fresh assets automatically.

**Login stuck on desktop:** Older builds redirected `/m/*` to the staff desktop login. After deploy, open `/m/today` in Safari once so the scoped service worker (`/m/` only) replaces any root-scope worker, then re-open from the home-screen icon.

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
- Full parity with a native App Store app (some deep OS integrations)
- **Face ID / Touch ID** works via passkeys when the app is installed to the home screen (iOS 16+). It may not work in a normal Safari tab.

## Operations

- Configure VAPID keys in Amplify (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- Scheduled push runs with workforce automations (`POST /api/workforce/automation/scheduled`).
- Reconciliation: `/system/reports/mobile-sync` for offline check-in audit.

**Last updated:** 2026-07-01
