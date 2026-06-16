-- AI agents, capabilities, and role assignments
-- Re-run after migration: npx supabase db query --linked -f supabase/seed-ai.sql

insert into public.app_ai_agent (id, agent_key, name, description, system_prompt, model, active)
values
  (
    'agent-training',
    'training',
    'Training assistant',
    'Answers how-to questions using the in-app guide.',
    'You are the AbilityAPP training assistant. Help users learn the system using the how-to guide. Be concise, practical, and cite article titles when you reference guide content. If you are unsure, say so and suggest where to look in the app. Do not invent features that are not in the guide.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-workspace',
    'workspace',
    'Workspace assistant',
    'Search activities, clients, and recently updated records.',
    'You are the AbilityAPP workspace assistant. Help users find activities, clients, and records updated recently. Use tools to search before answering. Summarise results clearly with record names and dates. Respect what the user can access — never expose data from tools that returned no results due to permissions.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-tasks',
    'tasks',
    'Task assistant',
    'Draft tasks through conversation (confirmation required before creating).',
    'You are the AbilityAPP task assistant. Create tasks with the fewest questions possible. Ask ONE question at a time — never list multiple questions in one message. Step 1: title. Step 2: assignment — user or role, and who. Step 3: summarise and ask to confirm; description only if the user offers it. Do not ask about due date, priority, task type, or linked records unless the user mentions them. Defaults: tt-other, Normal priority, no due date. When you have title and assignment, call task_draft_create, show a one-line summary, and ask whether to create. Only call task_draft_confirm after a clear yes.',
    'gpt-4o-mini',
    true
  )
on conflict (id) do update set
  agent_key = excluded.agent_key,
  name = excluded.name,
  description = excluded.description,
  system_prompt = excluded.system_prompt,
  model = excluded.model,
  active = excluded.active;

delete from public.app_ai_agent_capability where agent_id in ('agent-training', 'agent-workspace', 'agent-tasks');
insert into public.app_ai_agent_capability (agent_id, capability_type, capability_key)
values
  ('agent-training', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'activity_search'),
  ('agent-workspace', 'tool', 'client_search'),
  ('agent-workspace', 'tool', 'records_updated_since'),
  ('agent-tasks', 'tool', 'help_search'),
  ('agent-tasks', 'tool', 'task_draft_create'),
  ('agent-tasks', 'tool', 'task_draft_confirm')
on conflict do nothing;

delete from public.app_role_agent where role_id in ('role-admin', 'role-intake', 'role-coordinator');
insert into public.app_role_agent (role_id, agent_id)
values
  ('role-admin', 'agent-training'),
  ('role-admin', 'agent-workspace'),
  ('role-admin', 'agent-tasks'),
  ('role-intake', 'agent-training'),
  ('role-intake', 'agent-workspace'),
  ('role-coordinator', 'agent-training'),
  ('role-coordinator', 'agent-workspace')
on conflict do nothing;
