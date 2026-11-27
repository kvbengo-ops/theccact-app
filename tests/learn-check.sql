-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('1ea41000-0000-4000-8000-000000000001', 'check-student@example.invalid'),
  ('1ea41000-0000-4000-8000-000000000002', 'check-outsider@example.invalid');
insert into public.courses (id, brand, title, status) values
  ('1ea41c00-0000-4000-8000-000000000001', 'ccact', 'Check course', 'published');
insert into public.modules (id, course_id, title) values
  ('1ea41d00-0000-4000-8000-000000000001', '1ea41c00-0000-4000-8000-000000000001', 'Module');
insert into public.lessons (id, module_id, title, position) values
  ('1ea41e00-0000-4000-8000-000000000001', '1ea41d00-0000-4000-8000-000000000001', 'One', 1),
  ('1ea41e00-0000-4000-8000-000000000002', '1ea41d00-0000-4000-8000-000000000001', 'Two', 2);
insert into public.questions (id, lesson_id, position, type, text, options, correct_answers, explanation, review_at) values
  ('1ea41f00-0000-4000-8000-000000000001', '1ea41e00-0000-4000-8000-000000000001', 1, 'single', 'A', '["x","y"]', '{1}', 'why A', '00:10'),
  ('1ea41f00-0000-4000-8000-000000000002', '1ea41e00-0000-4000-8000-000000000001', 2, 'multiple', 'B', '["x","y","z"]', '{0,2}', 'why B', '00:20'),
  ('1ea41f00-0000-4000-8000-000000000003', '1ea41e00-0000-4000-8000-000000000001', 3, 'true_false', 'C', '["True","False"]', '{0}', 'why C', null);
insert into public.enrollments (user_id, course_id) values
  ('1ea41000-0000-4000-8000-000000000001', '1ea41c00-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea41000-0000-4000-8000-000000000001', true);
do $$
declare
  one uuid := '1ea41e00-0000-4000-8000-000000000001';
  two uuid := '1ea41e00-0000-4000-8000-000000000002';
  a text := '1ea41f00-0000-4000-8000-000000000001';
  b text := '1ea41f00-0000-4000-8000-000000000002';
  c text := '1ea41f00-0000-4000-8000-000000000003';
  r jsonb;
begin
  begin perform public.learn_submit_check(one, '{}'); raise exception 'Empty submission marked';
  exception when invalid_parameter_value then null; end;
  begin perform public.learn_submit_check(two, '{}'); raise exception 'Locked lesson marked';
  exception when insufficient_privilege then null; end;

  -- 1 of 3, partial multiple choice counts as wrong.
  r := public.learn_submit_check(one, jsonb_build_object(a, '[1]'::jsonb, b, '[0]'::jsonb, c, '[1]'::jsonb));
  if (r ->> 'passed')::boolean or (r ->> 'score')::int <> 33 then raise exception 'Failing score wrong: %', r; end if;
  if r -> 'results' -> 1 ->> 'review_at' <> '00:20' or r -> 'results' -> 0 ->> 'review_at' is not null then
    raise exception 'Review pointer wrong: %', r;
  end if;
  if r::text like '%correct_answers%' then raise exception 'Answers exposed'; end if;
  if (select done from public.learn_course_outline('1ea41c00-0000-4000-8000-000000000001') limit 1) then
    raise exception 'Failed check marked done';
  end if;

  -- 2 of 3 passes at the default pass mark; order of picks does not matter.
  r := public.learn_submit_check(one, jsonb_build_object(a, '[1]'::jsonb, b, '[2,0]'::jsonb, c, '[1]'::jsonb));
  if not (r ->> 'passed')::boolean or (r ->> 'score')::int <> 66 then raise exception '2 of 3 did not pass: %', r; end if;
  perform public.learn_lesson(two);
  if (select count(*) from public.quiz_attempts) <> 2 then raise exception 'Attempts not saved'; end if;

  begin perform public.learn_submit_check(two, '{}'); raise exception 'Marked a lesson without a check';
  exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claim.sub', '1ea41000-0000-4000-8000-000000000002', true);
do $$ begin
  begin
    perform public.learn_submit_check('1ea41e00-0000-4000-8000-000000000001', '{}');
    raise exception 'Unenrolled student marked';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
do $$ begin
  begin
    perform public.learn_submit_check('1ea41e00-0000-4000-8000-000000000001', '{}');
    raise exception 'Anonymous marked';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
