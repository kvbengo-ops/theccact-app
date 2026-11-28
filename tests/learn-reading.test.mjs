import test from 'node:test';
import assert from 'node:assert/strict';
import { markTerms, pickVoice, readingBlocks, speechChunks } from '../src/scripts/learn-reading.mjs';

test('reading text splits into paragraphs, with ## lines as headings', () => {
  assert.deepEqual(readingBlocks('## The heart\n\nIt pumps blood.\nAll day.\n\n\n## Rates'), [
    { heading: true, text: 'The heart' },
    { heading: false, text: 'It pumps blood.\nAll day.' },
    { heading: true, text: 'Rates' },
  ]);
  assert.deepEqual(readingBlocks(null), []);
});

test('speech is cut into sentence-sized pieces no longer than the limit', () => {
  assert.deepEqual(speechChunks('One. Two!  Three?', 220), ['One. Two! Three?']);
  const long = `${'word '.repeat(100)}end.`;
  const chunks = speechChunks(long, 60);
  assert.ok(chunks.length > 1 && chunks.every((c) => c.length <= 60));
  assert.equal(chunks.join(' '), long.replace(/\s+/g, ' ').trim());
  assert.deepEqual(speechChunks(''), []);
});

test('the voice is English, Canadian first, natural-sounding when there is a choice', () => {
  const v = (name, lang) => ({ name, lang });
  assert.equal(pickVoice([v('Hindi', 'hi-IN'), v('US', 'en-US'), v('CA', 'en-CA')]).name, 'CA');
  assert.equal(pickVoice([v('Plain US', 'en-US'), v('Microsoft Aria Online (Natural)', 'en-US')]).name, 'Microsoft Aria Online (Natural)');
  assert.equal(pickVoice([v('Aussie', 'en-AU')]).name, 'Aussie');
  assert.equal(pickVoice([v('French', 'fr-FR')]), null);
});

test('medical terms are marked once, whole words only, longest match first, any case', () => {
  const terms = [{ term: 'cardia' }, { term: 'Tachycardia' }, { term: 'BP' }];
  const seen = new Set();
  const parts = markTerms('Tachycardia means a fast rate. tachycardia again. BPM is not BP.', terms, seen);
  assert.deepEqual(parts.map((p) => (typeof p === 'string' ? p : `[${p.text}]`)).join(''),
    '[Tachycardia] means a fast rate. tachycardia again. BPM is not [BP].');
  assert.deepEqual(markTerms('More tachycardia.', terms, seen), ['More tachycardia.']);
  assert.deepEqual(markTerms('Plain text.', []), ['Plain text.']);
  assert.deepEqual(markTerms('a (1+1) b', [{ term: '(1+1)' }]).length, 3);
});

test('recorded audio: lesson clips by text, term clips by name, nothing when there is no audio', async () => {
  const { loadRecordedAudio } = await import('../src/scripts/learn-helpers.mjs');
  const files = {
    'c/l/index.json': { clips: [{ key: 'Hello there.', file: 'aaaaaaaaaaaaaaaa.mp3' }, { key: 'Bad', file: '../evil.mp3' }] },
    'c/terms/index.json': { clips: [{ key: 'edema', file: 'bbbbbbbbbbbbbbbb.mp3' }] },
  };
  const client = (store) => ({ storage: { from: () => ({
    download: async (path) => (store[path] ? { data: { text: async () => JSON.stringify(store[path]) } } : { error: new Error('Object not found') }),
    createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ signedUrl: `https://signed/${p}` })) }),
  }) } });
  const audio = await loadRecordedAudio(client(files), 'c', 'l');
  assert.deepEqual([...audio.text], [['Hello there.', 'https://signed/c/l/aaaaaaaaaaaaaaaa.mp3']]);
  assert.deepEqual([...audio.terms], [['edema', 'https://signed/c/terms/bbbbbbbbbbbbbbbb.mp3']]);
  const empty = await loadRecordedAudio(client({}), 'c', 'l');
  assert.equal(empty.text.size + empty.terms.size, 0);
});

test('spoken text fixes abbreviations voices misread, without touching other words', async () => {
  const { spokenText } = await import('../src/scripts/learn-reading.mjs');
  assert.equal(spokenText('Peripheral IV therapy. IVs and PIVs. An older adult with a 22G PIV.'),
    'Peripheral I.V. therapy. I.V.s and P I Vs. An older adult with a 22 gauge P I V.');
  assert.equal(spokenText("WHO's 2024 guideline; Geeky Medics OSCE Guide"), "W H O's 2024 guideline; Geeky Medics O S C E Guide");
  assert.equal(spokenText('Sodium (Na+): balance. Calcium (Ca2+) and Mg (Mg2+), Potassium (K+).'), 'Sodium: balance. Calcium and Mg, Potassium.');
  assert.equal(spokenText('Ivy, IVORY, who, Lecture 4, 0.9% sodium chloride'), 'Ivy, IVORY, who, Lecture 4, 0.9% sodium chloride');
});

test('recall and wrap-up questions are read from the lesson text', async () => {
  const { readingBlocks, parseRecall, recallPrompt, recallSeconds } = await import('../src/scripts/learn-reading.mjs');
  const blocks = readingBlocks('Intro.\n\nRecall: Would it still work?\nYes\n*No\nWhy: Because.\n\nWrap-up: Which is first?\nA\n*B\nC');
  assert.equal(blocks[0].recall, undefined);
  assert.deepEqual(blocks[1].recall, { wrapUp: false, question: 'Would it still work?', options: ['Yes', 'No'], correct: 1, why: 'Because.' });
  assert.deepEqual(blocks[2].recall, { wrapUp: true, question: 'Which is first?', options: ['A', 'B', 'C'], correct: 1, why: '' });
  // Not valid: no right answer, two right answers, one answer. These stay plain paragraphs.
  assert.equal(parseRecall('Recall: Q?\nYes\nNo'), null);
  assert.equal(parseRecall('Recall: Q?\n*Yes\n*No'), null);
  assert.equal(parseRecall('Recall: Q?\n*Yes'), null);
  assert.equal(parseRecall('Recalling the steps: first, second.'), null);
  assert.equal(recallPrompt(blocks[1].recall), 'Would it still work?');
  assert.equal(recallPrompt(blocks[2].recall), 'Which is first? A. B. C.');
  assert.equal(recallSeconds(blocks[1].recall), 15);
  assert.equal(recallSeconds({ question: 'word '.repeat(80), options: ['a', 'b'] }), 30);
});

test('an image line becomes an image block; anything else stays text', async () => {
  const { readingBlocks } = await import('../src/scripts/learn-reading.mjs');
  const [img, notHttps, inline] = readingBlocks('![Gauge sizes and colours](https://x.supabase.co/a/b.svg)\n\n![x](http://insecure/a.png)\n\nSee ![x](https://a/b.png) here.');
  assert.deepEqual(img.image, { alt: 'Gauge sizes and colours', src: 'https://x.supabase.co/a/b.svg' });
  assert.equal(notHttps.image, undefined);
  assert.equal(inline.image, undefined);
});
