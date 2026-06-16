-- Products and services offered at a support location (from product catalog)

create table if not exists public.support_location_product (
  id text primary key,
  location_id text not null references public.support_location (id) on delete cascade,
  line_no integer not null default 1,
  product_id text not null references public.product (id) on delete cascade,
  active text not null default 'Yes',
  valid_from date,
  valid_to date,
  notes text not null default ''
);

create index if not exists support_location_product_location_id_idx on public.support_location_product (location_id);
create index if not exists support_location_product_product_id_idx on public.support_location_product (product_id);

alter table public.support_location_product enable row level security;

drop policy if exists support_location_product_all on public.support_location_product;
create policy support_location_product_all on public.support_location_product
  for all to anon, authenticated using (true) with check (true);
