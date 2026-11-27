-- Quick-check marking. Runs in the database so correct answers never reach the browser before submitting,
-- and the attempt and the unlock are saved together. Requires 202611270001_learn_schema.sql.
-- p_answers: {"<question id>": [<zero-based option indexes>], ...} with every question of the lesson answered.

create function public.learn_submit_check(p_lesson uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  course uuid := private.open_lesson(p_lesson);
  q public.questions;
  picked jsonb;
  is_right boolean;
  total int := 0;
  right_count int := 0;
  results jsonb := '[]';
  pass int;
  has_passed boolean;
  pct int;
begin
  for q in select * from public.questions where lesson_id = p_lesson order by position, id loop
    picked := p_answers -> q.id::text;
    -- Every question needs an answer, so an empty submission cannot be used to read the explanations.
    if picked is null or jsonb_typeof(picked) <> 'array' or jsonb_array_length(picked) = 0 then
      raise exception 'Answer every question' using errcode = '22023';
    end if;
    is_right := array(select distinct v::int from jsonb_array_elements_text(picked) v order by 1)
              = array(select distinct v from unnest(q.correct_answers) v order by 1);
    total := total + 1;
    right_count := right_count + is_right::int;
    results := results || jsonb_build_object(
      'question_id', q.id, 'correct', is_right, 'explanation', q.explanation,
      'review_at', case when is_right then null else q.review_at end);
  end loop;
  if total = 0 then
    raise exception 'This lesson has no quick check' using errcode = '22023';
  end if;

  select c.pass_mark into pass from public.courses c where c.id = course;
  has_passed := right_count * 100 >= pass * total;
  pct := right_count * 100 / total;

  insert into public.quiz_attempts (user_id, lesson_id, answers, score, passed)
  values (auth.uid(), p_lesson, p_answers, pct, has_passed);
  if has_passed then
    insert into public.lesson_progress as p (user_id, lesson_id, done_at)
    values (auth.uid(), p_lesson, now())
    on conflict (user_id, lesson_id)
    do update set done_at = coalesce(p.done_at, now()), updated_at = now();
  end if;
  return jsonb_build_object('score', pct, 'passed', has_passed, 'results', results);
end $$;
revoke all on function public.learn_submit_check(uuid, jsonb) from public, anon;
grant execute on function public.learn_submit_check(uuid, jsonb) to authenticated;
