-- Run the migration and this test in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('c5f2af2e-7a34-4eb4-a379-4138ec6c4201', 'ccact-admin-test@example.invalid'),
  ('c5f2af2e-7a34-4eb4-a379-4138ec6c4202', 'ccact-applicant-test@example.invalid');
insert into private.admin_users values ('c5f2af2e-7a34-4eb4-a379-4138ec6c4201');
insert into public.affiliate_applications (user_id, name) values ('c5f2af2e-7a34-4eb4-a379-4138ec6c4202', 'Test');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c5f2af2e-7a34-4eb4-a379-4138ec6c4202', true);
do $$ begin
  begin
    perform public.admin_applications();
    raise exception 'Applicant could read admin data';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_decide_application('c5f2af2e-7a34-4eb4-a379-4138ec6c4202', 'approved');
    raise exception 'Applicant could approve application';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'c5f2af2e-7a34-4eb4-a379-4138ec6c4201', true);
do $$ begin
  if not exists (select 1 from public.admin_applications() where email = 'ccact-applicant-test@example.invalid' and status = 'pending') then
    raise exception 'Admin cannot see pending application';
  end if;
  perform public.admin_decide_application('c5f2af2e-7a34-4eb4-a379-4138ec6c4202', 'approved');
  if not exists (select 1 from public.admin_applications() where email = 'ccact-applicant-test@example.invalid' and status = 'approved') then
    raise exception 'Admin approval failed';
  end if;
  begin
    perform public.admin_decide_application('c5f2af2e-7a34-4eb4-a379-4138ec6c4202', 'rejected');
    raise exception 'Decision changed after review';
  exception when raise_exception then
    if sqlerrm = 'Decision changed after review' then raise; end if;
  end;
end $$;
reset role;
