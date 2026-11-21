-- Two sites from one codebase: theccact.com (brand 'ccact') and thecces.com (brand 'cces').
-- Each partner page belongs to one brand; each site builds only its own brand's live pages.
-- Setup (once, in the Supabase SQL editor; the URL is a secret, keep it out of git):
--   select vault.create_secret('https://api.netlify.com/build_hooks/<cces-site-hook-id>', 'netlify_build_hook_cces');
-- The existing 'netlify_build_hook' secret stays the CCACT site's hook.
-- Requires 202611210002_partner_photos.sql.

alter table public.partners
  add column brand text not null default 'ccact' check (brand in ('ccact', 'cces'));

-- Rebuild the site(s) whose live pages changed. Moving a live page between brands rebuilds both.
create or replace function private.rebuild_site()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  brands text[] := '{}';
  b text;
  hook text;
begin
  if tg_op <> 'INSERT' and old.status = 'live' then brands := brands || old.brand; end if;
  if tg_op <> 'DELETE' and new.status = 'live' and not (new.brand = any(brands)) then brands := brands || new.brand; end if;
  foreach b in array brands loop
    select s.decrypted_secret into hook from vault.decrypted_secrets s
     where s.name = case b when 'cces' then 'netlify_build_hook_cces' else 'netlify_build_hook' end;
    if hook is not null then
      perform net.http_post(url := hook, body := '{}'::jsonb);
    end if;
  end loop;
  return null;
end $$;
revoke all on function private.rebuild_site() from public, anon, authenticated;

-- Applications now also report the partner page brand.
drop function public.admin_applications();
create function public.admin_applications()
returns table (
  user_id uuid, email text, name text, type text, location text, role text, introduction text,
  contact_name text, website text, languages text,
  status text, created_at timestamptz, partner_slug text, partner_status text, partner_image text, partner_brand text
)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.name, a.type, a.location, a.role, a.introduction,
           a.contact_name, a.website, a.languages,
           a.status, a.created_at, pt.slug, pt.status, pt.image, pt.brand
      from public.affiliate_applications a
      join auth.users u on u.id = a.user_id
      left join public.partners pt on pt.user_id = a.user_id
     order by a.created_at desc;
end $$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated;

-- Move a partner page to the CCACT or CCES site.
create function public.admin_set_partner_brand(page_slug text, new_brand text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.partners set brand = new_brand where slug = page_slug;
  if not found then
    raise exception 'Partner page not found';
  end if;
end $$;
revoke all on function public.admin_set_partner_brand(text, text) from public, anon;
grant execute on function public.admin_set_partner_brand(text, text) to authenticated;
