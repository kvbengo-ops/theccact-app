-- SAMPLE COURSE for testing the Learning Portal. Do not run on production.
-- "Medical Terminology Essentials" (CCACT): 3 lecture lessons, a 9-question course quiz at the end, and a glossary.
-- Needs migrations up to 202611280001_learn_glossary.sql. Safe to re-run: it replaces the sample.
-- Free test checkout is on: open /learn/checkout/?course=5a3b1e00-0000-4000-8000-00000000a001 to enroll yourself.

delete from public.courses where id = '5a3b1e00-0000-4000-8000-00000000a001';

insert into public.courses (id, brand, title, description, ce_hours, pass_mark, lessons_in_order, status, self_enroll) values
  ('5a3b1e00-0000-4000-8000-00000000a001', 'ccact', 'Medical Terminology Essentials (Sample)',
   'Learn how medical words are built, say common terms with confidence, and read the abbreviations you will see on shift.',
   1.5, 66, true, 'published', true);

insert into public.modules (id, course_id, title, position) values
  ('5a3b1e00-0000-4000-8000-00000000b001', '5a3b1e00-0000-4000-8000-00000000a001', 'Building blocks', 0),
  ('5a3b1e00-0000-4000-8000-00000000b002', '5a3b1e00-0000-4000-8000-00000000a001', 'Terms on the ward', 1);

