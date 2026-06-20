-- Timesheet payroll reconciliation (WP-D.18)

alter table public.timesheet
  add column if not exists payroll_paid_hours numeric,
  add column if not exists payroll_pay_run_ref text not null default '',
  add column if not exists payroll_reconcile_status text not null default 'Pending',
  add column if not exists payroll_reconciled_at timestamptz;

comment on column public.timesheet.payroll_paid_hours is 'Hours paid per payroll system — compared to total_hours for reconciliation';
comment on column public.timesheet.payroll_pay_run_ref is 'Payroll system pay run reference (Keypay/Xero)';
comment on column public.timesheet.payroll_reconcile_status is 'Pending | Matched | Variance — exported vs paid hours';
