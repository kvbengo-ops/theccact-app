-- Run after the migration inside a transaction that will be rolled back.
insert into auth.users (id) values
  ('c5f2af2e-7a34-4eb4-a379-4138ec6c4101'),
  ('c5f2af2e-7a34-4eb4-a379-4138ec6c4102');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5f2af2e-7a34-4eb4-a379-4138ec6c4101', true);
insert into public.affiliate_applications (user_id, name)
values ('c5f2af2e-7a34-4eb4-a379-4138ec6c4101', 'Test applicant');

do $$
begin
  if (select status from public.affiliate_applications) <> 'pending' then
    raise exception 'application must start pending';
  end if;
  if has_column_privilege('authenticated', 'public.affiliate_applications', 'status', 'insert')
     or has_table_privilege('authenticated', 'public.affiliate_applications', 'update')
     or has_table_privilege('anon', 'public.affiliate_applications', 'select') then
    raise exception 'unsafe application privileges';
  end if;
  begin
    insert into public.affiliate_applications (user_id, name, type)
    values ('c5f2af2e-7a34-4eb4-a379-4138ec6c4102', 'Other applicant', 'individual');
    raise exception 'cross-user submission succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', 'c5f2af2e-7a34-4eb4-a379-4138ec6c4102', true);
do $$
begin
  if exists (select 1 from public.affiliate_applications) then
    raise exception 'another user can read the application';
  end if;
end $$;
reset role;
