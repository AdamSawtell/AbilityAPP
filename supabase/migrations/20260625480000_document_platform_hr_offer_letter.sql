-- Document platform D8 — HR offer of employment letter

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values (
  'dhr-letter-offer-v1',
  'Offer of employment',
  'Letter offering employment before the formal contract is signed. Customise clauses before production use.',
  'hr-letter-offer',
  true,
  true,
  'Offer of Employment',
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
  ('dtblk-hr-offer-header', 'dhr-letter-offer-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-hr-offer-title', 'dhr-letter-offer-v1', 'title', 'Document title', 'Offer of Employment', 2, false),
  ('dtblk-hr-offer-parties', 'dhr-letter-offer-v1', 'parties', 'Recipient', '', 3, false),
  ('dtblk-hr-offer-meta', 'dhr-letter-offer-v1', 'metadata', 'Offer details', '', 4, false),
  ('dtblk-hr-offer-body', 'dhr-letter-offer-v1', 'rich-text', 'Offer terms', '<p>We are pleased to offer you employment with {{org.tradingName}} on the terms outlined below. This offer is subject to satisfactory reference and qualification checks, and signing the formal employment agreement.</p><p>Please confirm acceptance in writing by the date shown below.</p>', 5, false),
  ('dtblk-hr-offer-footer', 'dhr-letter-offer-v1', 'org-footer', 'Organisation footer', '', 6, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-employee-offer', 'print-employee-offer', 'employee', 'dhr-letter-offer-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator'), ('role-hr-manager'), ('role-hr-officer')) as r(role_id)
cross join (values ('print-employee-offer')) as p(process_id)
on conflict (role_id, process_id) do nothing;
