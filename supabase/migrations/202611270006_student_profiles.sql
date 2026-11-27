-- Students give their details (name, phone, location) before they can enroll themselves.
-- Self-enrollment is refused until the details exist. Owner-made enrollments are unchanged.
-- Requires 202611270005_learn_checkout.sql.

create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  phone text not null check (length(btrim(phone)) between 7 and 30),
  city text not null check (length(btrim(city)) between 1 and 120),
  province text check (province is null or length(btrim(province)) between 1 and 120),
  country text not null check (length(btrim(country)) between 1 and 120),
  updated_at timestamptz not null default now()
);
alter table public.student_profiles enable row level security;
revoke all on public.student_profiles from anon, authenticated;
grant select on public.student_profiles to authenticated;
grant all on public.student_profiles to service_role;
create policy "Students read their own" on public.student_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owner reads" on public.student_profiles for select to authenticated
  using (public.is_admin());

-- The signed-in student saves (or updates) their own details.
create function public.learn_save_profile(p_full_name text, p_phone text, p_city text, p_province text, p_country text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  insert into public.student_profiles as s (user_id, full_name, phone, city, province, country)
  values (auth.uid(), btrim(p_full_name), btrim(p_phone), btrim(p_city), nullif(btrim(coalesce(p_province, '')), ''), btrim(p_country))
  on conflict (user_id) do update
    set full_name = excluded.full_name, phone = excluded.phone, city = excluded.city,
        province = excluded.province, country = excluded.country, updated_at = now();
end $$;
revoke all on function public.learn_save_profile(text, text, text, text, text) from public, anon;
grant execute on function public.learn_save_profile(text, text, text, text, text) to authenticated;

-- Self-enrollment now needs saved details; the certificate name defaults to the profile name.
create or replace function public.learn_self_enroll(p_course uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.courses c where c.id = p_course and c.status = 'published' and c.self_enroll) then
    raise exception 'Course not available' using errcode = '42501';
  end if;
  select full_name into v_name from public.student_profiles where user_id = auth.uid();
  if v_name is null then
    raise exception 'Profile required' using errcode = 'P0001', hint = 'profile_required';
  end if;
  insert into public.enrollments as e (user_id, course_id, student_name, status, enrolled_by)
  values (auth.uid(), p_course, coalesce(nullif(left(btrim(coalesce(p_name, '')), 120), ''), v_name), 'active', auth.uid())
  on conflict (user_id, course_id)
  do update set status = 'active', student_name = coalesce(e.student_name, excluded.student_name);
end $$;
