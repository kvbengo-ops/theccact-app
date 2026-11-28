-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('e7a40000-0000-4000-8000-000000000001', 'exam-student@example.invalid'),
  ('e7a40000-0000-4000-8000-000000000002', 'exam-owner@example.invalid'),
  ('e7a40000-0000-4000-8000-000000000003', 'exam-outsider@example.invalid');
insert into private.admin_users (user_id) values ('e7a40000-0000-4000-8000-000000000002');
insert into public.courses (id, brand, title, status, lessons_in_order) values
  ('e7a4c000-0000-4000-8000-000000000001', 'ccact', 'Exam course', 'published', false);
insert into public.modules (id, course_id, title) values
  ('e7a4d000-0000-4000-8000-000000000001', 'e7a4c000-0000-4000-8000-000000000001', 'Module');
insert into public.lessons (id, module_id, title, position, exam, exam_minutes) values
  ('e7a4e000-0000-4000-8000-000000000001', 'e7a4d000-0000-4000-8000-000000000001', 'Recall', 1, null, null),
  ('e7a4e000-0000-4000-8000-000000000002', 'e7a4d000-0000-4000-8000-000000000001', 'Mock', 2, 'mock', 20),
  ('e7a4e000-0000-4000-8000-000000000003', 'e7a4d000-0000-4000-8000-000000000001', 'Final', 3, 'final', 30);
insert into public.questions (id, lesson_id, position, type, text, options, correct_answers, explanation, review_at) values
  ('e7a4f000-0000-4000-8000-000000000001', 'e7a4e000-0000-4000-8000-000000000001', 1, 'single', 'Q', '["a","b"]', '{0}', 'why', null),
  ('e7a4f000-0000-4000-8000-000000000002', 'e7a4e000-0000-4000-8000-000000000002', 1, 'single', 'M1', '["a","b"]', '{0}', 'mock why', 'Lecture 1'),
  ('e7a4f000-0000-4000-8000-000000000003', 'e7a4e000-0000-4000-8000-000000000003', 1, 'single', 'F1', '["a","b"]', '{0}', 'secret 1', 'Lecture 2'),
  ('e7a4f000-0000-4000-8000-000000000004', 'e7a4e000-0000-4000-8000-000000000003', 2, 'single', 'F2', '["a","b"]', '{0}', 'secret 2', 'Lecture 2'),
  ('e7a4f000-0000-4000-8000-000000000005', 'e7a4e000-0000-4000-8000-000000000003', 3, 'multiple', 'F3', '["a","b","c"]', '{0,2}', 'secret 3', 'Lecture 5');
insert into public.enrollments (user_id, course_id) values
  ('e7a40000-0000-4000-8000-000000000001', 'e7a4c000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e7a40000-0000-4000-8000-000000000001', true);
do $$
declare
  quick uuid := 'e7a4e000-0000-4000-8000-000000000001';
  mock uuid := 'e7a4e000-0000-4000-8000-000000000002';
  final uuid := 'e7a4e000-0000-4000-8000-000000000003';
  wrong jsonb := '{"e7a4f000-0000-4000-8000-000000000003": [1], "e7a4f000-0000-4000-8000-000000000004": [1]}';
  r jsonb;
  s record;
begin
  -- Quick checks still need every answer; exams accept blanks (the timer can submit them).
  begin perform public.learn_submit_check(quick, '{}'); raise exception 'Blank quick check accepted';
  exception when sqlstate '22023' then null; end;
  r := public.learn_submit_check(mock, '{}');
  if not r ? 'results' or (r->>'score')::int <> 0 then raise exception 'Mock should review a blank attempt: %', r; end if;

  select * into s from public.learn_exam_status(final);
  if s.exam <> 'final' or s.exam_minutes <> 30 or s.questions <> 3 or s.attempts_left <> 3 or s.passed then
    raise exception 'Bad starting status: %', s;
  end if;

  for i in 1..3 loop
    r := public.learn_submit_check(final, wrong);
    if r ? 'results' or r::text like '%secret%' then raise exception 'Final revealed answers: %', r; end if;
    if (r->>'attempts_left')::int <> 3 - i then raise exception 'Attempt % left %', i, r->>'attempts_left'; end if;
  end loop;
  if r->'review' <> '["Lecture 2", "Lecture 5"]'::jsonb then raise exception 'Review areas: %', r->'review'; end if;
  if (select array_length(review, 1) from public.quiz_attempts where lesson_id = final order by created_at desc limit 1) <> 3 then
    raise exception 'Review not saved with the attempt';
  end if;

  begin perform public.learn_submit_check(final, wrong); raise exception '4th final attempt accepted';
  exception when sqlstate '42501' then null; end;
  if (select attempts_left from public.learn_exam_status(final)) <> 0 then raise exception 'Status should show 0 left'; end if;
  if exists (select 1 from public.learn_report_needs_support('e7a4c000-0000-4000-8000-000000000001')) then
    raise exception 'Student read the owner report';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'e7a40000-0000-4000-8000-000000000003', true);
do $$ begin
  if exists (select 1 from public.learn_report_needs_support('e7a4c000-0000-4000-8000-000000000001')) then
    raise exception 'Outsider read the owner report';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'e7a40000-0000-4000-8000-000000000002', true);
do $$
declare s record;
begin
  select * into s from public.learn_report_needs_support('e7a4c000-0000-4000-8000-000000000001');
  if s.email <> 'exam-student@example.invalid' or s.attempts <> 3 or s.weak_areas[1] <> 'Lecture 2' then
    raise exception 'Bad needs-support row: %', s;
  end if;
  -- The owner allows 3 more (the console updates the enrollment directly).
  update public.enrollments set attempts_reset_at = now() + interval '1 second'
   where user_id = 'e7a40000-0000-4000-8000-000000000001';
  if exists (select 1 from public.learn_report_needs_support('e7a4c000-0000-4000-8000-000000000001')) then
    raise exception 'Student still listed after reset';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'e7a40000-0000-4000-8000-000000000001', true);
do $$
declare r jsonb;
begin
  if (select attempts_left from public.learn_exam_status('e7a4e000-0000-4000-8000-000000000003')) <> 3 then
    raise exception 'Reset should give 3 attempts back';
  end if;
  r :=public.learn_submit_check('e7a4e000-0000-4000-8000-000000000003',
    '{"e7a4f000-0000-4000-8000-000000000003": [0], "e7a4f000-0000-4000-8000-000000000004": [0], "e7a4f000-0000-4000-8000-000000000005": [2, 0]}');
  if not (r->>'passed')::boolean or (r->>'score')::int <> 100 then raise exception 'Should pass after reset: %', r; end if;
end $$;
