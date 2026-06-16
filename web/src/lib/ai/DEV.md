# AI assistants — architecture and development

## Setup

1. Copy `web/.env.example` to `web/.env.local` and set:
   - `OPENAI_API_KEY` — your OpenAI key
   - `AUTH_SESSION_SECRET` — any long random string
   - Supabase URL and keys (same as production project is fine)

2. Start the app:

```powershell
cd web
npm run dev
```

3. Open http://localhost:3000 and sign in as **SuperUser** (AbilityAPP Admin role).

## Define assistants and tools

Go to **Admin → AI assistants** (`/admin/ai-agents`):

| Tab | What you can change |
|-----|---------------------|
| **Assistants** | Name, key, model, system prompt, which tools each assistant can call |
| **Role access** | Which app roles see which assistants on Home |

Click **Save assistant** after edits. Use **Restore defaults** to reload built-in assistants.

## Test on Home

1. Sign out and back in if you changed **Role access** (session caches assistant IDs).
2. On Home, open the AI panel → **New chat**.
3. Pick the assistant you edited and send a test message.

## Database

Assistants live in Supabase tables `app_ai_agent`, `app_ai_agent_capability`, and `app_role_agent`.

After pulling new migrations:

```powershell
npx supabase db push
npx supabase db query --linked -f supabase/seed-ai.sql
npx supabase db query --linked -f supabase/seed-access.sql
```

Or use **Restore defaults** in the admin UI to write seed data without SQL.

---

## Architecture — read vs write

### Request path

```
Home chat UI → POST /api/ai/chat → OpenAI (tool loop) → Supabase (service role)
                                      ↓
                              app_ai_chat_log (audit)
```

The API uses the Supabase **service role** key. **Access control is enforced in each tool** via the signed-in user's `windowKeys`, `processKeys`, and `taskTypePermissions` from the session — not via Postgres RLS.

### Read tools (query Supabase)

| Tool | Data |
|------|------|
| `help_search` | In-app guide (no DB) |
| `activity_search` | Activity lines across clients, enquiries, employees, locations |
| `client_search` | Client list by name/key, sortable |
| `client_get` | Full client profile + alerts, consents, risks, locations, activity |
| `client_list_recent` | Clients updated in last N hours |
| `records_updated_since` | Clients, enquiries, employees, locations updated recently |
| `task_search` | Tasks from `app_task` |

### Write tools (draft → confirm → persist)

All writes use a **two-step pattern**: draft tool stores pending state in `threadState`, confirm tool persists after explicit user approval.

| Tool pair | Persists to | Module |
|-----------|-------------|--------|
| `client_draft_create` / `client_draft_confirm` | `client` (+ child tables empty) | `lib/ai/persist.ts` → `saveClient` |
| `client_activity_draft_create` / `client_activity_draft_confirm` | `client_activity` (append only) | `appendClientActivity` |
| `task_draft_create` / `task_draft_confirm` | `app_task` | `persistAiTask` → `saveTask` |

Server-side persistence runs in `runtime.ts` on confirm. The UI also syncs local state (`upsertClient`, `upsertTask`) so lists update without refresh.

### Assistants (defaults)

| Assistant | Read | Write |
|-----------|------|-------|
| Training | Guide only | — |
| Workspace | Activities, clients, records, tasks | — |
| Task | `task_search` | Create task |
| Client | Full client search/Q&A | Create client, log activity |

---

## What to build next (priority)

1. **Client field updates** — `client_patch` tool for status, contact, funding (not full replace).
2. **Enquiry assistant** — create/search enquiries, convert-to-client flow.
3. **Task updates** — complete, reassign, add note via AI.
4. **User-scoped Supabase** — replace service role with a user JWT + RLS policies for defence in depth.
5. **Rich chat UI** — render tool result tables and links inline, not only prose.
6. **Task update history** — `app_task_update` table (updates currently live in memory only).

---

## Adding a new tool

1. Implement the tool under `web/src/lib/ai/tools/`.
2. For writes, add persistence in `web/src/lib/ai/persist.ts` using existing `data-api` functions.
3. Register in `web/src/lib/ai/tools/registry.ts`.
4. Add a row to `web/src/lib/ai/catalog.ts` (shows in admin UI).
5. Wire the tool in `web/src/lib/ai/runtime.ts`.
6. Enable on the relevant assistant in **AI assistants** admin or `seed-ai.sql`.
