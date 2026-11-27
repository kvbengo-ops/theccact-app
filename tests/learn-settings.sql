-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('1ea43000-0000-4000-8000-000000000001', 'settings-a@example.invalid'),
  ('1ea43000-0000-4000-8000-000000000002', 'settings-b@example.invalid');
insert into public.courses (id, brand, title, status) values
  ('1ea43c00-0000-4000-8000-000000000001', 'ccact', 'Settings course', 'published');
insert into public.enrollments (user_id, course_id) values
  ('1ea43000-0000-4000-8000-000000000001', '1ea43c00-0000-4000-8000-000000000001'),
  ('1ea43000-0000-4000-8000-000000000002', '1ea43c00-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea43000-0000-4000-8000-000000000001', true);
do $$ begin
  perform public.learn_set_reminders(false);
  if not (select reminders_off from public.enrollments) then raise exception 'Reminders not turned off'; end if;
  perform public.learn_set_reminders(true);
  if (select reminders_off from public.enrollments) then raise exception 'Reminders not turned on'; end if;
  perform public.learn_set_reminders(false);
end $$;
reset role;
do $$ begin
  if (select reminders_off from public.enrollments where user_id = '1ea43000-0000-4000-8000-000000000002') then
    raise exception 'Changed another student';
  end if;
end $$;

set local role anon;
do $$ begin
  begin perform public.learn_set_reminders(false); raise exception 'Anonymous changed reminders';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
