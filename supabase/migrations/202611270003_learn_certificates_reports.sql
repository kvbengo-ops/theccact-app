-- Certificate issuing, the public verify lookup (L08) and the owner's reports (L10).
-- Requires 202611270001_learn_schema.sql. Practice exams are phase 5 and will tighten the completion rule.

-- Issue a certificate when the last lesson of a course is done.
-- ponytail: fires on lesson completion only; if the owner deletes a lesson so that a student becomes complete,
-- no certificate is issued until they finish another lesson. Add an owner "issue missing" action if that happens.
create function private.issue_certificate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  course uuid;
begin
  select m.course_id into course
    from public.lessons l join public.modules m on m.id = l.module_id
   where l.id = new.lesson_id;
  if exists (
    select 1 from public.enrollments e join public.courses c on c.id = e.course_id
     where e.user_id = new.user_id and e.course_id = course and e.status = 'active' and c.status <> 'draft'
  ) and not exists (
    select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = new.user_id
     where m.course_id = course and p.done_at is null
  ) then
    insert into public.certificates (user_id, course_id) values (new.user_id, course)
    on conflict (user_id, course_id) do nothing;
  end if;
  return null;
end $$;
revoke all on function private.issue_certificate() from public, anon, authenticated;
create trigger lesson_progress_issue_certificate
  after insert or update of done_at on public.lesson_progress
  for each row when (new.done_at is not null)
  execute function private.issue_certificate();

-- Public: confirms a certificate number is genuine without revealing the student.
create function public.learn_verify_certificate(p_number text)
returns table (valid boolean, course_title text, brand text, issued_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select cert.number is not null, c.title, c.brand, cert.issued_at
    from (select upper(btrim(p_number)) as number) asked
    left join public.certificates cert on cert.number = asked.number
    left join public.courses c on c.id = cert.course_id
$$;
revoke all on function public.learn_verify_certificate(text) from public;
grant execute on function public.learn_verify_certificate(text) to anon, authenticated;

-- Owner reports. Anyone who is not the owner gets no rows. "Enrolled" means active enrollments.
-- Active: saved progress or tried a quick check in the last 7 days.
create function public.learn_report_courses()
returns table (
  course_id uuid, brand text, title text, status text,
  enrolled bigint, active_week bigint, completed bigint, completion_rate numeric
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.brand, c.title, c.status,
         count(e.user_id),
         count(e.user_id) filter (where exists (
           select 1 from public.lessons l
             join public.modules m on m.id = l.module_id and m.course_id = c.id
            where exists (select 1 from public.lesson_progress p
                           where p.lesson_id = l.id and p.user_id = e.user_id and p.updated_at > now() - interval '7 days')
               or exists (select 1 from public.quiz_attempts a
                           where a.lesson_id = l.id and a.user_id = e.user_id and a.created_at > now() - interval '7 days'))),
         count(cert.number),
         round(100.0 * count(cert.number) / nullif(count(e.user_id), 0), 1)
    from public.courses c
    left join public.enrollments e on e.course_id = c.id and e.status = 'active'
    left join public.certificates cert on cert.course_id = c.id and cert.user_id = e.user_id
   where public.is_admin()
   group by c.id
   order by c.title, c.id
$$;

-- Per lesson, in course order. stopped_here: students whose first unfinished lesson this is.
-- reached: students who finished it or stopped at it.
create function public.learn_report_lessons(p_course uuid)
returns table (lesson_id uuid, module_title text, lesson_title text, reached bigint, done bigint, stopped_here bigint)
language sql stable security definer set search_path = '' as $$
  with l as (
    select s.id, m.title as module_title, s.title,
           row_number() over (order by m.position, m.id, s.position, s.id) as n
      from public.modules m join public.lessons s on s.module_id = m.id
     where m.course_id = p_course and public.is_admin()
  ), s as (
    select l.id as lesson_id, l.n, e.user_id, p.done_at is not null as done
      from l
      join public.enrollments e on e.course_id = p_course and e.status = 'active'
      left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = e.user_id
  ), stopped as (
    select s.user_id, min(s.n) as n from s where not s.done group by s.user_id
  )
  select l.id, l.module_title, l.title,
         count(s.user_id) filter (where s.done or stopped.n = l.n),
         count(s.user_id) filter (where s.done),
         count(s.user_id) filter (where stopped.n = l.n)
    from l
    left join s on s.lesson_id = l.id
    left join stopped on stopped.user_id = s.user_id
   group by l.id, l.module_title, l.title, l.n
   order by l.n
$$;

-- Per question: share of attempts answered wrongly, worst first.
-- Marked against the current correct answers, so editing a question shifts its history.
create function public.learn_report_questions(p_course uuid)
returns table (question_id uuid, lesson_id uuid, lesson_title text, question text, attempts bigint, wrong bigint, wrong_share numeric)
language sql stable security definer set search_path = '' as $$
  select q.id, s.id, s.title, q.text,
         count(a.id),
         count(a.id) filter (where not r.is_right),
         round(100.0 * count(a.id) filter (where not r.is_right) / nullif(count(a.id), 0), 1)
    from public.modules m
    join public.lessons s on s.module_id = m.id
    join public.questions q on q.lesson_id = s.id
    left join public.quiz_attempts a on a.lesson_id = s.id and jsonb_typeof(a.answers -> q.id::text) = 'array'
    left join lateral (
      select array(select distinct v::int from jsonb_array_elements_text(a.answers -> q.id::text) v order by 1)
           = array(select distinct v from unnest(q.correct_answers) v order by 1) as is_right
    ) r on a.id is not null
   where m.course_id = p_course and public.is_admin()
   group by q.id, s.id
   order by 7 desc nulls last, q.id
$$;

create function public.learn_report_students(p_course uuid)
returns table (
  user_id uuid, email text, student_name text, done_lessons bigint, total_lessons bigint,
  attempts bigint, average_score numeric, last_active timestamptz, completed_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  with l as (
    select s.id from public.modules m join public.lessons s on s.module_id = m.id where m.course_id = p_course
  )
  select e.user_id, u.email::text, e.student_name,
         p.done, (select count(*) from l), a.attempts, a.average,
         greatest(p.last, a.last), cert.issued_at
    from public.enrollments e
    join auth.users u on u.id = e.user_id
   cross join lateral (
     select count(*) filter (where done_at is not null) as done, max(updated_at) as last
       from public.lesson_progress where user_id = e.user_id and lesson_id in (select id from l)
   ) p
   cross join lateral (
     select count(*) as attempts, round(avg(score), 1) as average, max(created_at) as last
       from public.quiz_attempts where user_id = e.user_id and lesson_id in (select id from l)
   ) a
    left join public.certificates cert on cert.course_id = e.course_id and cert.user_id = e.user_id
   where e.course_id = p_course and e.status = 'active' and public.is_admin()
   order by u.email
$$;

do $$
declare f text;
begin
  foreach f in array array['learn_report_courses()', 'learn_report_lessons(uuid)',
                           'learn_report_questions(uuid)', 'learn_report_students(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
