-- Mock and final exams on top of quick checks.
-- A lesson can be a mock exam (timed, unlimited attempts, full review) or the final exam (timed, 3 attempts,
-- score and areas to review only). After 3 failed finals the student is locked until the owner allows 3 more.
-- Requires 202611270002_learn_mark_check.sql (replaces learn_submit_check, same signature).

alter table public.lessons
  add column exam text check (exam in ('mock', 'final')),
  add column exam_minutes int check (exam_minutes > 0);
alter table public.enrollments add column attempts_reset_at timestamptz;
-- The review pointers of the wrong answers, saved with each attempt for the owner's "weak areas".
alter table public.quiz_attempts add column review text[] not null default '{}';

-- The one place the final-exam attempt rule lives: failed attempts since the owner last allowed more.
create function private.failed_final_attempts(p_user uuid, p_lesson uuid, p_course uuid)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int
    from public.quiz_attempts a
   where a.user_id = p_user and a.lesson_id = p_lesson and not a.passed
     and a.created_at > coalesce((select e.attempts_reset_at from public.enrollments e
                                   where e.user_id = p_user and e.course_id = p_course), '-infinity')
$$;
revoke all on function private.failed_final_attempts(uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.learn_submit_check(p_lesson uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  course uuid := private.open_lesson(p_lesson);
  kind text;
  q public.questions;
  picked jsonb;
  is_right boolean;
  total int := 0;
  right_count int := 0;
  results jsonb := '[]';
  review text[] := '{}';
  pass int;
  has_passed boolean;
  pct int;
  failed int;
begin
  select s.exam into kind from public.lessons s where s.id = p_lesson;
  if kind = 'final' then
    failed := private.failed_final_attempts(auth.uid(), p_lesson, course);
    if failed >= 3 and not exists (select 1 from public.quiz_attempts a
                                    where a.user_id = auth.uid() and a.lesson_id = p_lesson and a.passed) then
      raise exception 'No attempts left' using errcode = '42501', hint = 'no_attempts';
    end if;
  end if;

  for q in select * from public.questions where lesson_id = p_lesson order by position, id loop
    picked := p_answers -> q.id::text;
    if picked is null or jsonb_typeof(picked) <> 'array' or jsonb_array_length(picked) = 0 then
      -- Quick checks need every answer, so an empty submission cannot read the explanations.
      -- Exams can be submitted by the timer, so a blank counts as wrong.
      if kind is null then
        raise exception 'Answer every question' using errcode = '22023';
      end if;
      is_right := false;
    else
      is_right := array(select distinct v::int from jsonb_array_elements_text(picked) v order by 1)
                = array(select distinct v from unnest(q.correct_answers) v order by 1);
    end if;
    total := total + 1;
    right_count := right_count + is_right::int;
    if not is_right and q.review_at is not null then
      review := review || q.review_at;
    end if;
    results := results || jsonb_build_object(
      'question_id', q.id, 'correct', is_right, 'explanation', q.explanation,
      'review_at', case when is_right then null else q.review_at end);
  end loop;
  if total = 0 then
    raise exception 'This lesson has no quick check' using errcode = '22023';
  end if;

  select c.pass_mark into pass from public.courses c where c.id = course;
  has_passed := right_count * 100 >= pass * total;
  pct := right_count * 100 / total;

  insert into public.quiz_attempts (user_id, lesson_id, answers, score, passed, review)
  values (auth.uid(), p_lesson, p_answers, pct, has_passed, review);
  if has_passed then
    insert into public.lesson_progress as p (user_id, lesson_id, done_at)
    values (auth.uid(), p_lesson, now())
    on conflict (user_id, lesson_id)
    do update set done_at = coalesce(p.done_at, now()), updated_at = now();
  end if;

  -- The final's question set is fixed across attempts, so it never reveals which answers were right.
  if kind = 'final' then
    return jsonb_build_object('score', pct, 'passed', has_passed,
      'review', (select coalesce(jsonb_agg(distinct r), '[]') from unnest(review) r),
      'attempts_left', greatest(0, 3 - private.failed_final_attempts(auth.uid(), p_lesson, course)));
  end if;
  return jsonb_build_object('score', pct, 'passed', has_passed, 'results', results);
end $$;

-- What the exam screen needs before starting.
create function public.learn_exam_status(p_lesson uuid)
returns table (exam text, exam_minutes int, questions bigint, attempts_used int, attempts_left int, passed boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  course uuid := private.open_lesson(p_lesson);
  failed int := private.failed_final_attempts(auth.uid(), p_lesson, course);
begin
  return query
    select s.exam, s.exam_minutes,
           (select count(*) from public.questions q where q.lesson_id = s.id),
           failed,
           case when s.exam = 'final' then greatest(0, 3 - failed) end,
           exists (select 1 from public.quiz_attempts a where a.user_id = auth.uid() and a.lesson_id = s.id and a.passed)
      from public.lessons s
     where s.id = p_lesson;
end $$;
revoke all on function public.learn_exam_status(uuid) from public, anon;
grant execute on function public.learn_exam_status(uuid) to authenticated;

-- Owner: students locked out of a course's final exam, with the areas they missed most.
create function public.learn_report_needs_support(p_course uuid)
returns table (
  user_id uuid, email text, student_name text, attempts int, best_score int,
  last_attempt timestamptz, weak_areas text[]
)
language sql stable security definer set search_path = '' as $$
  select e.user_id, u.email::text, e.student_name, f.failed, a.best, a.last,
         array(select r from public.quiz_attempts x cross join unnest(x.review) r
                where x.user_id = e.user_id and x.lesson_id = l.id and not x.passed
                group by r order by count(*) desc, r limit 5)
    from public.enrollments e
    join auth.users u on u.id = e.user_id
    join public.modules m on m.course_id = e.course_id
    join public.lessons l on l.module_id = m.id and l.exam = 'final'
   cross join lateral (select private.failed_final_attempts(e.user_id, l.id, e.course_id) as failed) f
   cross join lateral (select max(x.score) as best, max(x.created_at) as last
                         from public.quiz_attempts x where x.user_id = e.user_id and x.lesson_id = l.id) a
   where e.course_id = p_course and e.status = 'active' and public.is_admin() and f.failed >= 3
     and not exists (select 1 from public.quiz_attempts p where p.user_id = e.user_id and p.lesson_id = l.id and p.passed)
   order by a.last desc
$$;
revoke all on function public.learn_report_needs_support(uuid) from public, anon;
grant execute on function public.learn_report_needs_support(uuid) to authenticated;
