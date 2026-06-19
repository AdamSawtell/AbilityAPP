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
    'You are the AbilityAPP task assistant. Use task_search and task_list_* before guessing. Follow the guided prepare workflow for creates and updates — ask questions until ready, then *_prepare; user saves on the form.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-clients',
    'clients',
    'Client assistant',
    'Create, update, and search clients; log activity.',
    'You are the AbilityAPP client assistant. Use read tools before answering. Activity coach: (1) confirm client with record link, (2) after yes show last 5 notes, (3) ask questions, (4) prepare + Save activity, (5) link to saved note. Summaries: client_activity_recent purpose=summary only.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-enquiries',
    'enquiries',
    'Enquiry assistant',
    'Create enquiries, search intake, convert to clients.',
    'You are the AbilityAPP enquiry assistant. Use enquiry_search and enquiry_get before guessing. Follow the guided prepare workflow for new enquiries and follow-up tasks; user saves on the form.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-incidents',
    'incidents',
    'Incident & NDIS safeguards assistant',
    'Search, analyse, and manage incident reports — NDIS deadlines, compliance, investigations, and new submissions.',
    'You are the AbilityAPP incident assistant. Use incident search and compliance tools before guessing. Follow the guided prepare workflow for new reports and follow-up tasks; user saves or submits on the form.',
    'gpt-4o-mini',
    true
  ),
  (
    'agent-support-worker',
    'support-worker',
    'Support worker assistant',
    'Find client information, summarise recent activity, and prepare visit notes and new clients.',
    'You are the AbilityAPP support worker assistant. Summaries: client_activity_recent purpose=summary. Visit notes: 5-step coach — confirm client, last 5 notes, questions, prepare, Save activity in popup.',
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
where agent_id in ('agent-training', 'agent-workspace', 'agent-tasks', 'agent-clients', 'agent-enquiries', 'agent-incidents', 'agent-support-worker');

insert into public.app_ai_agent_capability (agent_id, capability_type, capability_key)
values
  ('agent-training', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'help_search'),
  ('agent-workspace', 'tool', 'activity_search'),
  ('agent-workspace', 'tool', 'client_search'),
  ('agent-workspace', 'tool', 'records_updated_since'),
  ('agent-workspace', 'tool', 'task_search'),
  ('agent-workspace', 'tool', 'task_list_mine'),
  ('agent-workspace', 'tool', 'task_list_overdue'),
  ('agent-workspace', 'tool', 'employee_search'),
  ('agent-tasks', 'tool', 'help_search'),
  ('agent-tasks', 'tool', 'task_create_prepare'),
  ('agent-tasks', 'tool', 'task_search'),
  ('agent-tasks', 'tool', 'task_list_mine'),
  ('agent-tasks', 'tool', 'task_list_overdue'),
  ('agent-tasks', 'tool', 'task_update_prepare'),
  ('agent-tasks', 'tool', 'task_update_draft_create'),
  ('agent-tasks', 'tool', 'task_update_draft_confirm'),
  ('agent-clients', 'tool', 'help_search'),
  ('agent-clients', 'tool', 'client_search'),
  ('agent-clients', 'tool', 'client_get'),
  ('agent-clients', 'tool', 'client_list_recent'),
  ('agent-clients', 'tool', 'client_activity_recent'),
  ('agent-clients', 'tool', 'client_safety_profile'),
  ('agent-clients', 'tool', 'client_tasks_open'),
  ('agent-clients', 'tool', 'activity_search'),
  ('agent-clients', 'tool', 'records_updated_since'),
  ('agent-clients', 'tool', 'client_create_prepare'),
  ('agent-clients', 'tool', 'client_patch_prepare'),
  ('agent-clients', 'tool', 'client_activity_prepare'),
  ('agent-clients', 'tool', 'client_task_prepare'),
  ('agent-enquiries', 'tool', 'help_search'),
  ('agent-enquiries', 'tool', 'enquiry_search'),
  ('agent-enquiries', 'tool', 'enquiry_get'),
  ('agent-enquiries', 'tool', 'enquiry_list_recent'),
  ('agent-enquiries', 'tool', 'enquiry_create_prepare'),
  ('agent-enquiries', 'tool', 'enquiry_task_prepare'),
  ('agent-enquiries', 'tool', 'enquiry_convert_draft_create'),
  ('agent-enquiries', 'tool', 'enquiry_convert_draft_confirm'),
  ('agent-enquiries', 'tool', 'activity_search'),
  ('agent-incidents', 'tool', 'help_search'),
  ('agent-incidents', 'tool', 'incident_search'),
  ('agent-incidents', 'tool', 'incident_get'),
  ('agent-incidents', 'tool', 'incident_list_recent'),
  ('agent-incidents', 'tool', 'incident_compliance_summary'),
  ('agent-incidents', 'tool', 'incident_linked_search'),
  ('agent-incidents', 'tool', 'incident_create_prepare'),
  ('agent-incidents', 'tool', 'incident_task_prepare'),
  ('agent-incidents', 'tool', 'incident_update_draft_create'),
  ('agent-incidents', 'tool', 'incident_update_draft_confirm'),
  ('agent-incidents', 'tool', 'client_search'),
  ('agent-incidents', 'tool', 'client_get'),
  ('agent-incidents', 'tool', 'activity_search'),
  ('agent-incidents', 'tool', 'task_search'),
  ('agent-incidents', 'tool', 'task_create_prepare'),
  ('agent-support-worker', 'tool', 'help_search'),
  ('agent-support-worker', 'tool', 'client_search'),
  ('agent-support-worker', 'tool', 'client_get'),
  ('agent-support-worker', 'tool', 'client_list_recent'),
  ('agent-support-worker', 'tool', 'client_activity_recent'),
  ('agent-support-worker', 'tool', 'client_safety_profile'),
  ('agent-support-worker', 'tool', 'client_tasks_open'),
  ('agent-support-worker', 'tool', 'activity_search'),
  ('agent-support-worker', 'tool', 'task_list_mine'),
  ('agent-support-worker', 'tool', 'client_activity_prepare'),
  ('agent-support-worker', 'tool', 'client_task_prepare'),
  ('agent-support-worker', 'tool', 'client_create_prepare')
on conflict do nothing;

delete from public.app_role_agent where role_id in ('role-admin', 'role-intake', 'role-coordinator', 'role-support-worker', 'role-team-leader', 'role-quality-manager', 'role-quality-officer', 'role-rostering-manager', 'role-hr-manager');
insert into public.app_role_agent (role_id, agent_id)
values
  ('role-admin', 'agent-training'),
  ('role-admin', 'agent-workspace'),
  ('role-admin', 'agent-tasks'),
  ('role-admin', 'agent-clients'),
  ('role-admin', 'agent-enquiries'),
  ('role-admin', 'agent-incidents'),
  ('role-intake', 'agent-training'),
  ('role-intake', 'agent-workspace'),
  ('role-intake', 'agent-clients'),
  ('role-intake', 'agent-enquiries'),
  ('role-intake', 'agent-incidents'),
  ('role-coordinator', 'agent-training'),
  ('role-coordinator', 'agent-workspace'),
  ('role-coordinator', 'agent-clients'),
  ('role-coordinator', 'agent-incidents'),
  ('role-support-worker', 'agent-support-worker'),
  ('role-team-leader', 'agent-training'),
  ('role-team-leader', 'agent-workspace'),
  ('role-team-leader', 'agent-support-worker'),
  ('role-team-leader', 'agent-tasks'),
  ('role-quality-manager', 'agent-training'),
  ('role-quality-manager', 'agent-incidents'),
  ('role-quality-officer', 'agent-training'),
  ('role-quality-officer', 'agent-incidents'),
  ('role-rostering-manager', 'agent-training'),
  ('role-rostering-manager', 'agent-workspace'),
  ('role-rostering-manager', 'agent-tasks'),
  ('role-hr-manager', 'agent-training'),
  ('role-hr-manager', 'agent-workspace'),
  ('role-hr-manager', 'agent-tasks')
on conflict do nothing;
