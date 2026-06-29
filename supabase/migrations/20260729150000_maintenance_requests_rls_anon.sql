-- AB-0005 fix: align maintenance RLS with the rest of the app (anon + authenticated)
-- The initial policies targeted only `authenticated`, but the web app connects via the
-- anon key, so inserts failed with 42501 (row-level security violation).

drop policy if exists "maintenance_request authenticated all" on public.maintenance_request;
drop policy if exists "maintenance_request_photo authenticated all" on public.maintenance_request_photo;

create policy "maintenance_request all"
  on public.maintenance_request for all to anon, authenticated using (true) with check (true);

create policy "maintenance_request_photo all"
  on public.maintenance_request_photo for all to anon, authenticated using (true) with check (true);
