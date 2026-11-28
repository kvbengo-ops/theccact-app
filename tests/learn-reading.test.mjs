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
