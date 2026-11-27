-- Test checkout: a student "buys" a course on the website and is enrolled. No payment is taken.
-- Only courses the owner marks self_enroll can be bought this way; every other course is still sold on Teachable.
-- Requires 202611270001_learn_schema.sql.

alter table public.courses add column self_enroll boolean not null default false;

-- Public: what the checkout page shows before sign-in.
create function public.learn_checkout_course(p_course uuid)
returns table (course_id uuid, brand text, title text, description text, image text, total_lessons bigint, total_minutes bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, c.brand, c.title, c.description, c.image, count(l.id), coalesce(sum(l.length_minutes), 0)
    from public.courses c
    left join public.modules m on m.course_id = c.id
    left join public.lessons l on l.module_id = m.id
   where c.id = p_course and c.status = 'published' and c.self_enroll
   group by c.id
$$;
revoke all on function public.learn_checkout_course(uuid) from public;
grant execute on function public.learn_checkout_course(uuid) to anon, authenticated;

-- The signed-in buyer enrolls themselves. A removed enrollment is restored; an owner-set name is kept.
create function public.learn_self_enroll(p_course uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.courses c where c.id = p_course and c.status = 'published' and c.self_enroll) then
    raise exception 'Course not available' using errcode = '42501';
  end if;
  insert into public.enrollments as e (user_id, course_id, student_name, status, enrolled_by)
  values (auth.uid(), p_course, nullif(left(btrim(coalesce(p_name, '')), 120), ''), 'active', auth.uid())
  on conflict (user_id, course_id)
  do update set status = 'active', student_name = coalesce(e.student_name, excluded.student_name);
end $$;
revoke all on function public.learn_self_enroll(uuid, text) from public, anon;
grant execute on function public.learn_self_enroll(uuid, text) to authenticated;
