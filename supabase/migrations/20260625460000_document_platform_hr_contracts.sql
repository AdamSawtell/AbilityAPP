-- Document platform D6 — HR employment contract templates and processes

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values
  (
    'dhr-contract-casual-v1',
    'Casual employment agreement',
    'SCHADS-aware casual employment contract scaffold. Customise clauses before production use.',
    'hr-contract-casual',
    true,
    true,
    'Casual Employment Agreement',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dhr-contract-pt-v1',
    'Part-time employment agreement',
    'SCHADS-aware part-time employment contract scaffold. Customise clauses before production use.',
    'hr-contract-pt',
    true,
    false,
    'Part-time Employment Agreement',
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
  ('dtblk-hr-casual-header', 'dhr-contract-casual-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-hr-casual-title', 'dhr-contract-casual-v1', 'title', 'Document title', 'Casual Employment Agreement', 2, false),
  ('dtblk-hr-casual-parties', 'dhr-contract-casual-v1', 'parties', 'Parties', '', 3, false),
  ('dtblk-hr-casual-meta', 'dhr-contract-casual-v1', 'metadata', 'Employment details', '', 4, false),
  ('dtblk-hr-casual-terms', 'dhr-contract-casual-v1', 'rich-text', 'Terms of employment', '<p>This casual employment agreement is subject to the National Employment Standards and applicable modern award (including SCHADS where relevant). Customise this scaffold with your organisation''s legal terms.</p>', 5, false),
  ('dtblk-hr-casual-signature', 'dhr-contract-casual-v1', 'signature', 'Signatures', '', 6, true),
  ('dtblk-hr-casual-footer', 'dhr-contract-casual-v1', 'org-footer', 'Organisation footer', '', 7, true),
  ('dtblk-hr-pt-header', 'dhr-contract-pt-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-hr-pt-title', 'dhr-contract-pt-v1', 'title', 'Document title', 'Part-time Employment Agreement', 2, false),
  ('dtblk-hr-pt-parties', 'dhr-contract-pt-v1', 'parties', 'Parties', '', 3, false),
  ('dtblk-hr-pt-meta', 'dhr-contract-pt-v1', 'metadata', 'Employment details', '', 4, false),
  ('dtblk-hr-pt-terms', 'dhr-contract-pt-v1', 'rich-text', 'Terms of employment', '<p>This part-time employment agreement sets out ordinary hours, remuneration, and leave entitlements under the National Employment Standards and applicable modern award.</p>', 5, false),
  ('dtblk-hr-pt-signature', 'dhr-contract-pt-v1', 'signature', 'Signatures', '', 6, true),
  ('dtblk-hr-pt-footer', 'dhr-contract-pt-v1', 'org-footer', 'Organisation footer', '', 7, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-employee-contract', 'print-employee-contract', 'employee', 'dhr-contract-casual-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator')) as r(role_id)
cross join (values ('print-employee-contract')) as p(process_id)
on conflict (role_id, process_id) do nothing;
