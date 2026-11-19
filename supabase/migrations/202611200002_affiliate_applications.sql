-- Applicants can submit and view their own application; decisions require trusted server access.
create table public.affiliate_applications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  type text not null check (type in ('individual', 'organisation')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.affiliate_applications enable row level security;
revoke all on public.affiliate_applications from anon, authenticated;
grant select on public.affiliate_applications to authenticated;
grant insert (user_id, name, type) on public.affiliate_applications to authenticated;

create policy "Applicants read their own application"
  on public.affiliate_applications for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Applicants submit their own application"
  on public.affiliate_applications for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');
