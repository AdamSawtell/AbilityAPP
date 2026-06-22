-- Support plan care plan gaps — scalar fields, goal columns, risk controls, line tables

alter table public.support_plan
  add column if not exists my_story text not null default '',
  add column if not exists important_for_me text not null default '',
  add column if not exists religious_requirements text not null default '',
  add column if not exists family_information text not null default '',
  add column if not exists pets text not null default '',
  add column if not exists strengths text not null default '',
  add column if not exists skills text not null default '',
  add column if not exists aspirations text not null default '',
  add column if not exists verbal_communication_level text not null default '',
  add column if not exists non_verbal_communication text not null default '',
  add column if not exists communication_aids text not null default '',
  add column if not exists communication_triggers text not null default '',
  add column if not exists calming_strategies text not null default '',
  add column if not exists worker_guidance text not null default '',
  add column if not exists behaviour_practitioner text not null default '',
  add column if not exists behaviour_authorisations text not null default '',
  add column if not exists emergency_medical_procedure text not null default '',
  add column if not exists emergency_missing_person_procedure text not null default '',
  add column if not exists emergency_behavioural_crisis_procedure text not null default '',
  add column if not exists emergency_fire_evacuation_procedure text not null default '',
  add column if not exists what_works_best text not null default '',
  add column if not exists worker_approaches text not null default '',
  add column if not exists environmental_considerations text not null default '',
  add column if not exists avoid_list text not null default '',
  add column if not exists unsafe_practices text not null default '',
  add column if not exists shift_arrival_process text not null default '',
  add column if not exists shift_departure_process text not null default '',
  add column if not exists documentation_requirements text not null default '';

alter table public.support_plan_goal
  add column if not exists ndis_category text not null default '',
  add column if not exists why_it_matters text not null default '',
  add column if not exists success_measures text not null default '';

alter table public.client_risk
  add column if not exists likelihood text not null default '',
  add column if not exists consequence text not null default '',
  add column if not exists controls text not null default '',
  add column if not exists emergency_response text not null default '',
  add column if not exists escalation_process text not null default '',
  add column if not exists review_date date;

create table if not exists public.support_plan_medication (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  medication_name text not null default '',
  dosage text not null default '',
  purpose text not null default '',
  administration_requirements text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_diagnosis (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  diagnosis text not null default '',
  condition text not null default '',
  treating_practitioner text not null default '',
  impact_on_daily_living text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_health_plan (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  plan_type text not null default '',
  attachment_reference text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_support_requirement (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  support_area text not null default '',
  support_requirement text not null default '',
  level_of_assistance text not null default '',
  frequency text not null default '',
  special_instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_assistive_technology (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  equipment text not null default '',
  serial_number text not null default '',
  maintenance_schedule text not null default '',
  training_required text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_plan_medication_plan_id_idx on public.support_plan_medication (support_plan_id);
create index if not exists support_plan_diagnosis_plan_id_idx on public.support_plan_diagnosis (support_plan_id);
create index if not exists support_plan_health_plan_plan_id_idx on public.support_plan_health_plan (support_plan_id);
create index if not exists support_plan_support_requirement_plan_id_idx on public.support_plan_support_requirement (support_plan_id);
create index if not exists support_plan_assistive_technology_plan_id_idx on public.support_plan_assistive_technology (support_plan_id);

alter table public.support_plan_medication enable row level security;
alter table public.support_plan_diagnosis enable row level security;
alter table public.support_plan_health_plan enable row level security;
alter table public.support_plan_support_requirement enable row level security;
alter table public.support_plan_assistive_technology enable row level security;

create policy "support_plan_medication_all" on public.support_plan_medication for all using (true) with check (true);
create policy "support_plan_diagnosis_all" on public.support_plan_diagnosis for all using (true) with check (true);
create policy "support_plan_health_plan_all" on public.support_plan_health_plan for all using (true) with check (true);
create policy "support_plan_support_requirement_all" on public.support_plan_support_requirement for all using (true) with check (true);
create policy "support_plan_assistive_technology_all" on public.support_plan_assistive_technology for all using (true) with check (true);
