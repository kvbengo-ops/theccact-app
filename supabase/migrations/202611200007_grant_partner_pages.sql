-- Owner console: grant an approved affiliate their own partner page.
-- Every partner page uses the same site template (/partners/<slug>/); only the record's content differs.
-- Pages are built from rows with status 'live', so a newly live page appears after the next site build.
-- Requires 202611200006_admin_profile_cms.sql (public.is_admin).

-- Link each partner page to the affiliate account it was granted to.
alter table public.partners
  add column user_id uuid unique references auth.users(id) on delete set null;

-- Applications now also report the type and any granted page.
drop function public.admin_applications();
create function public.admin_applications()
returns table (
  user_id uuid, email text, name text, type text, location text, role text, introduction text,
  status text, created_at timestamptz, partner_slug text, partner_status text
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
           a.status, a.created_at, pt.slug, pt.status
      from public.affiliate_applications a
      join auth.users u on u.id = a.user_id
      left join public.partners pt on pt.user_id = a.user_id
     order by a.created_at desc;
end $$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated;

-- Create the partner page record for an approved affiliate. It starts in 'preview' (content written and
-- reviewed by the owner), and goes live through admin_set_partner_status.
create function public.admin_grant_partner_page(
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
    "approvalDate", status, "contentReviewedDate", user_id
  )
  select lower(btrim(page_slug)), a.name, page_type, btrim(page_referral_code), btrim(page_bio),
         btrim(page_role), btrim(page_location), u.email, current_date, 'preview', current_date, a.user_id
    from public.affiliate_applications a
    join auth.users u on u.id = a.user_id
   where a.user_id = applicant_id and a.status = 'approved';
  if not found then
    raise exception 'Application is not approved';
  end if;
  return lower(btrim(page_slug));
end $$;
revoke all on function public.admin_grant_partner_page(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_grant_partner_page(uuid, text, text, text, text, text, text) to authenticated;

-- Move a partner page through its lifecycle. Mirrors canTransition() in src/lib/partners.mjs.
create function public.admin_set_partner_status(page_slug text, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_status text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select p.status into current_status from public.partners p where p.slug = page_slug for update;
  if not found then
    raise exception 'Partner page not found';
  end if;
  if not (
    (current_status = 'draft' and new_status = 'review') or
    (current_status = 'review' and new_status in ('draft', 'preview')) or
    (current_status = 'preview' and new_status in ('review', 'live')) or
    (current_status = 'live' and new_status in ('suspended', 'retired')) or
    (current_status = 'suspended' and new_status in ('live', 'retired'))
  ) then
    raise exception 'Cannot change a % page to %', current_status, new_status;
  end if;
  update public.partners
     set status = new_status,
         "partnerApprovedDate" = case when new_status = 'live' then coalesce("partnerApprovedDate", current_date) else "partnerApprovedDate" end
   where slug = page_slug;
end $$;
revoke all on function public.admin_set_partner_status(text, text) from public, anon;
grant execute on function public.admin_set_partner_status(text, text) to authenticated;

-- Lets a signed-in affiliate see their own page link and status (and nothing else from partners).
create function public.my_partner_page()
returns table (slug text, status text)
language sql security definer stable set search_path = '' as $$
  select p.slug, p.status from public.partners p where p.user_id = auth.uid()
$$;
revoke all on function public.my_partner_page() from public, anon;
grant execute on function public.my_partner_page() to authenticated;
