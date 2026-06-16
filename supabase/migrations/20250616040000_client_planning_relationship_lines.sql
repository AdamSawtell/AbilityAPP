-- Client relationship, risk, needs lines + support plan progress reviews

create table if not exists public.client_risk (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  risk_type text not null default '',
  show_as_alert text not null default 'No',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_bp_association (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  associated_bp_name text not null default '',
  association_type text not null default '',
  relationship text not null default '',
  phone text not null default '',
  mobile text not null default '',
  email text not null default '',
  primary_contact text not null default 'No',
  valid_from date,
  valid_to date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_contact_activity (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  activity_date date,
  activity_type text not null default '',
  contact_name text not null default '',
  subject text not null default '',
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_support_receiver_need_rule (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  category text not null default '',
  name text not null default '',
  rule_text text not null default '',
  show_as_alert text not null default 'No',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_goal_progress_review (
  id text primary key,
  goal_id text not null references public.support_plan_goal (id) on delete cascade,
  line_no integer not null default 1,
  progress_review_type text not null default '',
  review_date date,
  goal_progress text not null default '',
  progress_taken text not null default '',
  receiver_feeling text not null default '',
  next_steps text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_risk_client_id_idx on public.client_risk (client_id);
create index if not exists client_bp_association_client_id_idx on public.client_bp_association (client_id);
create index if not exists client_contact_activity_client_id_idx on public.client_contact_activity (client_id);
create index if not exists client_support_receiver_need_rule_client_id_idx on public.client_support_receiver_need_rule (client_id);
create index if not exists support_plan_goal_progress_review_goal_id_idx on public.support_plan_goal_progress_review (goal_id);

alter table public.client_risk enable row level security;
alter table public.client_bp_association enable row level security;
alter table public.client_contact_activity enable row level security;
alter table public.client_support_receiver_need_rule enable row level security;
alter table public.support_plan_goal_progress_review enable row level security;

create policy "client_risk_all" on public.client_risk for all using (true) with check (true);
create policy "client_bp_association_all" on public.client_bp_association for all using (true) with check (true);
create policy "client_contact_activity_all" on public.client_contact_activity for all using (true) with check (true);
create policy "client_support_receiver_need_rule_all" on public.client_support_receiver_need_rule for all using (true) with check (true);
create policy "support_plan_goal_progress_review_all" on public.support_plan_goal_progress_review for all using (true) with check (true);
