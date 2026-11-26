-- Affiliate sign-up is by invitation only. The owner creates an invite for one email address in the console and
-- sends the link herself; an application can only be submitted from that email while the invite is open.
-- The invite token is a random UUID, so the link itself is the secret. Requires 202611240001_application_answers.sql.

create table public.affiliate_invites (
  token uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  type text not null check (type in ('individual', 'organisation')),
  brand text not null default 'ccact' check (brand in ('ccact', 'cces')),
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);

-- Only reachable through the functions below.
alter table public.affiliate_invites enable row level security;
revoke all on public.affiliate_invites from anon, authenticated;

-- Is there an open invite for the signed-in user's email? Used by the application insert policy, which runs as the
-- applicant, so it lives in public (the private schema stays closed to them); it only ever answers about themselves.
create function public.has_open_invite()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.affiliate_invites i
     where i.email = lower(coalesce(auth.jwt() ->> 'email', ''))
       and i.used_at is null and i.revoked_at is null
  );
$$;
revoke all on function public.has_open_invite() from public, anon;
grant execute on function public.has_open_invite() to authenticated;

-- Applications now need an open invite for the applicant's email.
drop policy "Applicants submit their own application" on public.affiliate_applications;
create policy "Invited applicants submit their own application"
  on public.affiliate_applications for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and public.has_open_invite());

-- Submitting the application uses up the invite.
create function private.use_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.affiliate_invites
     set used_at = now(), used_by = new.user_id
   where email = (select lower(u.email) from auth.users u where u.id = new.user_id)
     and used_at is null and revoked_at is null;
  return new;
end $$;
revoke all on function private.use_invite() from public, anon, authenticated;
create trigger affiliate_applications_use_invite
  after insert on public.affiliate_applications
  for each row execute function private.use_invite();

-- Public: what an invite link is for (email and form type), only while it is open.
create function public.invite_details(invite_token uuid)
returns table (email text, type text)
language sql stable security definer set search_path = '' as $$
  select i.email, i.type from public.affiliate_invites i
   where i.token = invite_token and i.used_at is null and i.revoked_at is null;
$$;
revoke all on function public.invite_details(uuid) from public;
grant execute on function public.invite_details(uuid) to anon, authenticated;

-- Owner console: create an invite and get its token.
create function public.admin_create_invite(invite_email text, invite_type text, invite_brand text, invite_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_token uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.affiliate_invites (email, type, brand, note)
  values (lower(btrim(invite_email)), invite_type, invite_brand, nullif(btrim(invite_note), ''))
  returning token into new_token;
  return new_token;
end $$;
revoke all on function public.admin_create_invite(text, text, text, text) from public, anon;
grant execute on function public.admin_create_invite(text, text, text, text) to authenticated;

-- Owner console: every invite, newest first, with the applicant's name once used.
create function public.admin_invites()
returns table (token uuid, email text, type text, brand text, note text, created_at timestamptz, used_at timestamptz, revoked_at timestamptz, applicant_name text)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select i.token, i.email, i.type, i.brand, i.note, i.created_at, i.used_at, i.revoked_at, a.name
      from public.affiliate_invites i
      left join public.affiliate_applications a on a.user_id = i.used_by
     order by i.created_at desc;
end $$;
revoke all on function public.admin_invites() from public, anon;
grant execute on function public.admin_invites() to authenticated;

-- Owner console: cancel an invite that has not been used.
create function public.admin_revoke_invite(invite_token uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.affiliate_invites set revoked_at = now()
   where token = invite_token and used_at is null and revoked_at is null;
  if not found then
    raise exception 'Invite not found or already used';
  end if;
end $$;
revoke all on function public.admin_revoke_invite(uuid) from public, anon;
grant execute on function public.admin_revoke_invite(uuid) to authenticated;
