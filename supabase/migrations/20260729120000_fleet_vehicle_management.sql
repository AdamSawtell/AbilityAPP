-- AB-0006 Vehicle and Fleet Management — foundation tables

create table if not exists public.fleet_vehicle (
  id text primary key,
  search_key text not null default '',
  name text not null default '',
  make text not null default '',
  model text not null default '',
  year integer,
  vin text not null default '',
  registration_number text not null default '',
  rego_expiry date,
  insurance_policy text not null default '',
  insurance_expiry date,
  location_id text references public.support_location (id) on delete set null,
  assigned_driver_id text references public.employee (id) on delete set null,
  status text not null default 'active',
  purchase_date date,
  purchase_cost numeric(12, 2),
  useful_life_years integer,
  residual_value numeric(12, 2),
  depreciation_method text not null default '',
  disposal_date date,
  disposal_proceeds numeric(12, 2),
  accessibility_features text not null default '',
  modification_notes text not null default '',
  modification_service_due date,
  compliance_notes text not null default '',
  odometer_reading integer,
  next_service_due date,
  last_service_date date,
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fleet_vehicle_location_id_idx on public.fleet_vehicle (location_id);
create index if not exists fleet_vehicle_status_idx on public.fleet_vehicle (status);
create index if not exists fleet_vehicle_rego_expiry_idx on public.fleet_vehicle (rego_expiry);

create table if not exists public.fleet_service_record (
  id text primary key,
  vehicle_id text not null references public.fleet_vehicle (id) on delete cascade,
  line_no integer not null default 1,
  service_type text not null default 'scheduled',
  service_date date,
  odometer_reading integer,
  cost numeric(12, 2),
  cost_status text not null default 'pending',
  provider text not null default '',
  notes text not null default '',
  next_service_due date,
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists fleet_service_record_vehicle_id_idx on public.fleet_service_record (vehicle_id);

create table if not exists public.fleet_inspection (
  id text primary key,
  vehicle_id text not null references public.fleet_vehicle (id) on delete cascade,
  employee_id text references public.employee (id) on delete set null,
  shift_id text references public.roster_shift (id) on delete set null,
  inspection_date timestamptz not null default now(),
  checklist_results jsonb not null default '{}'::jsonb,
  pass_fail text not null default 'pass',
  odometer_reading integer,
  notes text not null default '',
  created_by text not null default ''
);

create index if not exists fleet_inspection_vehicle_id_idx on public.fleet_inspection (vehicle_id);
create index if not exists fleet_inspection_shift_id_idx on public.fleet_inspection (shift_id);

create table if not exists public.fleet_fuel_log (
  id text primary key,
  vehicle_id text not null references public.fleet_vehicle (id) on delete cascade,
  line_no integer not null default 1,
  employee_id text references public.employee (id) on delete set null,
  log_date date,
  odometer_reading integer,
  litres numeric(10, 2),
  cost numeric(12, 2),
  receipt_url text not null default '',
  notes text not null default '',
  created_by text not null default ''
);

create index if not exists fleet_fuel_log_vehicle_id_idx on public.fleet_fuel_log (vehicle_id);

create table if not exists public.fleet_booking (
  id text primary key,
  vehicle_id text not null references public.fleet_vehicle (id) on delete cascade,
  employee_id text references public.employee (id) on delete set null,
  client_id text references public.client (id) on delete set null,
  location_id text references public.support_location (id) on delete set null,
  shift_id text references public.roster_shift (id) on delete set null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  purpose text not null default '',
  recurring_config jsonb,
  status text not null default 'confirmed',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fleet_booking_vehicle_id_idx on public.fleet_booking (vehicle_id);
create index if not exists fleet_booking_shift_id_idx on public.fleet_booking (shift_id);
create index if not exists fleet_booking_start_idx on public.fleet_booking (start_datetime);

alter table public.employee
  add column if not exists driver_licence_number text not null default '',
  add column if not exists medical_expiry date,
  add column if not exists ndis_screening_expiry date,
  add column if not exists wwcc_expiry date,
  add column if not exists driver_history_check_date date,
  add column if not exists vehicle_certifications text not null default '';

alter table public.incident
  add column if not exists vehicle_id text references public.fleet_vehicle (id) on delete set null;

create index if not exists incident_vehicle_id_idx on public.incident (vehicle_id);

alter table public.roster_shift
  add column if not exists vehicle_id text references public.fleet_vehicle (id) on delete set null;

create index if not exists roster_shift_vehicle_id_idx on public.roster_shift (vehicle_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'fleet_vehicle',
    'fleet_service_record',
    'fleet_inspection',
    'fleet_fuel_log',
    'fleet_booking'
  ]
  loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format(
      'create policy %I_all on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;

  foreach t in array array['fleet_vehicle', 'fleet_booking']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- Demo fleet vehicles
insert into public.fleet_vehicle (
  id, search_key, name, make, model, year, vin, registration_number, rego_expiry,
  insurance_policy, insurance_expiry, location_id, assigned_driver_id, status,
  accessibility_features, modification_notes, odometer_reading, next_service_due, last_service_date,
  notes, created_by, updated_by
) values
  (
    'veh-glenelg-01', 'VEH-001', 'Glenelg SIL Van', 'Toyota', 'HiAce', 2021,
    'JTFSX22P300123456', 'S123ABC', '2026-09-15', 'FleetCover-2026', '2026-12-01',
    null, null, 'active',
    'Wheelchair hoist, rear ramp', 'Hoist serviced annually', 84200, '2026-08-01', '2026-02-01',
    'Primary SIL transport vehicle', 'SuperUser', 'SuperUser'
  ),
  (
    'veh-dayhub-01', 'VEH-002', 'Day Hub Bus', 'Mercedes-Benz', 'Sprinter', 2019,
    'WDB9066331N123456', 'S456DEF', '2026-07-20', 'FleetCover-2026', '2026-12-01',
    null, null, 'active',
    'Wheelchair positions x2, lap sash harnesses', 'Ramp service due Q3', 112400, '2026-07-01', '2026-01-15',
    'Community access and day program', 'SuperUser', 'SuperUser'
  ),
  (
    'veh-pool-01', 'VEH-003', 'Pool Sedan', 'Toyota', 'Camry', 2022,
    'JTNB11HK303123456', 'S789GHI', '2027-03-01', 'FleetCover-2026', '2026-12-01',
    null, null, 'off_road',
    '', 'Awaiting repair after minor incident', 45600, null, '2025-11-01',
    'Off road pending panel repair', 'SuperUser', 'SuperUser'
  )
on conflict (id) do nothing;
