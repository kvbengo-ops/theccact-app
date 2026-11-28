-- Course glossary: medical terms with how to say them and a plain meaning.
-- Lessons underline these terms; tapping one shows the meaning and speaks the word.
-- Requires 202611270001_learn_schema.sql. NOT YET APPLIED to the production project (testing first).

create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  term text not null check (length(btrim(term)) between 1 and 80),
  pronunciation text not null default '' check (length(pronunciation) <= 120),
  definition text not null check (length(btrim(definition)) between 1 and 600)
);
create unique index glossary_terms_course_term on public.glossary_terms (course_id, lower(term));

alter table public.glossary_terms enable row level security;
revoke all on public.glossary_terms from anon, authenticated;
grant select, insert, update, delete on public.glossary_terms to authenticated;
grant all on public.glossary_terms to service_role;
create policy "Owner manages" on public.glossary_terms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Enrolled students read their course's terms. Others get nothing.
create function public.learn_glossary(p_course uuid)
returns table (term text, pronunciation text, definition text)
language sql stable security definer set search_path = '' as $$
  select g.term, g.pronunciation, g.definition
    from public.glossary_terms g
   where g.course_id = p_course and private.enrolled(p_course)
   order by lower(g.term)
$$;
revoke all on function public.learn_glossary(uuid) from public, anon;
grant execute on function public.learn_glossary(uuid) to authenticated;
