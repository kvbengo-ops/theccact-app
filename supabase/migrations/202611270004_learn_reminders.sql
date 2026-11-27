-- Settings page: a student turns their own reminder emails on or off (all their active courses).
-- Welcome and certificate emails ignore this flag. Requires 202611270001_learn_schema.sql.

create function public.learn_set_reminders(p_on boolean)
returns void language sql security definer set search_path = '' as $$
  update public.enrollments set reminders_off = not p_on
   where user_id = auth.uid() and status = 'active';
$$;
revoke all on function public.learn_set_reminders(boolean) from public, anon;
grant execute on function public.learn_set_reminders(boolean) to authenticated;
