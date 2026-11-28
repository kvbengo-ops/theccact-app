// Pre-records a course's lessons and medical terms with the Kokoro voice and stores them in the private
// `lesson-audio` bucket, so students play files instead of waiting for speech.
//
//   npm run tts:course -- <course id>          (from the repo root)
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from ../.env.local when not set) and ffmpeg on the PATH.
// Each clip is named by a hash of its text and voice: unchanged paragraphs are reused, edited ones are remade,
// and clips no longer used are deleted. The lesson page plays a clip only when its text still matches exactly.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { KokoroTTS } from 'kokoro-js';
import { normalizeSpeech as normalize, readingBlocks, speechChunks, spokenText } from '../src/scripts/learn-reading.mjs';

const envFile = new URL('../.env.local', import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const courseId = process.argv[2] ?? '';
if (!/^[0-9a-f-]{36}$/i.test(courseId)) {
  console.error('Usage: npm run tts:course -- <course id>');
  process.exit(1);
}
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or put them in .env.local).');
  process.exit(1);
}

const BUCKET = 'lesson-audio';
const VOICE = process.env.TTS_VOICE || 'af_heart';
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const storage = db.storage.from(BUCKET);
// Named by what is actually said, so a new pronunciation rule re-records only the clips it changes.
const clipName = (text) => `${createHash('sha1').update(`${VOICE}|${spokenText(text)}`).digest('hex').slice(0, 16)}.mp3`;
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

console.log('Loading Kokoro…');
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });

// Speak a block sentence by sentence, join with short pauses, and encode to a small mono MP3.
async function record(text) {
  const parts = [];
  let rate = 24000;
  for (const chunk of speechChunks(text, 400)) {
    const audio = await tts.generate(chunk, { voice: VOICE });
    rate = audio.sampling_rate;
    parts.push(audio.audio, new Float32Array(Math.round(rate * 0.3)));
  }
  const samples = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) { samples.set(part, at); at += part.length; }
  return execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'f32le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0', '-b:a', '48k', '-f', 'mp3', 'pipe:1'],
    { input: Buffer.from(samples.buffer), maxBuffer: 64 * 1024 * 1024 });
}

// Record any missing clips for these texts into `folder`, write its index, and delete clips nobody uses.
async function syncFolder(folder, entries) {
  const existing = new Set(must(await storage.list(folder, { limit: 1000 }), `List ${folder}`).map((f) => f.name));
  const keep = new Set(['index.json']);
  let made = 0;
  for (const entry of entries) {
    entry.file = clipName(entry.text);
    keep.add(entry.file);
    if (existing.has(entry.file)) continue;
    process.stdout.write(`  recording: ${entry.text.slice(0, 60)}${entry.text.length > 60 ? '…' : ''}\n`);
    const mp3 = await record(spokenText(entry.text));
    must(await storage.upload(`${folder}/${entry.file}`, mp3, { contentType: 'audio/mpeg', cacheControl: '31536000', upsert: true }), 'Upload clip');
    made += 1;
  }
  const index = JSON.stringify({ voice: VOICE, clips: entries.map(({ key, text, file }) => ({ key, text, file })) });
  must(await storage.upload(`${folder}/index.json`, Buffer.from(index), { contentType: 'application/json', cacheControl: '60', upsert: true }), 'Upload index');
  const stale = [...existing].filter((name) => !keep.has(name)).map((name) => `${folder}/${name}`);
  if (stale.length) must(await storage.remove(stale), 'Remove old clips');
  return { made, reused: entries.length - made, removed: stale.length };
}

const course = must(await db.from('courses').select('id, title').eq('id', courseId).maybeSingle(), 'Course');
if (!course) throw new Error('No course with that id.');
console.log(`Course: ${course.title}`);
const modules = must(await db.from('modules').select('id').eq('course_id', courseId), 'Modules');
const lessons = modules.length
  ? must(await db.from('lessons').select('id, title, reading, position, module_id').in('module_id', modules.map((m) => m.id)), 'Lessons')
  : [];

for (const lesson of lessons) {
  console.log(`Lesson: ${lesson.title}`);
  // Same blocks, in the same order, as the lesson page reads: the title, then each heading or paragraph.
  const texts = [lesson.title, ...readingBlocks(lesson.reading).map((block) => block.text)].map(normalize).filter(Boolean);
  const entries = [...new Set(texts)].map((text) => ({ key: text, text }));
  const result = await syncFolder(`${courseId}/${lesson.id}`, entries);
  console.log(`  ${result.made} recorded, ${result.reused} reused, ${result.removed} removed`);
}

// What to say for a term: spelled-out letters ("P-R-N"), a plain one-word sound ("stat"), otherwise the term itself.
export const spokenTerm = ({ term, pronunciation = '' }) => (/^([A-Z]-)+[A-Z]$/.test(pronunciation)
  ? pronunciation.replaceAll('-', ' ')
  : /^[a-z]+$/.test(pronunciation) ? pronunciation : normalize(term));

const terms = must(await db.from('glossary_terms').select('term, pronunciation').eq('course_id', courseId), 'Medical terms');
if (terms.length) {
  console.log(`Medical terms: ${terms.length}`);
  const result = await syncFolder(`${courseId}/terms`, terms.map((t) => ({ key: t.term.toLowerCase(), text: spokenTerm(t) })));
  console.log(`  ${result.made} recorded, ${result.reused} reused, ${result.removed} removed`);
}
console.log('Done.');
