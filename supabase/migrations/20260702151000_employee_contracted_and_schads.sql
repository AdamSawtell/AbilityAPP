-- AB-0032 / AB-0031 — Employee contracted hours and SCHADS costing fields.

alter table public.employee
  add column if not exists contracted_hours_per_period numeric,
  add column if not exists contracted_hours_period text not null default 'fortnight',
  add column if not exists schads_classification_level text not null default '',
  add column if not exists schads_pay_point text not null default '',
  add column if not exists super_rate numeric not null default 12;

comment on column public.employee.contracted_hours_per_period is 'Minimum guaranteed hours per pay period (AB-0032).';
comment on column public.employee.contracted_hours_period is 'week | fortnight | month — period for contracted_hours_per_period.';
comment on column public.employee.schads_classification_level is 'SCHADS level key e.g. level-2.1 (AB-0031).';
comment on column public.employee.schads_pay_point is 'Optional pay point label within level.';
comment on column public.employee.super_rate is 'Super guarantee % on gross wages (default 12).';
