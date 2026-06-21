-- Board Reporting — templates, packs, and section snapshots (NDIS board report framework)

create table if not exists public.board_report_template (
  id text primary key,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  is_default boolean not null default false,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_report_template_section (
  id text primary key,
  template_id text not null references public.board_report_template (id) on delete cascade,
  section_code text not null,
  label text not null,
  description text not null default '',
  default_included boolean not null default true,
  sort_order integer not null default 1,
  unique (template_id, section_code)
);

create table if not exists public.board_report_pack (
  id text primary key,
  template_id text not null references public.board_report_template (id) on delete restrict,
  report_period text not null,
  title text not null,
  status text not null default 'Draft',
  executive_summary text not null default '',
  ceo_commentary text not null default '',
  key_decisions_required text not null default '',
  operational_issues text not null default '',
  reviewed_at timestamptz,
  reviewed_by text not null default '',
  approved_at timestamptz,
  approved_by text not null default '',
  published_at timestamptz,
  published_by text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint board_report_pack_status check (
    status in ('Draft', 'Reviewed', 'Approved', 'Published')
  )
);

create index if not exists board_report_pack_period_idx on public.board_report_pack (report_period desc);
create index if not exists board_report_pack_status_idx on public.board_report_pack (status);

create table if not exists public.board_report_pack_section (
  id text primary key,
  pack_id text not null references public.board_report_pack (id) on delete cascade,
  section_code text not null,
  label text not null,
  sort_order integer not null default 1,
  included boolean not null default true,
  traffic_light text not null default 'none',
  status_message text not null default '',
  commentary text not null default '',
  metrics_json jsonb not null default '{}'::jsonb,
  data_snapshot_json jsonb not null default '{}'::jsonb,
  unique (pack_id, section_code),
  constraint board_report_pack_section_traffic check (
    traffic_light in ('green', 'amber', 'red', 'none')
  )
);

create index if not exists board_report_pack_section_pack_idx on public.board_report_pack_section (pack_id, sort_order);

drop trigger if exists board_report_template_updated_at on public.board_report_template;
create trigger board_report_template_updated_at
  before update on public.board_report_template
  for each row execute function public.set_updated_at();

drop trigger if exists board_report_pack_updated_at on public.board_report_pack;
create trigger board_report_pack_updated_at
  before update on public.board_report_pack
  for each row execute function public.set_updated_at();

alter table public.board_report_template enable row level security;
alter table public.board_report_template_section enable row level security;
alter table public.board_report_pack enable row level security;
alter table public.board_report_pack_section enable row level security;

drop policy if exists board_report_template_select on public.board_report_template;
drop policy if exists board_report_template_write on public.board_report_template;
create policy board_report_template_select on public.board_report_template for select to anon, authenticated using (true);
create policy board_report_template_write on public.board_report_template for all to anon, authenticated using (true) with check (true);

drop policy if exists board_report_template_section_select on public.board_report_template_section;
drop policy if exists board_report_template_section_write on public.board_report_template_section;
create policy board_report_template_section_select on public.board_report_template_section for select to anon, authenticated using (true);
create policy board_report_template_section_write on public.board_report_template_section for all to anon, authenticated using (true) with check (true);

drop policy if exists board_report_pack_select on public.board_report_pack;
drop policy if exists board_report_pack_write on public.board_report_pack;
create policy board_report_pack_select on public.board_report_pack for select to anon, authenticated using (true);
create policy board_report_pack_write on public.board_report_pack for all to anon, authenticated using (true) with check (true);

drop policy if exists board_report_pack_section_select on public.board_report_pack_section;
drop policy if exists board_report_pack_section_write on public.board_report_pack_section;
create policy board_report_pack_section_select on public.board_report_pack_section for select to anon, authenticated using (true);
create policy board_report_pack_section_write on public.board_report_pack_section for all to anon, authenticated using (true) with check (true);

comment on table public.board_report_template is 'Reusable board report pack templates for NDIS providers';
comment on table public.board_report_pack is 'Generated board report instance for a reporting period';
comment on table public.board_report_pack_section is 'Configurable section snapshot within a board report pack';

-- Default NDIS provider board report template
insert into public.board_report_template (id, name, description, active, is_default, created_by, updated_by)
values (
  'brt-ndis-default',
  'NDIS Board Report Pack',
  'Standard monthly board report pack for Australian NDIS disability service providers.',
  true,
  true,
  'SuperUser',
  'SuperUser'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  is_default = excluded.is_default;

insert into public.board_report_template_section (id, template_id, section_code, label, description, default_included, sort_order)
values
  ('brts-exec-summary', 'brt-ndis-default', 'executive-summary', 'Executive Summary', 'High-level performance overview for the board.', true, 1),
  ('brts-org-performance', 'brt-ndis-default', 'organisational-performance', 'Organisational Performance', 'Service volume, growth, and operational KPIs.', true, 2),
  ('brts-participant-overview', 'brt-ndis-default', 'participant-overview', 'Participant / Client Overview', 'Active participants, intake, and exits.', true, 3),
  ('brts-ndis-revenue', 'brt-ndis-default', 'ndis-revenue-claims', 'NDIS Revenue and Claims', 'Claims submitted, remittance, and billing.', true, 4),
  ('brts-service-delivery', 'brt-ndis-default', 'service-delivery', 'Service Delivery Performance', 'Bookings, timesheets, and delivery against plan.', true, 5),
  ('brts-rostering-workforce', 'brt-ndis-default', 'rostering-workforce', 'Rostering and Workforce Metrics', 'Shifts, coverage, leave, and credentials.', true, 6),
  ('brts-incidents-risk', 'brt-ndis-default', 'incidents-risk', 'Incidents and Risk', 'Incident trends, NDIS reportable events, and open investigations.', true, 7),
  ('brts-complaints-feedback', 'brt-ndis-default', 'complaints-feedback', 'Complaints and Feedback', 'Complaints register and participant feedback summary.', true, 8),
  ('brts-restrictive-practices', 'brt-ndis-default', 'restrictive-practices', 'Restrictive Practices', 'Authorised restrictive practices and alerts.', true, 9),
  ('brts-compliance-quality', 'brt-ndis-default', 'compliance-quality', 'Compliance and Quality Indicators', 'NDIS compliance, audit readiness, and quality metrics.', true, 10),
  ('brts-plan-utilisation', 'brt-ndis-default', 'plan-utilisation', 'Plan Utilisation', 'Plan budget utilisation and variance.', true, 11),
  ('brts-financial-summary', 'brt-ndis-default', 'financial-summary', 'Financial Summary', 'Month-end close, invoices, and payroll reconciliation.', true, 12),
  ('brts-operational-issues', 'brt-ndis-default', 'operational-issues', 'Operational Issues', 'Current operational issues requiring board awareness.', true, 13),
  ('brts-strategic-projects', 'brt-ndis-default', 'strategic-projects', 'Strategic Projects', 'Major projects and transformation initiatives.', true, 14),
  ('brts-ceo-commentary', 'brt-ndis-default', 'ceo-commentary', 'CEO Commentary', 'Chief executive narrative and context.', true, 15),
  ('brts-key-decisions', 'brt-ndis-default', 'key-decisions', 'Key Decisions Required', 'Decisions requiring board resolution.', true, 16),
  ('brts-appendices', 'brt-ndis-default', 'appendices', 'Appendices', 'Supporting tables and reference material.', false, 17)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  default_included = excluded.default_included,
  sort_order = excluded.sort_order;
