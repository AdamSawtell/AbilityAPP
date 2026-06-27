-- AB-0031 — Shift profitability snapshot fields.

alter table public.roster_shift
  add column if not exists pay_period_instance_id text references public.pay_period_instance (id) on delete set null,
  add column if not exists calculated_cost numeric,
  add column if not exists calculated_income numeric,
  add column if not exists calculated_margin numeric;

create index if not exists roster_shift_pay_period_idx on public.roster_shift (pay_period_instance_id);

comment on column public.roster_shift.pay_period_instance_id is 'Pay period bucket for this shift (AB-0033).';
comment on column public.roster_shift.calculated_cost is 'SCHADS-based shift cost incl. loadings and super (AB-0031).';
comment on column public.roster_shift.calculated_income is 'Billable income allocated to shift (AB-0031).';
comment on column public.roster_shift.calculated_margin is 'Income minus cost (AB-0031).';
