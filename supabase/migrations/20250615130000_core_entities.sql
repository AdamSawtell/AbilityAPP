-- Core AbilityVua entities (enquiries through support plans)

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.enquiry (
  id text primary key,
  document_no text not null default '',
  date_received date,
  date_next_action date,
  status text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  funding_body text not null default '',
  disability text not null default '',
  services text not null default '',
  is_enquiry_for_self text not null default '',
  third_party_consent text not null default '',
  relationship_type text not null default '',
  phone text not null default '',
  email text not null default '',
  birthday date,
  gender text not null default '',
  preferred_communication_method text not null default '',
  bp_name text not null default '',
  enquiry_source text not null default '',
  description text not null default '',
  outcome text not null default '',
  additional_disability_information text not null default '',
  other text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients (support received)
-- ---------------------------------------------------------------------------
create table if not exists public.client (
  id text primary key,
  enquiry_id text references public.enquiry (id) on delete set null,
  search_key text not null default '',
  business_partner_group text not null default '',
  name text not null default '',
  risk_alerts text not null default '',
  consent_alert_list text not null default '',
  first_name text not null default '',
  preferred_name text not null default '',
  last_name text not null default '',
  middle_name text not null default '',
  email text not null default '',
  phone text not null default '',
  status text not null default '',
  birthday date,
  is_estimated_age boolean not null default false,
  gender text not null default '',
  decision_making text not null default '',
  lgbtiqa text not null default '',
  living_arrangement text not null default '',
  sales_representative text not null default '',
  services text not null default '',
  funding_body text not null default '',
  funding_body_number text not null default '',
  transitioned_to_pace date,
  date_support_commencement date,
  date_support_ceased date,
  aboriginal_torres_strait_islander text not null default '',
  cultural_affiliation text not null default '',
  disability text not null default '',
  additional_disability_information text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_alert (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  alert_type text not null default '',
  show_as_alert text not null default 'No',
  name text not null default '',
  description text not null default '',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_activity (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  activity_date date,
  activity_type text not null default '',
  subject text not null default '',
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_location (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  name text not null default '',
  address_type text not null default '',
  address1 text not null default '',
  address2 text not null default '',
  address3 text not null default '',
  city text not null default '',
  state text not null default '',
  postcode text not null default '',
  country text not null default '',
  phone text not null default '',
  mobile text not null default '',
  email text not null default '',
  post_to_address text not null default 'No',
  invoice_address text not null default 'No',
  ship_to_address text not null default 'No',
  service_delivery_address text not null default 'No',
  active text not null default 'Yes',
  valid_from date,
  valid_to date,
  access_notes text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_enquiry_id_idx on public.client (enquiry_id);
create index if not exists client_alert_client_id_idx on public.client_alert (client_id);
create index if not exists client_activity_client_id_idx on public.client_activity (client_id);
create index if not exists client_location_client_id_idx on public.client_location (client_id);

-- ---------------------------------------------------------------------------
-- Products & price lists
-- ---------------------------------------------------------------------------
create table if not exists public.price_list (
  id text primary key,
  name text not null default '',
  schema_name text not null default '',
  base_price_list_id text not null default '',
  valid_from date,
  currency text not null default 'AUD',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product (
  id text primary key,
  search_key text not null default '',
  name text not null default '',
  description text not null default '',
  product_category text not null default '',
  uom text not null default '',
  product_type text not null default '',
  active boolean not null default true,
  sold boolean not null default true,
  price_list_id text references public.price_list (id) on delete set null,
  ndis_support_item text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_list_line (
  id text primary key,
  price_list_id text not null references public.price_list (id) on delete cascade,
  line_no integer not null default 1,
  product_id text references public.product (id) on delete set null,
  list_price numeric(12, 2),
  standard_price numeric(12, 2),
  limit_price numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_price_list_id_idx on public.product (price_list_id);
create index if not exists price_list_line_price_list_id_idx on public.price_list_line (price_list_id);

-- ---------------------------------------------------------------------------
-- Service agreements
-- ---------------------------------------------------------------------------
create table if not exists public.service_agreement (
  id text primary key,
  search_key text not null default '',
  name text not null default '',
  description text not null default '',
  client_id text references public.client (id) on delete set null,
  price_list_id text references public.price_list (id) on delete set null,
  term text not null default '',
  status text not null default '',
  execution_date date,
  contract_date date,
  finish_date date,
  review_date date,
  total_planned_amount numeric(14, 2),
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_agreement_line (
  id text primary key,
  service_agreement_id text not null references public.service_agreement (id) on delete cascade,
  line_no integer not null default 1,
  product_id text references public.product (id) on delete set null,
  name text not null default '',
  description text not null default '',
  planned_price numeric(14, 2),
  registration_group text not null default '',
  funding_type text not null default '',
  funding_body text not null default '',
  funding_management_type text not null default '',
  budget_rules text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_agreement_client_id_idx on public.service_agreement (client_id);
create index if not exists service_agreement_line_agreement_id_idx on public.service_agreement_line (service_agreement_id);

-- ---------------------------------------------------------------------------
-- Contracts (legacy module)
-- ---------------------------------------------------------------------------
create table if not exists public.contract (
  id text primary key,
  document_no text not null default '',
  client_id text references public.client (id) on delete set null,
  business_partner_name text not null default '',
  contract_type text not null default '',
  name text not null default '',
  description text not null default '',
  contract_term text not null default '',
  execution_date date,
  start_date date,
  end_date date,
  review_date date,
  reference text not null default '',
  project text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_audit (
  id text primary key,
  contract_id text not null references public.contract (id) on delete cascade,
  line_no integer not null default 1,
  audit_date date,
  changed_by text not null default '',
  action text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_client_id_idx on public.contract (client_id);
create index if not exists contract_audit_contract_id_idx on public.contract_audit (contract_id);

-- ---------------------------------------------------------------------------
-- Support plans & plan documents
-- ---------------------------------------------------------------------------
create table if not exists public.support_plan (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  document_no text not null default '',
  description text not null default '',
  provided_to_receiver date,
  execution_date date,
  active boolean not null default true,
  important_to_me text not null default '',
  how_supported text not null default '',
  hobbies text not null default '',
  cultural_needs text not null default '',
  likes text not null default '',
  dislikes text not null default '',
  about_other text not null default '',
  primary_language text not null default '',
  interpreter_required text not null default '',
  communication_method text not null default '',
  medication_required text not null default '',
  medication_details text not null default '',
  known_allergies text not null default '',
  medical_history text not null default '',
  behaviour_support_required text not null default '',
  behaviour_description text not null default '',
  strategies text not null default '',
  relaxation text not null default '',
  stress_cause text not null default '',
  morning text not null default '',
  daytime text not null default '',
  afternoon text not null default '',
  evening_night text not null default '',
  weekly text not null default '',
  activity_attendance boolean not null default false,
  activity_details text not null default '',
  personal_care boolean not null default false,
  dressing text not null default '',
  hair_care text not null default '',
  menstrual_management text not null default '',
  oral_hygiene text not null default '',
  nail_care text not null default '',
  shaving text not null default '',
  sleeping text not null default '',
  toilet_use text not null default '',
  showering text not null default '',
  personal_care_other text not null default '',
  household_support_required boolean not null default false,
  cooking text not null default '',
  cleaning text not null default '',
  gardening text not null default '',
  laundry text not null default '',
  make_bed text not null default '',
  grocery text not null default '',
  mobility_support_required text not null default '',
  mobility_detail text not null default '',
  eating_drinking_support text not null default '',
  dietary_allergies text not null default '',
  favourite_foods text not null default '',
  disliked_foods text not null default '',
  meal_other text not null default '',
  transport_arrangements text not null default '',
  financial_arrangement text not null default '',
  financial_arrangement_details text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_plan_goal (
  id text primary key,
  support_plan_id text not null references public.support_plan (id) on delete cascade,
  line_no integer not null default 1,
  name text not null default '',
  goal_number text not null default '',
  goal_term text not null default '',
  goal_type text not null default '',
  goal text not null default '',
  support_required text not null default '',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_assessment_document (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  document_no text not null default '',
  document_type text not null default '',
  plan_type text not null default '',
  assessment_type text not null default '',
  review_date date,
  date_received date,
  document_status text not null default '',
  document_developer text not null default '',
  support_plan_id text references public.support_plan (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_plan_client_id_idx on public.support_plan (client_id);
create index if not exists support_plan_goal_plan_id_idx on public.support_plan_goal (support_plan_id);
create index if not exists plan_assessment_document_client_id_idx on public.plan_assessment_document (client_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'enquiry', 'client', 'client_alert', 'client_activity', 'client_location',
    'price_list', 'product', 'price_list_line',
    'service_agreement', 'service_agreement_line',
    'contract', 'contract_audit',
    'support_plan', 'support_plan_goal', 'plan_assessment_document'
  ]
  loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS (MVP — tighten when auth is added)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'enquiry', 'client', 'client_alert', 'client_activity', 'client_location',
    'price_list', 'product', 'price_list_line',
    'service_agreement', 'service_agreement_line',
    'contract', 'contract_audit',
    'support_plan', 'support_plan_goal', 'plan_assessment_document'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to anon, authenticated using (true)',
      t, t
    );
    execute format(
      'create policy %I_write on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
