alter table public.affiliate_applications
  add column location text check (location is null or length(trim(location)) between 1 and 160),
  add column role text check (role is null or length(trim(role)) between 1 and 160),
  add column introduction text check (introduction is null or length(trim(introduction)) between 1 and 2000);

grant insert (location, role, introduction) on public.affiliate_applications to authenticated;
