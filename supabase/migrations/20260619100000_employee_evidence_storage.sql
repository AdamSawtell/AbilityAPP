-- Staff credential evidence uploads (My workplace)

insert into storage.buckets (id, name, public)
values ('employee-evidence', 'employee-evidence', true)
on conflict (id) do nothing;

drop policy if exists employee_evidence_storage_select on storage.objects;
create policy employee_evidence_storage_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'employee-evidence');

drop policy if exists employee_evidence_storage_insert on storage.objects;
create policy employee_evidence_storage_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'employee-evidence');

drop policy if exists employee_evidence_storage_update on storage.objects;
create policy employee_evidence_storage_update on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'employee-evidence')
  with check (bucket_id = 'employee-evidence');

drop policy if exists employee_evidence_storage_delete on storage.objects;
create policy employee_evidence_storage_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'employee-evidence');
