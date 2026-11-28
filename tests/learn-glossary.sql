-- Run after the learn migrations in a transaction, then roll it back.
insert into auth.users (id, email) values
  ('91055000-0000-4000-8000-000000000001', 'glossary-student@example.invalid'),
  ('91055000-0000-4000-8000-000000000002', 'glossary-outsider@example.invalid');
insert into public.courses (id, brand, title, status) values
  ('91055c00-0000-4000-8000-000000000001', 'ccact', 'Glossary course', 'published'),
  ('91055c00-0000-4000-8000-000000000002', 'ccact', 'Glossary draft', 'draft');
insert into public.glossary_terms (course_id, term, pronunciation, definition) values
  ('91055c00-0000-4000-8000-000000000001', 'Tachycardia', 'tak-ih-KAR-dee-uh', 'A fast heart rate.'),
  ('91055c00-0000-4000-8000-000000000001', 'Bradycardia', 'bray-dee-KAR-dee-uh', 'A slow heart rate.'),
  ('91055c00-0000-4000-8000-000000000002', 'Hidden', '', 'Draft course term.');
insert into public.enrollments (user_id, course_id) values
  ('91055000-0000-4000-8000-000000000001', '91055c00-0000-4000-8000-000000000001'),
  ('91055000-0000-4000-8000-000000000001', '91055c00-0000-4000-8000-000000000002');

do $$ begin
  insert into public.glossary_terms (course_id, term, definition)
    values ('91055c00-0000-4000-8000-000000000001', 'TACHYCARDIA', 'dup');
  raise exception 'Duplicate term (different case) allowed';
exception when unique_violation then null;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '91055000-0000-4000-8000-000000000001', true);
do $$ begin
  if (select count(*) from public.learn_glossary('91055c00-0000-4000-8000-000000000001')) <> 2 then
    raise exception 'Enrolled student should see 2 terms';
  end if;
  if (select term from public.learn_glossary('91055c00-0000-4000-8000-000000000001') limit 1) <> 'Bradycardia' then
    raise exception 'Terms should be alphabetical';
  end if;
  if exists (select 1 from public.learn_glossary('91055c00-0000-4000-8000-000000000002')) then
    raise exception 'Draft course terms leaked';
  end if;
  if exists (select 1 from public.glossary_terms) then
    raise exception 'Student read the table directly';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '91055000-0000-4000-8000-000000000002', true);
do $$ begin
  if exists (select 1 from public.learn_glossary('91055c00-0000-4000-8000-000000000001')) then
    raise exception 'Outsider saw terms';
  end if;
end $$;
