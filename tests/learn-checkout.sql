-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values ('1ea44000-0000-4000-8000-000000000001', 'checkout-buyer@example.invalid');
insert into public.courses (id, brand, title, status, self_enroll) values
  ('1ea44c00-0000-4000-8000-000000000001', 'ccact', 'For sale here', 'published', true),
  ('1ea44c00-0000-4000-8000-000000000002', 'ccact', 'Teachable only', 'published', false),
  ('1ea44c00-0000-4000-8000-000000000003', 'ccact', 'Draft', 'draft', true);
insert into public.modules (id, course_id, title) values
  ('1ea44d00-0000-4000-8000-000000000001', '1ea44c00-0000-4000-8000-000000000001', 'M');
insert into public.lessons (module_id, title, length_minutes) values
  ('1ea44d00-0000-4000-8000-000000000001', 'A', 5),
  ('1ea44d00-0000-4000-8000-000000000001', 'B', 7);

set local role anon;
do $$ begin
  if (select total_lessons || '/' || total_minutes from public.learn_checkout_course('1ea44c00-0000-4000-8000-000000000001')) <> '2/12' then
    raise exception 'Checkout summary wrong';
  end if;
  if exists (select 1 from public.learn_checkout_course('1ea44c00-0000-4000-8000-000000000002'))
     or exists (select 1 from public.learn_checkout_course('1ea44c00-0000-4000-8000-000000000003')) then
    raise exception 'Non-checkout course shown';
  end if;
  begin perform public.learn_self_enroll('1ea44c00-0000-4000-8000-000000000001', 'X'); raise exception 'Anonymous enrolled';
  exception when insufficient_privilege then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea44000-0000-4000-8000-000000000001', true);
do $$ begin
  begin perform public.learn_self_enroll('1ea44c00-0000-4000-8000-000000000002', 'X'); raise exception 'Enrolled in a Teachable-only course';
  exception when insufficient_privilege then null; end;
  begin perform public.learn_self_enroll('1ea44c00-0000-4000-8000-000000000003', 'X'); raise exception 'Enrolled in a draft';
  exception when insufficient_privilege then null; end;
  perform public.learn_self_enroll('1ea44c00-0000-4000-8000-000000000001', '  Ana Cruz  ');
  perform public.learn_self_enroll('1ea44c00-0000-4000-8000-000000000001', 'Someone Else');
  if (select count(*) from public.learn_my_courses()) <> 1 then raise exception 'Not enrolled once'; end if;
  if (select student_name from public.enrollments) <> 'Ana Cruz' then raise exception 'Name wrong or overwritten'; end if;
end $$;
reset role;
