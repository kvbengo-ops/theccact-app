-- Separate individual and organisation applications, and carry their extra details into partner pages.
-- Requires 202611200007_grant_partner_pages.sql.

-- Extra application fields. Organisations give a contact person and website; individuals give languages.
alter table public.affiliate_applications
  add column contact_name text check (contact_name is null or length(trim(contact_name)) between 1 and 120),
  add column website text check (website is null or (length(website) <= 300 and website like 'https://%')),
  add column languages text check (languages is null or length(trim(languages)) between 1 and 200);
grant insert (contact_name, website, languages) on public.affiliate_applications to authenticated;

-- Named contact shown on organisation partner pages.
alter table public.partners
  add column "contactName" text check ("contactName" is null or length(trim("contactName")) between 1 and 120);

-- Applications now also report the new fields.
drop function public.admin_applications();
create function public.admin_applications()
returns table (
  user_id uuid, email text, name text, type text, location text, role text, introduction text,
  contact_name text, website text, languages text,
  status text, created_at timestamptz, partner_slug text, partner_status text
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
           a.contact_name, a.website, a.languages,
           a.status, a.created_at, pt.slug, pt.status
      from public.affiliate_applications a
      join auth.users u on u.id = a.user_id
      left join public.partners pt on pt.user_id = a.user_id
     order by a.created_at desc;
end $$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated;

-- Granting a page now copies the contact person, website (organisations only) and languages.
create or replace function public.admin_grant_partner_page(
  applicant_id uuid, page_slug text, page_type text, page_role text,
  page_location text, page_bio text, page_referral_code text
)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.partners (
    slug, name, type, "referralCode", bio, role, location, email,
    "approvalDate", status, "contentReviewedDate", user_id,
    "contactName", website, languages
  )
  select lower(btrim(page_slug)), a.name, page_type, btrim(page_referral_code), btrim(page_bio),
         btrim(page_role), btrim(page_location), u.email, current_date, 'preview', current_date, a.user_id,
         case when page_type = 'organisation' then a.contact_name end,
         case when page_type = 'organisation' then a.website end,
         (select array_agg(btrim(lang)) from unnest(string_to_array(a.languages, ',')) as lang where btrim(lang) <> '')
    from public.affiliate_applications a
    join auth.users u on u.id = a.user_id
   where a.user_id = applicant_id and a.status = 'approved';
  if not found then
    raise exception 'Application is not approved';
  end if;
  return lower(btrim(page_slug));
end $$;
