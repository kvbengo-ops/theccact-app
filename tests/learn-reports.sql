-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('1ea42000-0000-4000-8000-000000000001', 'report-owner@example.invalid'),
  ('1ea42000-0000-4000-8000-000000000002', 'report-finisher@example.invalid'),
  ('1ea42000-0000-4000-8000-000000000003', 'report-stopper@example.invalid');
insert into private.admin_users values ('1ea42000-0000-4000-8000-000000000001');
insert into public.courses (id, brand, title, status) values
  ('1ea42c00-0000-4000-8000-000000000001', 'cces', 'Report course', 'published');
insert into public.modules (id, course_id, title) values
  ('1ea42d00-0000-4000-8000-000000000001', '1ea42c00-0000-4000-8000-000000000001', 'Module');
insert into public.lessons (id, module_id, title, position) values
  ('1ea42e00-0000-4000-8000-000000000001', '1ea42d00-0000-4000-8000-000000000001', 'One', 1),
  ('1ea42e00-0000-4000-8000-000000000002', '1ea42d00-0000-4000-8000-000000000001', 'Two', 2);
insert into public.questions (id, lesson_id, type, text, options, correct_answers) values
  ('1ea42f00-0000-4000-8000-000000000001', '1ea42e00-0000-4000-8000-000000000001', 'single', 'Q', '["x","y"]', '{1}');
insert into public.enrollments (user_id, course_id) values
  ('1ea42000-0000-4000-8000-000000000002', '1ea42c00-0000-4000-8000-000000000001'),
  ('1ea42000-0000-4000-8000-000000000003', '1ea42c00-0000-4000-8000-000000000001');

-- The finisher fails once, passes, then finishes the last lesson.
set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea42000-0000-4000-8000-000000000002', true);
do $$ begin
  perform public.learn_submit_check('1ea42e00-0000-4000-8000-000000000001', '{"1ea42f00-0000-4000-8000-000000000001":[0]}');
  perform public.learn_submit_check('1ea42e00-0000-4000-8000-000000000001', '{"1ea42f00-0000-4000-8000-000000000001":[1]}');
  if (select count(*) from public.certificates) <> 0 then raise exception 'Certificate issued early'; end if;
  perform public.learn_mark_done('1ea42e00-0000-4000-8000-000000000002');
  perform public.learn_mark_done('1ea42e00-0000-4000-8000-000000000002');
  if (select count(*) from public.certificates) <> 1 then raise exception 'Certificate not issued once'; end if;
  if (select count(*) from public.learn_report_courses()) + (select count(*) from public.learn_report_students('1ea42c00-0000-4000-8000-000000000001'))
     + (select count(*) from public.learn_report_lessons('1ea42c00-0000-4000-8000-000000000001'))
     + (select count(*) from public.learn_report_questions('1ea42c00-0000-4000-8000-000000000001')) <> 0 then
    raise exception 'Student can read reports';
  end if;
  perform set_config('learn.test_number', (select number from public.certificates), true);
end $$;

set local role anon;
do $$ declare r record; begin
  select * into r from public.learn_verify_certificate(lower(current_setting('learn.test_number')));
  if not r.valid or r.course_title <> 'Report course' or r.brand <> 'cces' then raise exception 'Verify failed: %', r; end if;
  if (select valid from public.learn_verify_certificate('NOPE')) then raise exception 'Unknown number verified'; end if;
  begin perform public.learn_report_courses(); raise exception 'Anonymous ran a report';
  exception when insufficient_privilege then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea42000-0000-4000-8000-000000000001', true);
do $$ declare r record; course uuid := '1ea42c00-0000-4000-8000-000000000001'; begin
  select * into r from public.learn_report_courses() where course_id = course;
  if (r.enrolled, r.active_week, r.completed, r.completion_rate) is distinct from (2::bigint, 1::bigint, 1::bigint, 50.0) then
    raise exception 'Course report wrong: %', r;
  end if;
  if (select array_agg(array[reached, done, stopped_here]) from public.learn_report_lessons(course)) <> '{{2,1,1},{1,1,0}}' then
    raise exception 'Lesson report wrong';
  end if;
  select * into r from public.learn_report_questions(course);
  if (r.attempts, r.wrong, r.wrong_share) is distinct from (2::bigint, 1::bigint, 50.0) then
    raise exception 'Question report wrong: %', r;
  end if;
  select * into r from public.learn_report_students(course) where email = 'report-finisher@example.invalid';
  if r.done_lessons <> 2 or r.total_lessons <> 2 or r.attempts <> 2 or r.average_score <> 50.0 or r.completed_at is null then
    raise exception 'Student report wrong: %', r;
  end if;
  if (select count(*) from public.learn_report_students(course)) <> 2 then raise exception 'Student missing'; end if;
end $$;
reset role;
