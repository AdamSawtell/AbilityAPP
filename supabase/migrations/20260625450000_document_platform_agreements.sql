-- Document platform D5 — service agreement templates, processes, and role access

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values
  (
    'dagreement-ndis-v1',
    'NDIS service agreement',
    'Printable service agreement with schedule of supports and signature block. Review terms before use.',
    'service-agreement',
    true,
    true,
    'Service Agreement',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dagreement-variation-v1',
    'Agreement variation',
    'Variation to an existing NDIS service agreement. Review terms before use.',
    'service-agreement-variation',
    true,
    false,
    'Agreement variation',
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
  ('dtblk-agreement-header', 'dagreement-ndis-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-agreement-title', 'dagreement-ndis-v1', 'title', 'Document title', 'Service Agreement', 2, false),
  ('dtblk-agreement-parties', 'dagreement-ndis-v1', 'parties', 'Parties', '', 3, false),
  ('dtblk-agreement-meta', 'dagreement-ndis-v1', 'metadata', 'Agreement details', '', 4, false),
  ('dtblk-agreement-terms', 'dagreement-ndis-v1', 'rich-text', 'Terms', '<p>This agreement sets out the supports {{org.tradingName}} will provide under the participant''s NDIS plan. Customise this scaffold with your organisation''s legal terms before production use.</p>', 5, false),
  ('dtblk-agreement-lines', 'dagreement-ndis-v1', 'line-table', 'Schedule of supports', '', 6, true),
  ('dtblk-agreement-privacy', 'dagreement-ndis-v1', 'rich-text', 'Privacy and consent', '<p>The participant consents to the collection and use of personal information as required to deliver NDIS supports and meet provider obligations.</p>', 7, false),
  ('dtblk-agreement-signature', 'dagreement-ndis-v1', 'signature', 'Signatures', '', 8, true),
  ('dtblk-agreement-footer', 'dagreement-ndis-v1', 'org-footer', 'Organisation footer', '', 9, true),
  ('dtblk-variation-header', 'dagreement-variation-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-variation-title', 'dagreement-variation-v1', 'title', 'Document title', 'Agreement variation', 2, false),
  ('dtblk-variation-parties', 'dagreement-variation-v1', 'parties', 'Parties', '', 3, false),
  ('dtblk-variation-meta', 'dagreement-variation-v1', 'metadata', 'Variation details', '', 4, false),
  ('dtblk-variation-terms', 'dagreement-variation-v1', 'rich-text', 'Variation terms', '<p>This variation amends the existing service agreement between the parties. Customise this scaffold with your organisation''s legal terms before production use.</p>', 5, false),
  ('dtblk-variation-lines', 'dagreement-variation-v1', 'line-table', 'Revised schedule', '', 6, true),
  ('dtblk-variation-signature', 'dagreement-variation-v1', 'signature', 'Signatures', '', 7, true),
  ('dtblk-variation-footer', 'dagreement-variation-v1', 'org-footer', 'Organisation footer', '', 8, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-service-agreement', 'print-service-agreement', 'service-agreement', 'dagreement-ndis-v1', true, true),
  ('pdb-print-agreement-variation', 'print-agreement-variation', 'service-agreement', 'dagreement-variation-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator')) as r(role_id)
cross join (values
  ('print-service-agreement'),
  ('print-agreement-variation')
) as p(process_id)
on conflict (role_id, process_id) do nothing;
