-- Harden Reports Advance SQL: block credentials and system catalogs

create or replace function public.run_readonly_sql(query_text text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
  trimmed text;
  lowerq text;
begin
  trimmed := trim(trailing ';' from trim(both from query_text));
  lowerq := lower(trimmed);

  if trimmed = '' then
    raise exception 'Query is empty';
  end if;

  if position(';' in trimmed) > 0 then
    raise exception 'Only a single statement is allowed';
  end if;

  if not (lowerq like 'select %' or lowerq like 'select%' or lowerq like 'with %' or lowerq like 'with%') then
    raise exception 'Only SELECT queries are allowed';
  end if;

  if lowerq ~ '\y(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|merge|execute)\y' then
    raise exception 'Query contains forbidden keywords';
  end if;

  if lowerq ~ '\y(password|pg_catalog|information_schema|auth\.|storage\.|vault\.|extensions\.|app_user)\y' then
    raise exception 'Query references restricted system or credential data';
  end if;

  perform set_config('statement_timeout', '30000', true);

  execute
    'select coalesce(json_agg(row_to_json(q)), ''[]''::json) from (select * from (' || trimmed || ') q limit 5000) sub'
  into result;

  return result;
end;
$$;

revoke all on function public.run_readonly_sql(text) from public;
grant execute on function public.run_readonly_sql(text) to anon, authenticated;
