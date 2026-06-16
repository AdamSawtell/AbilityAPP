-- Incident service type field + configurable investigation SLA on organisation profile

alter table public.incident
  add column if not exists service_type text not null default '';

create index if not exists incident_service_type_idx on public.incident (service_type);

alter table public.app_organization
  add column if not exists incident_investigation_sla_days int not null default 14;

update public.app_organization
set incident_investigation_sla_days = 14
where incident_investigation_sla_days is null or incident_investigation_sla_days < 1;
