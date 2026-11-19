-- Partner records contain private contact and approval information.
create table public.partners (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  type text not null check (type in ('individual', 'organisation')),
  "referralCode" text not null check (length(trim("referralCode")) > 0),
  bio text not null check (length(trim(bio)) > 0),
  role text not null check (length(trim(role)) > 0),
  location text not null check (length(trim(location)) > 0),
  email text not null check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  "approvalDate" date not null,
  status text not null check (status in ('draft', 'review', 'preview', 'live', 'suspended', 'retired')),
  "contentReviewedDate" date,
  "partnerApprovedDate" date,
  image text,
  languages text[],
  services text[] check (cardinality(services) <= 4),
  website text check (website is null or (type = 'organisation' and website like 'https://%')),
  constraint live_approvals check (status <> 'live' or ("contentReviewedDate" is not null and "partnerApprovedDate" is not null))
);

alter table public.partners enable row level security;
revoke all on public.partners from anon, authenticated;
