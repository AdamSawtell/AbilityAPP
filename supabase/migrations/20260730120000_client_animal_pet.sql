-- AB-0007 Animal and Pet tab

alter table public.client
  add column if not exists animal_allergy_alert text not null default '';

create table if not exists public.client_animal (
  id text primary key,
  client_id text not null references public.client (id) on delete cascade,
  line_no integer not null default 1,
  display_priority integer not null default 10,
  animal_type text not null default '',
  name text not null default '',
  breed text not null default '',
  role text not null default 'companion',
  status text not null default 'active',
  assistance_registration text not null default '',
  assistance_tasks text not null default '',
  assistance_provider text not null default '',
  care_notes text not null default '',
  feeding_schedule text not null default '',
  walking_requirements text not null default '',
  medication_details text not null default '',
  vet_name text not null default '',
  vet_phone text not null default '',
  vet_address text not null default '',
  vet_after_hours text not null default '',
  medical_conditions text not null default '',
  allergies text not null default '',
  photo_url text not null default '',
  care_responsibility text not null default '',
  accompanies_to_program text not null default 'No',
  transport_notes text not null default '',
  vaccination_up_to_date text not null default '',
  last_vaccination_date date,
  next_vaccination_due date,
  health_certificate_expiry date,
  microchip_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incident
  add column if not exists linked_animal_id text;

create index if not exists client_animal_client_id_idx on public.client_animal (client_id);

alter table public.client_animal enable row level security;

create policy "client_animal_all"
  on public.client_animal for all to anon, authenticated using (true) with check (true);

-- Demo: Bernadette Rose assistance dog (AB-0007 smoke)
insert into public.client_animal (
  id, client_id, line_no, display_priority, animal_type, name, breed, role, status,
  assistance_registration, assistance_tasks, assistance_provider, care_notes,
  feeding_schedule, walking_requirements, vet_name, vet_phone, vet_address, vet_after_hours,
  care_responsibility, accompanies_to_program, transport_notes,
  vaccination_up_to_date, last_vaccination_date, next_vaccination_due, health_certificate_expiry, microchip_number
) values (
  'animal-bern-guide', 'bp-bern', 1, 1, 'dog', 'Scout', 'Labrador', 'assistance', 'active',
  'AD-2022-8841', 'Mobility assistance, item retrieval, anxiety alert', 'Guide Dogs SA/NT',
  'Scout works on harness only during support sessions.',
  'Morning and evening — 1 cup dry food', 'Two 20-minute walks daily when weather permits',
  'Glenelg Vet Clinic', '08 8294 2200', '45 Jetty Road, Glenelg SA 5045', '1300 PET 24HR',
  'external', 'Yes', 'Scout travels in approved harness in rear seat.',
  'Yes', '2025-11-10', '2026-11-10', '2026-06-30', '956000012345678'
) on conflict (id) do nothing;
