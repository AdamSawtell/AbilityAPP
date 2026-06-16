-- Role report access (report ids match docs/reports/reports.json)

create table if not exists public.app_role_report (
  role_id text not null references public.app_role (id) on delete cascade,
  report_id text not null,
  primary key (role_id, report_id)
);

create index if not exists app_role_report_id_idx on public.app_role_report (report_id);

alter table public.app_role_report enable row level security;

drop policy if exists app_role_report_all on public.app_role_report;
create policy app_role_report_all on public.app_role_report
  for all to anon, authenticated using (true) with check (true);
