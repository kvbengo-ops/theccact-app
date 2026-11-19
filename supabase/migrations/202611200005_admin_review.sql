create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on private.admin_users from public, anon, authenticated;

create function public.admin_applications()
returns table (user_id uuid, email text, name text, location text, role text, introduction text, status text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.admin_users a where a.user_id = auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query select p.user_id, u.email::text, p.name, p.location, p.role, p.introduction, p.status, p.created_at
    from public.affiliate_applications p join auth.users u on u.id = p.user_id
    order by p.created_at desc;
end $$;

create function public.admin_decide_application(applicant_id uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.admin_users a where a.user_id = auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if decision not in ('approved', 'rejected') or decision is null then
    raise exception 'Invalid decision';
  end if;
  update public.affiliate_applications set status = decision
    where user_id = applicant_id and status = 'pending';
  if not found then raise exception 'Application is not pending'; end if;
end $$;

revoke all on function public.admin_applications() from public, anon;
revoke all on function public.admin_decide_application(uuid, text) from public, anon;
grant execute on function public.admin_applications() to authenticated;
grant execute on function public.admin_decide_application(uuid, text) to authenticated;
