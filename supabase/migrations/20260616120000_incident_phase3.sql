-- Phase 3: workflow, restrictive practice link, evidence attachments, storage bucket

alter table public.incident
  add column if not exists linked_restrictive_practice_id text,
  add column if not exists manager_reviewed_at timestamptz,
  add column if not exists manager_reviewed_by text not null default '';

create index if not exists incident_linked_rp_idx on public.incident (linked_restrictive_practice_id);

create table if not exists public.incident_evidence (
  id text primary key,
  incident_id text not null references public.incident (id) on delete cascade,
  line_no int not null default 1,
  action_id text not null default '',
  file_name text not null default '',
  file_url text not null default '',
  storage_path text not null default '',
  mime_type text not null default '',
  uploaded_at timestamptz,
  uploaded_by text not null default '',
  notes text not null default ''
);

create index if not exists incident_evidence_incident_id_idx on public.incident_evidence (incident_id);

alter table public.incident_evidence enable row level security;

drop policy if exists incident_evidence_all on public.incident_evidence;
create policy incident_evidence_all on public.incident_evidence for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('incident-evidence', 'incident-evidence', true)
on conflict (id) do nothing;

drop policy if exists incident_evidence_storage_select on storage.objects;
create policy incident_evidence_storage_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'incident-evidence');

drop policy if exists incident_evidence_storage_insert on storage.objects;
create policy incident_evidence_storage_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'incident-evidence');

drop policy if exists incident_evidence_storage_update on storage.objects;
create policy incident_evidence_storage_update on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'incident-evidence')
  with check (bucket_id = 'incident-evidence');

drop policy if exists incident_evidence_storage_delete on storage.objects;
create policy incident_evidence_storage_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'incident-evidence');
