-- Pre-recorded lesson audio (Kokoro voice), made by tts-server/generate.mjs.
-- Files: lesson-audio/<course id>/<lesson id>/index.json + <hash>.mp3, and lesson-audio/<course id>/terms/index.json + <hash>.mp3.
-- Private bucket: the owner manages it; enrolled students can only read their own courses' audio.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-audio', 'lesson-audio', false, 10485760, array['audio/mpeg', 'application/json'])
on conflict (id) do nothing;

-- True when the signed-in student is enrolled in the course named by the path's first folder.
create function public.learn_can_hear(p_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare folder text := split_part(p_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.enrolled(folder::uuid);
end $$;
revoke all on function public.learn_can_hear(text) from public, anon;
grant execute on function public.learn_can_hear(text) to authenticated;

create policy "Admins manage lesson audio" on storage.objects
  for all to authenticated
  using (bucket_id = 'lesson-audio' and public.is_admin())
  with check (bucket_id = 'lesson-audio' and public.is_admin());

create policy "Enrolled students hear lesson audio" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-audio' and public.learn_can_hear(name));
