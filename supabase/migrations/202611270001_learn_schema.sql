-- Learning platform: courses, enrollments, progress and certificates.
-- Tables are for the owner (is_admin) and server code; students may read their own rows only.
-- Students read course content through the learn_* functions below, which enforce enrollment and lesson order.
-- Requires 202611200006_admin_profile_cms.sql (public.is_admin). Practice exams (question bank, topics) are phase 5.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('ccact', 'cces')),
  title text not null check (length(btrim(title)) between 1 and 200),
  description text not null default '',
  image text check (image is null or image like 'https://%'),
  ce_hours numeric(5,1) check (ce_hours > 0),
  -- Percent of quick-check questions needed. 66, not 70, so that 2 out of 3 passes.
  pass_mark int not null default 66 check (pass_mark between 1 and 100),
  lessons_in_order boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  position int not null default 0
);
create index on public.modules (course_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  position int not null default 0,
  video_id text,
  reading text,
  files jsonb not null default '[]' check (jsonb_typeof(files) = 'array'),
  length_minutes int not null default 5 check (length_minutes > 0)
);
create index on public.lessons (module_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position int not null default 0,
  type text not null check (type in ('single', 'multiple', 'true_false')),
  text text not null check (length(btrim(text)) > 0),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  -- Zero-based indexes into options.
  correct_answers int[] not null check (cardinality(correct_answers) >= 1 and 0 <= all (correct_answers)),
  explanation text not null default '',
  review_at text,
  constraint correct_in_options check (jsonb_array_length(options) > all (correct_answers)),
  constraint one_answer_unless_multiple check (type = 'multiple' or cardinality(correct_answers) = 1)
);
create index on public.questions (lesson_id);

