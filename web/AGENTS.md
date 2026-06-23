<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AbilityVua — agent notes

## Start here (required)

1. [../dev-core/AGENT-PLAYBOOK.md](../dev-core/AGENT-PLAYBOOK.md) — entry point for all tasks
2. [../docs/BUILD-EXPECTATIONS.md](../docs/BUILD-EXPECTATIONS.md) — build standards
3. [../docs/SCOPE-ROADMAP.md](../docs/SCOPE-ROADMAP.md) — phased backlog (scope Chunks 0–8)

## Database (required)

**Every feature from here needs a DB update.** Read [../docs/DATABASE-CHANGES.md](../docs/DATABASE-CHANGES.md) before adding fields, entities, or tabs.

## Core processes

Documented in [../docs/processes/README.md](../docs/processes/README.md).  
Index: [../docs/processes/processes.json](../docs/processes/processes.json).

When you add or change a business process (workflow, conversion, approval, etc.):

1. Add or update a numbered file in `docs/processes/`.
2. Update the table in `docs/processes/README.md` and `docs/processes/processes.json`.

**Process 1 (live):** Enquiry → Client (`enquiry-to-client`).

- Migrations: `supabase/migrations/`
- App data layer: `web/src/lib/supabase/` (`mappers.ts`, `data-api.ts`)
- UI state: `web/src/lib/data-store.tsx` (loads/saves via Supabase when env vars are set)

## Stack

- Next.js 16 App Router, TypeScript, Tailwind — `web/`
- Supabase Postgres — project `yonkaaylolrdsjfgpvyp`
- Hosted on AWS Amplify (app root `web`)

## Verify

```powershell
cd web
npm run build
npm run lint
```

## System navigation (required)

The System area (`/system`) sidebar must mirror the workspace main menu. When you add a new **main menu section** in `web/src/components/sidebar-nav.tsx`, add a matching section in `web/src/lib/system/nav.ts` (`SYSTEM_NAV_SECTIONS`) with the same label, order, icon, and expandable format. Use empty `links` until setup pages exist.

Every section's submenu must end with **Reference data** via `withReferenceData()` in `nav.ts`.
Assign each new list in `web/src/lib/system/reference-data-sections.ts`. Shared lists (gender, yes/no, address, etc.) belong under **Admin**.

System UI uses the same light theme as `AppShell` — not a separate dark mode.

## Window surfaces (required)

Every registered window in `web/src/lib/access/catalog.ts` lives on **one surface only**:

| Surface | Where it appears | Access |
|--------|------------------|--------|
| `app` (default) | Workspace sidebar and record tabs | Role window keys in `app_role_window` |
| `system` | System nav (`web/src/lib/system/nav.ts`) only | Any signed-in **System operator** — no role grant |

**Rules when adding or moving a window**

1. Set `surface: "system"` when the route is under `/system/` and it is operator setup (roles, task management, organisation structure, Reports Advance, etc.).
2. Do **not** list System-surface windows in the workspace Admin sidebar (`sidebar-nav.tsx` filters them out).
3. Do **not** include System-surface keys in role seeds, `seed-access.sql`, or the Roles admin checkbox list.
4. Gate System pages with `useAdminPageAccess(variant)` (client) or `readSystemSessionFromCookies()` (API) — not `canWindow()` for System-surface keys.
5. Add matching links only in `SYSTEM_NAV_SECTIONS` — never duplicate the same window in both navs.

Helper exports: `APP_WINDOW_KEYS`, `isSystemSurfaceWindow()`, `sanitizeAppWindowKeys()`, `appRoleWindows()`.

## In-app help (required for new UI)

Every window, function, and process needs a how-to guide. User-facing content lives in `web/src/lib/help/articles/`. Update it when you add windows, tabs, reports, or workflows.

1. Add or extend an article with stable `id`, `slug`, `keywords`, `relatedRoutes`, and `windowKeys`.
2. Register the article in `web/src/lib/help/articles/index.ts` (workspace) or `system-setup.ts` / `module-setup-guides.ts` (System setup).
3. Map every `AppShell` / `SystemShell` route in `web/src/lib/help/page-guides.ts` so the footer links to the direct guide.
4. The workspace index is `/help`; System setup guides are at `/system/guides`. The footer component (`how-to-guide-footer.tsx`) resolves the link from the current pathname.
5. The retrieval API is `GET /api/help` (manifest, `?slug=`, `?q=` with `format=chunks` for AI).

Run `npm run page-guides:check` after adding routes to confirm coverage.
