-- AB-0033 follow-up — configurable month allocation for pay periods.
-- A calendar (accounting) month can span several fortnightly pay periods. This
-- setting controls how each pay period's labour cost is attributed to a month
-- for financial close.
--   accrual    — match each shift to the month the work was performed (default,
--                AASB/GAAP accrual matching; a fortnight can split across months)
--   period_end — assign the whole pay period to the month its end date falls in
--   pay_date   — assign the whole pay period to the month it is paid

alter table public.pay_period_definition
  add column if not exists month_allocation_method text not null default 'accrual',
  add column if not exists pay_date_offset_days integer not null default 7;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pay_period_definition_month_alloc'
  ) then
    alter table public.pay_period_definition
      add constraint pay_period_definition_month_alloc
      check (month_allocation_method in ('accrual', 'period_end', 'pay_date'));
  end if;
end $$;

comment on column public.pay_period_definition.month_allocation_method is
  'How a pay period maps to a calendar month for financial close: accrual | period_end | pay_date.';
comment on column public.pay_period_definition.pay_date_offset_days is
  'Days after period end that wages are paid (used by the pay_date allocation method).';
