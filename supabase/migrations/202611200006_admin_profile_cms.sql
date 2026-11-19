-- Owner console: site content (CMS) and private admin profile photos.
-- Apply in the Supabase SQL editor (or `supabase db push`) before the Content and photo features work.

-- Reusable admin check. SECURITY DEFINER so policies can call it without exposing the private schema.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from private.admin_users a where a.user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Editable site text. Public can read; only admin_save_content can write.
create table public.site_content (
  key text primary key check (key in ('announcement', 'hero_lead', 'courses_lead', 'footer_tagline')),
  value text not null check (char_length(btrim(value)) between 1 and 400),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_content enable row level security;
revoke all on public.site_content from public, anon, authenticated;
grant select on public.site_content to anon, authenticated;
create policy "Anyone can read site content" on public.site_content
  for select to anon, authenticated using (true);

-- An empty value removes the override so the built-in text shows again.
create function public.admin_save_content(content_key text, content_value text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if btrim(coalesce(content_value, '')) = '' then
    delete from public.site_content where key = content_key;
    return;
  end if;
  insert into public.site_content (key, value, updated_by)
    values (content_key, btrim(content_value), auth.uid())
  on conflict (key) do update
    set value = excluded.value, updated_at = now(), updated_by = auth.uid();
end $$;
revoke all on function public.admin_save_content(text, text) from public, anon;
grant execute on function public.admin_save_content(text, text) to authenticated;

-- Private avatar bucket: one folder per admin, images only, 2 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-avatars', 'admin-avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins manage their own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'admin-avatars' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'admin-avatars' and public.is_admin() and (storage.foldername(name))[1] = auth.uid()::text);
