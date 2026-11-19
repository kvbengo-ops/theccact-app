-- Preserve existing values while no longer requiring applicants to choose a type.
alter table public.affiliate_applications alter column type drop not null;
