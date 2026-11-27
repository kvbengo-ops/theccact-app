-- Run the migration and this test in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('1ea40000-0000-4000-8000-000000000001', 'learn-owner@example.invalid'),
  ('1ea40000-0000-4000-8000-000000000002', 'learn-student-a@example.invalid'),
  ('1ea40000-0000-4000-8000-000000000003', 'learn-student-b@example.invalid');
insert into private.admin_users values ('1ea40000-0000-4000-8000-000000000001');
insert into public.courses (id, brand, title, status) values
  ('1ea4c000-0000-4000-8000-000000000001', 'ccact', 'Test course', 'published'),
  ('1ea4c000-0000-4000-8000-000000000002', 'ccact', 'Draft course', 'draft');
insert into public.modules (id, course_id, title) values
  ('1ea4d000-0000-4000-8000-000000000001', '1ea4c000-0000-4000-8000-000000000001', 'Module');
insert into public.lessons (id, module_id, title, position, reading) values
  ('1ea4e000-0000-4000-8000-000000000001', '1ea4d000-0000-4000-8000-000000000001', 'One', 1, 'a'),
  ('1ea4e000-0000-4000-8000-000000000002', '1ea4d000-0000-4000-8000-000000000001', 'Two', 2, 'b'),
  ('1ea4e000-0000-4000-8000-000000000003', '1ea4d000-0000-4000-8000-000000000001', 'Three', 3, 'c');
insert into public.questions (lesson_id, type, text, options, correct_answers, explanation) values
  ('1ea4e000-0000-4000-8000-000000000002', 'single', 'Q', '["x","y"]', '{1}', 'secret');
insert into public.enrollments (user_id, course_id) values
  ('1ea40000-0000-4000-8000-000000000002', '1ea4c000-0000-4000-8000-000000000001'),
  ('1ea40000-0000-4000-8000-000000000002', '1ea4c000-0000-4000-8000-000000000002');
insert into public.certificates (user_id, course_id) values
  ('1ea40000-0000-4000-8000-000000000002', '1ea4c000-0000-4000-8000-000000000002');

-- Student A: enrolled.
set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea40000-0000-4000-8000-000000000002', true);
do $$
declare
  one uuid := '1ea4e000-0000-4000-8000-000000000001';
  two uuid := '1ea4e000-0000-4000-8000-000000000002';
  three uuid := '1ea4e000-0000-4000-8000-000000000003';
  course uuid := '1ea4c000-0000-4000-8000-000000000001';
  n int;
begin
  if (select count(*) from public.courses) + (select count(*) from public.modules)
     + (select count(*) from public.lessons) + (select count(*) from public.questions) <> 0 then
    raise exception 'Student can read content tables directly';
  end if;
  if (select count(*) from public.learn_my_courses()) <> 1 then raise exception 'Draft shown or course missing'; end if;
  if (select next_lesson_id from public.learn_my_courses()) <> one then raise exception 'Wrong next lesson'; end if;
  if (select array_agg(unlocked) from public.learn_course_outline(course)) <> '{t,f,f}' then
    raise exception 'Wrong initial locks';
  end if;
  begin perform public.learn_lesson(two); raise exception 'Opened a locked lesson';
  exception when insufficient_privilege then null; end;
  begin perform public.learn_questions(two); raise exception 'Read locked questions';
  exception when insufficient_privilege then null; end;
  begin perform public.learn_mark_done(three); raise exception 'Marked a locked lesson done';
  exception when insufficient_privilege then null; end;

  perform public.learn_save_position(one, 42);
  if (select video_position from public.learn_lesson(one)) <> 42 then raise exception 'Position not saved'; end if;
  perform public.learn_mark_done(one);
  if (select array_agg(unlocked) from public.learn_course_outline(course)) <> '{t,t,f}' then
    raise exception 'Next lesson did not unlock';
  end if;
  if (select done_lessons from public.learn_my_courses()) <> 1 then raise exception 'Wrong progress'; end if;
  if (select to_jsonb(q) from public.learn_questions(two) q) ?| array['correct_answers', 'explanation'] then
    raise exception 'Answers exposed';
  end if;
  begin perform public.learn_mark_done(two); raise exception 'Skipped the quick check';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.lesson_progress (user_id, lesson_id, done_at) values (auth.uid(), two, now());
    raise exception 'Student wrote progress';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.quiz_attempts (user_id, lesson_id, answers, score, passed) values (auth.uid(), two, '{}', 100, true);
    raise exception 'Student wrote a score';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.certificates (user_id, course_id) values (auth.uid(), course);
    raise exception 'Student issued a certificate';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.enrollments (user_id, course_id) values (auth.uid(), course);
    raise exception 'Student enrolled themselves';
  exception when insufficient_privilege then null; end;
  update public.lesson_progress set done_at = now();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Student updated progress'; end if;
end $$;

-- Student B: not enrolled.
select set_config('request.jwt.claim.sub', '1ea40000-0000-4000-8000-000000000003', true);
do $$ begin
  if (select count(*) from public.enrollments) + (select count(*) from public.lesson_progress)
     + (select count(*) from public.certificates) <> 0 then
    raise exception 'Student B can read student A';
  end if;
  if (select count(*) from public.learn_my_courses()) <> 0 then raise exception 'Unenrolled sees a course'; end if;
  if (select count(*) from public.learn_course_outline('1ea4c000-0000-4000-8000-000000000001')) <> 0 then
    raise exception 'Unenrolled sees the outline';
  end if;
  begin perform public.learn_lesson('1ea4e000-0000-4000-8000-000000000001'); raise exception 'Unenrolled opened a lesson';
  exception when insufficient_privilege then null; end;
end $$;

-- Signed out: nothing.
set local role anon;
do $$ begin
  begin perform public.learn_my_courses(); raise exception 'Anonymous can call student functions';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.courses; raise exception 'Anonymous can read courses';
  exception when insufficient_privilege then null; end;
end $$;

-- Owner: full access.
set local role authenticated;
select set_config('request.jwt.claim.sub', '1ea40000-0000-4000-8000-000000000001', true);
do $$ begin
  if (select count(*) from public.questions where explanation = 'secret') <> 1 then raise exception 'Owner cannot read'; end if;
  update public.courses set status = 'archived' where id = '1ea4c000-0000-4000-8000-000000000001';
  if not found then raise exception 'Owner cannot write'; end if;
end $$;
reset role;
