-- Owner console: a photo for each partner page.
-- Photos live in a public bucket (they are shown on public pages); only admins can upload or replace them.
-- Setting the photo updates partners.image, so a live page rebuilds through partners_rebuild_site.
-- Requires 202611200008_typed_applications.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-photos', 'partner-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins manage partner photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'partner-photos' and public.is_admin())
  with check (bucket_id = 'partner-photos' and public.is_admin());

-- Applications now also report the partner page photo.
drop function public.admin_applications();
create function public.admin_applications()
returns table (
  user_id uuid, email text, name text, type text, location text, role text, introduction text,
  contact_name text, website text, languages text,
  status text, created_at timestamptz, partner_slug text, partner_status text, partner_image text
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
           a.contact_name, a.website, a.languages,
           a.status, a.created_at, pt.slug, pt.status, pt.image
      from public.affiliate_applications a
      join auth.users u on u.id = a.user_id
      left join public.partners pt on pt.user_id = a.user_id
     order by a.created_at desc;
end $$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated;

-- Set (or clear, with null) a partner page photo.
create function public.admin_set_partner_image(page_slug text, image_url text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if image_url is not null and (image_url not like 'https://%' or length(image_url) > 500) then
    raise exception 'Photo must be an HTTPS URL';
  end if;
  update public.partners set image = image_url where slug = page_slug;
  if not found then
    raise exception 'Partner page not found';
  end if;
end $$;
revoke all on function public.admin_set_partner_image(text, text) from public, anon;
grant execute on function public.admin_set_partner_image(text, text) to authenticated;
