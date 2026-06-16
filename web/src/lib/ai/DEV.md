# AI assistants — local development

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

Click **Save assistant** after edits. Use **Restore defaults** to reload the built-in Training, Workspace, and Task assistants.

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

## Adding a new tool

1. Implement the tool under `web/src/lib/ai/tools/`.
2. Register it in `web/src/lib/ai/tools/registry.ts`.
3. Add a row to `web/src/lib/ai/catalog.ts` (shows in admin UI).
4. Enable the tool on the relevant assistant in **AI assistants** admin.
