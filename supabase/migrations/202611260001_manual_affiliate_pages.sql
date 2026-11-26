-- The owner can add an affiliate page directly, without the affiliate signing up or applying.
-- These pages have no linked account (user_id is null). They are listed in the console with the applications,
-- as approved rows, so the same controls (photo, website, go live, suspend) work for them.
-- Requires 202611240001_application_answers.sql.

create function public.admin_create_partner_page(
  page_name text, page_email text, page_type text, page_brand text, page_slug text,
  page_role text, page_location text, page_bio text, page_referral_code text
)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.partners (
    slug, name, type, brand, "referralCode", bio, role, location, email,
    "approvalDate", status, "contentReviewedDate"
  ) values (
    lower(btrim(page_slug)), btrim(page_name), page_type, page_brand, btrim(page_referral_code), btrim(page_bio),
    btrim(page_role), btrim(page_location), lower(btrim(page_email)), current_date, 'preview', current_date
  );
  return lower(btrim(page_slug));
end $$;
revoke all on function public.admin_create_partner_page(text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_partner_page(text, text, text, text, text, text, text, text, text) to authenticated;

-- Applications, plus owner-added pages (no account) as approved rows with a null user_id.
create or replace function public.admin_applications()
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
    select * from (
      select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
             a.contact_name, a.website, a.languages,
             a.status, a.created_at, pt.slug, pt.status, pt.image, pt.brand,
             a.answers
        from public.affiliate_applications a
        join auth.users u on u.id = a.user_id
        left join public.partners pt on pt.user_id = a.user_id
      union all
      select null::uuid, p.email, p.name, p.type, p.location, p.role, null::text,
             p."contactName", p.website, array_to_string(p.languages, ', '),
             'approved'::text, p."approvalDate"::timestamptz, p.slug, p.status, p.image, p.brand,
             null::jsonb
        from public.partners p
       where p.user_id is null
    ) rows
     order by rows.created_at desc;
end $$;
