-- Document platform — participant support plan printable

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values
  (
    'dsupport-plan-v1',
    'Participant support plan',
    'Printable NDIS support plan combining profile, plan tabs, goals, risks, and service schedule.',
    'support-plan',
    true,
    true,
    'Participant support plan',
    '',
    'SuperUser',
    'SuperUser'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  document_class = excluded.document_class,
  active = excluded.active,
  is_default = excluded.is_default,
  title_text = excluded.title_text;

insert into public.app_document_template_block (id, template_id, block_type, label, content_html, sort_order, locked)
values
  ('dtblk-sp-header', 'dsupport-plan-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-sp-title', 'dsupport-plan-v1', 'title', 'Document title', 'Participant support plan', 2, false),
  ('dtblk-sp-parties', 'dsupport-plan-v1', 'parties', 'Participant', '', 3, false),
  ('dtblk-sp-body', 'dsupport-plan-v1', 'rich-text', 'Support plan sections', '', 4, true),
  ('dtblk-sp-footer', 'dsupport-plan-v1', 'org-footer', 'Organisation footer', '', 5, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-support-plan', 'print-support-plan', 'client', 'dsupport-plan-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, 'print-support-plan'
from (values
  ('role-admin'),
  ('role-coordinator'),
  ('role-intake'),
  ('role-quality-manager'),
  ('role-quality-officer'),
  ('role-team-leader')
) as r(role_id)
on conflict (role_id, process_id) do nothing;
