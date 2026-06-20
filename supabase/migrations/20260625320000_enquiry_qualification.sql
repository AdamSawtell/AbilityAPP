-- Enquiry NDIS qualification fields (Chunk 0 — WP-0.2)

alter table public.enquiry
  add column if not exists ndis_number text not null default '',
  add column if not exists plan_status text not null default '',
  add column if not exists plan_management_type text not null default '',
  add column if not exists postcode text not null default '',
  add column if not exists support_categories text not null default '',
  add column if not exists urgency text not null default '',
  add column if not exists qualification_score integer not null default 0,
  add column if not exists qualification_tier text not null default 'Not qualified',
  add column if not exists qualification_summary text not null default '';

-- Grant Qualification tab to roles that already have Support needs
insert into public.app_role_window (role_id, window_key, access_level)
select arw.role_id, 'enquiry-qualification', arw.access_level
from public.app_role_window arw
where arw.window_key = 'enquiry-support-needs'
and not exists (
  select 1 from public.app_role_window existing
  where existing.role_id = arw.role_id and existing.window_key = 'enquiry-qualification'
);