create table public.enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  -- Printed on the certificate. Set by the owner, not editable by the student.
  student_name text check (length(btrim(student_name)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'removed')),
  reminders_off boolean not null default false,
  enrolled_at timestamptz not null default now(),
  enrolled_by uuid references auth.users(id) on delete set null,
  primary key (user_id, course_id)
);
create index on public.enrollments (course_id);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  video_position int not null default 0 check (video_position >= 0),
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index on public.lesson_progress (lesson_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  answers jsonb not null,
  score int not null check (score between 0 and 100),
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts (user_id, lesson_id);
create index on public.quiz_attempts (lesson_id);

create table public.certificates (
  number text primary key default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- No cascade: a course with issued certificates is archived, not deleted.
  course_id uuid not null references public.courses(id),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  type text not null check (type in ('welcome', 'halfway', 'miss_you', 'almost_there', 'certificate')),
  sent_at timestamptz not null default now()
);
create index on public.email_log (user_id, course_id, type);

-- Row-level security: the owner does everything; students read their own rows and write nothing.
do $$
declare t text;
begin
  foreach t in array array['courses', 'modules', 'lessons', 'questions', 'enrollments',
                           'lesson_progress', 'quiz_attempts', 'certificates', 'email_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy "Owner manages" on public.%I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
  foreach t in array array['enrollments', 'lesson_progress', 'quiz_attempts', 'certificates'] loop
    execute format('create policy "Students read their own" on public.%I for select to authenticated
                    using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Enrolled and not a draft. Archived courses stay open to students already enrolled.
create function private.enrolled(p_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
      join public.courses c on c.id = e.course_id
     where e.user_id = auth.uid() and e.course_id = p_course
       and e.status = 'active' and c.status <> 'draft'
  )
$$;

-- Every lesson of a course in order, with the caller's done and unlocked state.
-- Unlocked: order is off, or it is the first, or it or the lesson before it is done.
create function private.outline(p_course uuid)
returns table (
  module_id uuid, module_title text, lesson_id uuid, lesson_title text,
  length_minutes int, n bigint, done boolean, unlocked boolean
)
language sql stable security definer set search_path = '' as $$
  with l as (
    select m.id as module_id, m.title as module_title, s.id as lesson_id, s.title as lesson_title,
           s.length_minutes, row_number() over (order by m.position, m.id, s.position, s.id) as n,
           p.done_at is not null as done, c.lessons_in_order
      from public.courses c
      join public.modules m on m.course_id = c.id
      join public.lessons s on s.module_id = m.id
      left join public.lesson_progress p on p.lesson_id = s.id and p.user_id = auth.uid()
     where c.id = p_course
  )
  select l.module_id, l.module_title, l.lesson_id, l.lesson_title, l.length_minutes, l.n, l.done,
         not l.lessons_in_order or l.done or coalesce(lag(l.done) over (order by l.n), true)
    from l
   order by l.n
$$;

-- The caller's course for a lesson, or an error if not enrolled or the lesson is still locked.
create function private.open_lesson(p_lesson uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  course uuid;
begin
  select m.course_id into course
    from public.lessons s join public.modules m on m.id = s.module_id
   where s.id = p_lesson;
  if course is null or not private.enrolled(course) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from private.outline(course) o where o.lesson_id = p_lesson and o.unlocked) then
    raise exception 'Lesson locked' using errcode = '42501';
  end if;
  return course;
end $$;
revoke all on function private.enrolled(uuid), private.outline(uuid), private.open_lesson(uuid)
  from public, anon, authenticated;

-- Dashboard and course header. Returns both brands: the site filters on brand.
create function public.learn_my_courses()
returns table (
  course_id uuid, brand text, title text, description text, image text,
  total_minutes bigint, total_lessons bigint, done_lessons bigint,
  next_lesson_id uuid, certificate_number text
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.brand, c.title, c.description, c.image,
         t.minutes, t.total, t.done, t.next_id, cert.number
    from public.courses c
    join public.enrollments e on e.course_id = c.id and e.user_id = auth.uid() and e.status = 'active'
   cross join lateral (
     select coalesce(sum(o.length_minutes), 0) as minutes, count(*) as total,
            count(*) filter (where o.done) as done,
            (array_agg(o.lesson_id order by o.n) filter (where not o.done))[1] as next_id
       from private.outline(c.id) o
   ) t
    left join public.certificates cert on cert.course_id = c.id and cert.user_id = e.user_id
   where c.status <> 'draft'
   order by e.enrolled_at, c.id
$$;

create function public.learn_course_outline(p_course uuid)
returns table (
  module_id uuid, module_title text, lesson_id uuid, lesson_title text,
  length_minutes int, done boolean, unlocked boolean
)
language sql stable security definer set search_path = '' as $$
  select o.module_id, o.module_title, o.lesson_id, o.lesson_title, o.length_minutes, o.done, o.unlocked
    from private.outline(p_course) o
   where private.enrolled(p_course)
   order by o.n
$$;

create function public.learn_lesson(p_lesson uuid)
returns table (
  lesson_id uuid, course_id uuid, title text, video_id text, reading text, files jsonb,
  video_position int, done boolean, has_check boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  course uuid := private.open_lesson(p_lesson);
begin
  return query
    select s.id, course, s.title, s.video_id, s.reading, s.files,
           coalesce(p.video_position, 0), p.done_at is not null,
           exists (select 1 from public.questions q where q.lesson_id = s.id)
      from public.lessons s
      left join public.lesson_progress p on p.lesson_id = s.id and p.user_id = auth.uid()
     where s.id = p_lesson;
end $$;

-- Quick-check questions without correct answers or explanations.
create function public.learn_questions(p_lesson uuid)
returns table (question_id uuid, type text, text text, options jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.open_lesson(p_lesson);
  return query
    select q.id, q.type, q.text, q.options from public.questions q
     where q.lesson_id = p_lesson order by q.position, q.id;
end $$;

create function public.learn_save_position(p_lesson uuid, p_seconds int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.open_lesson(p_lesson);
  insert into public.lesson_progress as p (user_id, lesson_id, video_position)
  values (auth.uid(), p_lesson, p_seconds)
  on conflict (user_id, lesson_id)
  do update set video_position = excluded.video_position, updated_at = now();
end $$;

-- "Mark as done", only for lessons without a quick check.
create function public.learn_mark_done(p_lesson uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.open_lesson(p_lesson);
  if exists (select 1 from public.questions q where q.lesson_id = p_lesson) then
    raise exception 'Pass the quick check to finish this lesson' using errcode = '42501';
  end if;
  insert into public.lesson_progress as p (user_id, lesson_id, done_at)
  values (auth.uid(), p_lesson, now())
  on conflict (user_id, lesson_id)
  do update set done_at = coalesce(p.done_at, now()), updated_at = now();
end $$;

do $$
declare f text;
begin
  foreach f in array array['learn_my_courses()', 'learn_course_outline(uuid)', 'learn_lesson(uuid)',
                           'learn_questions(uuid)', 'learn_save_position(uuid, int)', 'learn_mark_done(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Course images are shown to students; only the owner uploads them. Lesson files get a private bucket in L05.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-images', 'course-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins manage course images" on storage.objects
  for all to authenticated
  using (bucket_id = 'course-images' and public.is_admin())
  with check (bucket_id = 'course-images' and public.is_admin());
