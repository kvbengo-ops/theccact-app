-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('a0d10000-0000-4000-8000-000000000001', 'audio-student@example.invalid'),
  ('a0d10000-0000-4000-8000-000000000002', 'audio-outsider@example.invalid');
insert into public.courses (id, brand, title, status) values
  ('a0d1c000-0000-4000-8000-000000000001', 'ccact', 'Audio course', 'published'),
  ('a0d1c000-0000-4000-8000-000000000002', 'ccact', 'Audio draft', 'draft');
insert into public.enrollments (user_id, course_id) values
  ('a0d10000-0000-4000-8000-000000000001', 'a0d1c000-0000-4000-8000-000000000001'),
  ('a0d10000-0000-4000-8000-000000000001', 'a0d1c000-0000-4000-8000-000000000002');
insert into storage.objects (bucket_id, name) values
  ('lesson-audio', 'a0d1c000-0000-4000-8000-000000000001/lesson/index.json'),
  ('lesson-audio', 'a0d1c000-0000-4000-8000-000000000002/lesson/index.json'),
  ('lesson-audio', 'not-a-uuid/index.json'),
  ('course-images', 'a0d1c000-0000-4000-8000-000000000001/cover.png');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0d10000-0000-4000-8000-000000000001', true);
do $$ begin
  if (select count(*) from storage.objects where bucket_id = 'lesson-audio') <> 1 then
    raise exception 'Enrolled student should see exactly the published course audio';
  end if;
  if not public.learn_can_hear('a0d1c000-0000-4000-8000-000000000001/x.mp3') then raise exception 'Enrolled student refused'; end if;
  if public.learn_can_hear('../a0d1c000-0000-4000-8000-000000000001/x.mp3') then raise exception 'Odd path accepted'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'a0d10000-0000-4000-8000-000000000002', true);
do $$ begin
  if exists (select 1 from storage.objects where bucket_id = 'lesson-audio') then
    raise exception 'Outsider saw lesson audio';
  end if;
end $$;
