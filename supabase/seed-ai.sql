-- AI agents, capabilities, and role assignments
-- Re-run after migration: npx supabase db query --linked -f supabase/seed-ai.sql

insert into public.app_ai_agent (id, agent_key, name, description, system_prompt, model, active)
values
  (
    'agent-training',
    'training',
    'Training assistant',
    'Answers how-to questions using the in-app guide.',
    'You are the AbilityAPP training assistant. Help users learn the system using the how-to guide. Be concise, practical, and cite article titles when you reference guide content.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-workspace',
    'workspace',
    'Workspace assistant',
    'Search activities, clients, tasks, and recently updated records.',
    'You are the AbilityAPP workspace assistant. Use tools to search before answering. Summarise results with record names, dates, and href links.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-tasks',
    'tasks',
    'Task assistant',
    'Create and update tasks through conversation.',
    'You are the AbilityAPP task assistant. Create tasks with fewest questions. Use task_search before guessing. task_draft_create/confirm to create; task_update_draft_create/confirm to complete, reassign, add notes, or change status. Confirm before saving.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-clients',
    'clients',
    'Client assistant',
    'Create, update, and search clients; log activity.',
    'You are the AbilityAPP client assistant. Use tools before answering. Create with client_draft_*; update fields with client_patch_*; log notes with client_activity_*; search with client_get, client_search, client_list_recent.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-enquiries',
    'enquiries',
    'Enquiry assistant',
    'Create enquiries, search intake, convert to clients.',
    'You are the AbilityAPP enquiry assistant. enquiry_draft_* to create; enquiry_convert_* to convert to client; enquiry_search and enquiry_get to look up records. Confirm before saving.',
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

delete from public.app_ai_agent_capability
where agent_id in ('agent-training', 'agent-workspace', 'agent-tasks', 'agent-clients', 'agent-enquiries');

insert into public.app_ai_agent_capability (agent_id, capability_type, capability_key)
values
  ('agent-training', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'activity_search'),
  ('agent-workspace', 'tool', 'client_search'),
  ('agent-workspace', 'tool', 'records_updated_since'),
  ('agent-workspace', 'tool', 'task_search'),
  ('agent-tasks', 'tool', 'help_search'),
  ('agent-tasks', 'tool', 'task_draft_create'),
  ('agent-tasks', 'tool', 'task_draft_confirm'),
  ('agent-tasks', 'tool', 'task_search'),
  ('agent-tasks', 'tool', 'task_update_draft_create'),
  ('agent-tasks', 'tool', 'task_update_draft_confirm'),
  ('agent-clients', 'tool', 'help_search'),
  ('agent-clients', 'tool', 'client_search'),
  ('agent-clients', 'tool', 'client_get'),
  ('agent-clients', 'tool', 'client_list_recent'),
  ('agent-clients', 'tool', 'activity_search'),
  ('agent-clients', 'tool', 'records_updated_since'),
  ('agent-clients', 'tool', 'client_draft_create'),
  ('agent-clients', 'tool', 'client_draft_confirm'),
  ('agent-clients', 'tool', 'client_patch_draft_create'),
  ('agent-clients', 'tool', 'client_patch_draft_confirm'),
  ('agent-clients', 'tool', 'client_activity_draft_create'),
  ('agent-clients', 'tool', 'client_activity_draft_confirm'),
  ('agent-enquiries', 'tool', 'help_search'),
  ('agent-enquiries', 'tool', 'enquiry_search'),
  ('agent-enquiries', 'tool', 'enquiry_get'),
  ('agent-enquiries', 'tool', 'enquiry_draft_create'),
  ('agent-enquiries', 'tool', 'enquiry_draft_confirm'),
  ('agent-enquiries', 'tool', 'enquiry_convert_draft_create'),
  ('agent-enquiries', 'tool', 'enquiry_convert_draft_confirm'),
  ('agent-enquiries', 'tool', 'activity_search')
on conflict do nothing;

delete from public.app_role_agent where role_id in ('role-admin', 'role-intake', 'role-coordinator');
insert into public.app_role_agent (role_id, agent_id)
values
  ('role-admin', 'agent-training'),
  ('role-admin', 'agent-workspace'),
  ('role-admin', 'agent-tasks'),
  ('role-admin', 'agent-clients'),
  ('role-admin', 'agent-enquiries'),
  ('role-intake', 'agent-training'),
  ('role-intake', 'agent-workspace'),
  ('role-intake', 'agent-clients'),
  ('role-intake', 'agent-enquiries'),
  ('role-coordinator', 'agent-training'),
  ('role-coordinator', 'agent-workspace'),
  ('role-coordinator', 'agent-clients')
on conflict do nothing;
