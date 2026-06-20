-- Timesheet payroll export tracking (WP-D.12)

alter table public.timesheet
  add column if not exists payroll_export_status text not null default 'Not exported',
  add column if not exists payroll_exported_at timestamptz,
  add column if not exists payroll_export_batch_ref text not null default '';

comment on column public.timesheet.payroll_export_status is 'Not exported | Exported | Processed — payroll file delivery state';
comment on column public.timesheet.payroll_export_batch_ref is 'Batch reference for traceability with Keypay/Xero import';
