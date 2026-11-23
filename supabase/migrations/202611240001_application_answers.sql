-- Full answers from the affiliate application (the CCES individual and business question sets).
-- The existing columns stay as the review summary; `answers` keeps every question as submitted.
alter table public.affiliate_applications
  add column answers jsonb check (answers is null or (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 60000));
grant insert (answers) on public.affiliate_applications to authenticated;

-- Applications now also return the answers.
drop function public.admin_applications();
create function public.admin_applications()
returns table (
  user_id uuid, email text, name text, type text, location text, role text, introduction text,
  contact_name text, website text, languages text,
  status text, created_at timestamptz, partner_slug text, partner_status text, partner_image text, partner_brand text,
  answers jsonb
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
           a.contact_name, a.website, a.languages,
           a.status, a.created_at, pt.slug, pt.status, pt.image, pt.brand,
           a.answers
      from public.affiliate_applications a
      join auth.users u on u.id = a.user_id
      left join public.partners pt on pt.user_id = a.user_id
     order by a.created_at desc;
end $$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated;