insert into public.lessons (id, module_id, title, position, length_minutes, reading) values
  ('5a3b1e00-0000-4000-8000-00000000c001', '5a3b1e00-0000-4000-8000-00000000b001', 'How medical words are built', 0, 7,
$$Most medical words look long, but they are made of a few small parts. Once you know the parts, you can work out the meaning of words you have never seen before.

## The three parts

The word root carries the main meaning. Cardi means heart, gastr means stomach and arthr means joint.

A prefix comes before the root and changes its meaning. Brady means slow, tachy means fast, hyper means above or too much, and hypo means below or too little.

A suffix comes at the end. It often tells you what is happening: itis means inflammation, ectomy means surgical removal, algia means pain and logy means the study of.

## Putting them together

A combining vowel, usually the letter o, joins parts so the word is easier to say. That is why we write cardiology and not cardilogy.

Read a medical word from the end, then go back to the start. Gastritis is inflammation of the stomach. Arthralgia is joint pain. An appendectomy is the surgical removal of the appendix.

## Try it yourself

When you meet a new term on shift, split it into its parts before you look it up. You will often know the answer already, and the word will be easier to remember next time.$$),

  ('5a3b1e00-0000-4000-8000-00000000c002', '5a3b1e00-0000-4000-8000-00000000b002', 'The heart and blood pressure', 0, 8,
$$Heart words come up in almost every handover. Here are the ones you will hear most, and how to say them.

## Heart rate

A normal resting heart rate for an adult is about 60 to 100 beats per minute. Tachycardia is a heart rate above 100. Bradycardia is a heart rate below 60. A well-trained athlete may have bradycardia at rest and be perfectly healthy, so always look at the whole client.

An arrhythmia is a heartbeat that is irregular, too fast or too slow. Report any new irregular pulse to the nurse in charge.

## Blood pressure

Hypertension means blood pressure that stays too high. Hypotension means blood pressure that is too low. A client with hypotension may feel dizzy when they stand up, so help them rise slowly.

## The heart muscle

The myocardium is the muscle of the heart. A myocardial infarction is a heart attack: part of the heart muscle is damaged because its blood supply is blocked. Chest pain, shortness of breath and sweating are warning signs. Call for help right away.

## Fluid

Edema is swelling caused by fluid trapped in the body's tissues. It is often seen in the ankles and feet. Dyspnea means difficult or laboured breathing. Report both, especially if they are new or getting worse.$$),

  ('5a3b1e00-0000-4000-8000-00000000c003', '5a3b1e00-0000-4000-8000-00000000b002', 'Abbreviations you will see on shift', 1, 6,
$$Charts and care plans use short forms to save time. You need to read them correctly, and you need to know which ones are unsafe.

## Common abbreviations

PRN means as needed. A PRN medication is given only when the client needs it, such as for pain.

NPO means nothing by mouth. A client who is NPO should not eat or drink, often before surgery or a test.

STAT means immediately. A STAT order is urgent.

BID means twice a day and TID means three times a day.

## Abbreviations to avoid

Some short forms cause errors and should never be used. Write the word "units" in full, because the letter U can be misread as a zero. Write "daily" instead of QD, which can be confused with QID, four times a day.

Never write a trailing zero, such as 5.0 mg, because it can be read as 50 mg. Always write a leading zero, such as 0.5 mg, so the decimal point is not missed.

## When in doubt

If you cannot read an order or are not sure what an abbreviation means, ask before you act. Asking is always safer than guessing.$$);

insert into public.questions (lesson_id, position, type, text, options, correct_answers, explanation, review_at) values
  ('5a3b1e00-0000-4000-8000-00000000c001', 0, 'single', 'What does the suffix "itis" mean?',
   '["Pain", "Inflammation", "Surgical removal"]', '{1}', 'Itis means inflammation, as in gastritis (inflammation of the stomach).', 'The three parts'),
  ('5a3b1e00-0000-4000-8000-00000000c001', 1, 'single', 'An appendectomy is…',
   '["Pain in the appendix", "Inflammation of the appendix", "Surgical removal of the appendix"]', '{2}', 'Ectomy means surgical removal.', 'Putting them together'),
  ('5a3b1e00-0000-4000-8000-00000000c001', 2, 'true_false', 'You should read a medical word from the end first, then go back to the start.',
   '["True", "False"]', '{0}', 'Start with the suffix, then the prefix and root.', 'Putting them together'),

  ('5a3b1e00-0000-4000-8000-00000000c002', 0, 'single', 'An adult''s resting heart rate is 112 beats per minute. This is called…',
   '["Bradycardia", "Tachycardia", "Hypotension"]', '{1}', 'Tachycardia is a heart rate above 100 beats per minute.', 'Heart rate'),
  ('5a3b1e00-0000-4000-8000-00000000c002', 1, 'multiple', 'Which are warning signs of a myocardial infarction? Choose all that apply.',
   '["Chest pain", "Shortness of breath", "Sweating", "Swollen ankles only"]', '{0,1,2}', 'Chest pain, shortness of breath and sweating are warning signs. Call for help right away.', 'The heart muscle'),
  ('5a3b1e00-0000-4000-8000-00000000c002', 2, 'single', 'A client with hypotension stands up quickly. What might happen?',
   '["They may feel dizzy", "Their heart rate drops below 60", "Their ankles swell"]', '{0}', 'Low blood pressure can make a client dizzy when standing. Help them rise slowly.', 'Blood pressure'),

  ('5a3b1e00-0000-4000-8000-00000000c003', 0, 'single', 'A client is NPO. What does that mean?',
   '["Give pain medication as needed", "Nothing by mouth", "Check vital signs immediately"]', '{1}', 'NPO means nothing by mouth: no food or drink.', 'Common abbreviations'),
  ('5a3b1e00-0000-4000-8000-00000000c003', 1, 'single', 'Which dose is written safely?',
   '["5.0 mg", ".5 mg", "0.5 mg"]', '{2}', 'Always use a leading zero and never a trailing zero.', 'Abbreviations to avoid'),
  ('5a3b1e00-0000-4000-8000-00000000c003', 2, 'true_false', 'If you are not sure what an abbreviation means, it is fine to make your best guess.',
   '["True", "False"]', '{1}', 'Ask before you act. Asking is always safer than guessing.', 'When in doubt');

insert into public.glossary_terms (course_id, term, pronunciation, definition) values
  ('5a3b1e00-0000-4000-8000-00000000a001', 'word root', '', 'The part of a medical word that carries its main meaning, such as cardi (heart).'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'prefix', 'PREE-fiks', 'A word part placed before the root that changes its meaning, such as tachy (fast).'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'suffix', 'SUF-iks', 'A word part placed at the end, such as itis (inflammation).'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'combining vowel', '', 'A vowel, usually o, that joins word parts so the word is easier to say.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'cardiology', 'kar-dee-OL-uh-jee', 'The study of the heart and its diseases.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'gastritis', 'gas-TRY-tis', 'Inflammation of the stomach lining.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'arthralgia', 'ar-THRAL-juh', 'Pain in a joint.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'appendectomy', 'ap-en-DEK-tuh-mee', 'Surgery to remove the appendix.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'tachycardia', 'tak-ih-KAR-dee-uh', 'A fast heart rate: over 100 beats per minute in an adult at rest.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'bradycardia', 'bray-dee-KAR-dee-uh', 'A slow heart rate: under 60 beats per minute in an adult at rest.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'arrhythmia', 'uh-RITH-mee-uh', 'A heartbeat that is irregular, too fast or too slow.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'hypertension', 'hy-per-TEN-shun', 'Blood pressure that stays higher than normal.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'hypotension', 'hy-poh-TEN-shun', 'Blood pressure that is lower than normal. It can cause dizziness when standing.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'myocardium', 'my-oh-KAR-dee-um', 'The muscle of the heart.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'myocardial infarction', 'my-oh-KAR-dee-ul in-FARK-shun', 'A heart attack: heart muscle is damaged because its blood supply is blocked.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'edema', 'ih-DEE-muh', 'Swelling caused by fluid trapped in the body''s tissues.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'dyspnea', 'DISP-nee-uh', 'Difficult or laboured breathing.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'PRN', 'P-R-N', 'As needed. From the Latin "pro re nata".'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'NPO', 'N-P-O', 'Nothing by mouth: no food or drink. From the Latin "nil per os".'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'STAT', 'stat', 'Immediately. A STAT order is urgent.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'BID', 'B-I-D', 'Twice a day.'),
  ('5a3b1e00-0000-4000-8000-00000000a001', 'TID', 'T-I-D', 'Three times a day.');

-- Lessons are lectures only; every question moves to a final "Course quiz" lesson (it unlocks after the lectures).
begin;
insert into public.modules (id, course_id, title, position) values
  ('5a3b1e00-0000-4000-8000-00000000b003', '5a3b1e00-0000-4000-8000-00000000a001', 'Wrap-up', 2)
on conflict (id) do nothing;
insert into public.lessons (id, module_id, title, position, length_minutes, reading) values
  ('5a3b1e00-0000-4000-8000-00000000c004', '5a3b1e00-0000-4000-8000-00000000b003', 'Course quiz', 0, 10,
   'Answer these questions to finish the course. You need 6 out of 9 to pass, and you can try again as many times as you like.')
on conflict (id) do nothing;
update public.questions q set
  lesson_id = '5a3b1e00-0000-4000-8000-00000000c004',
  position = case q.lesson_id
    when '5a3b1e00-0000-4000-8000-00000000c001' then q.position
    when '5a3b1e00-0000-4000-8000-00000000c002' then 3 + q.position
    else 6 + q.position end,
  review_at = case q.lesson_id
    when '5a3b1e00-0000-4000-8000-00000000c001' then 'Lesson 1, How medical words are built: '
    when '5a3b1e00-0000-4000-8000-00000000c002' then 'Lesson 2, The heart and blood pressure: '
    else 'Lesson 3, Abbreviations you will see on shift: ' end || q.review_at
where q.lesson_id in ('5a3b1e00-0000-4000-8000-00000000c001', '5a3b1e00-0000-4000-8000-00000000c002', '5a3b1e00-0000-4000-8000-00000000c003');
;
