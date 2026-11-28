// Reading tools for lessons: read aloud (browser voice) and medical-term lookups. No DOM here, so it can be tested.

// Recorded clips are matched to text with this, both when recording (tts-server/generate.mjs) and when playing.
export const normalizeSpeech = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

// How to say text that voices misread. Applied only to speech; students still see the original text.
// Kokoro reads "IV" as "roman four" and "WHO" as "who". Add a rule when a recording mispronounces something.
const SAY = [
  [/\s*\((?:Na|K|Ca2?|Mg2?)\+\)/g, ''], // "Sodium (Na+)": the name is already said
  [/\bPIV(s?)\b/g, 'P I V$1'],
  [/\bIVs\b/g, 'I.V.s'],
  [/\bIV\b/g, 'I.V.'],
  [/\bWHO(?=['’]s\b|\b)/g, 'W H O'],
  [/\bOSCE\b/g, 'O S C E'],
  [/\b(\d{2})G\b/g, '$1 gauge'],
];
export const spokenText = (text) => SAY.reduce((said, [pattern, replacement]) => said.replace(pattern, replacement), String(text ?? ''));

// Lesson text: blank lines separate blocks; a block starting with "## " is a heading.
// A block starting with "Recall:" (shown in place) or "Wrap-up:" (shown as a pop-up at Mark as done) is a practice question:
//   Recall: But what if ... would it still work?
//   Yes
//   *No            <- the * marks the one right answer
//   Why: ...       <- optional, shown after answering
export function readingBlocks(text) {
  return String(text ?? '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
    .map((block) => {
      if (block.startsWith('## ')) return { heading: true, text: block.slice(3).trim() };
      const recall = parseRecall(block);
      return recall ? { heading: false, text: block, recall } : { heading: false, text: block };
    });
}

export function parseRecall(block) {
  const kind = String(block ?? '').match(/^(Recall|Wrap-up):\s*/i);
  if (!kind) return null;
  const lines = block.slice(kind[0].length).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const question = lines.shift();
  const why = (lines.find((line) => /^Why:/i.test(line)) ?? '').replace(/^Why:\s*/i, '');
  const answers = lines.filter((line) => !/^Why:/i.test(line));
  const correct = answers.findIndex((line) => line.startsWith('*'));
  // Not a valid question (fewer than two answers, or not exactly one marked right): show it as a plain paragraph.
  if (!question || answers.length < 2 || correct < 0 || answers.filter((line) => line.startsWith('*')).length !== 1) return null;
  return { wrapUp: /^wrap/i.test(kind[1]), question, options: answers.map((line) => line.replace(/^\*\s*/, '')), correct, why };
}

// What the voice says for a question: just the question for yes/no, otherwise the choices too.
export function recallPrompt({ question, options }) {
  const yesNo = options.every((option) => /^(yes|no|true|false)$/i.test(option));
  return yesNo ? question : `${question} ${options.map((option) => option.replace(/[.?!]*$/, '.')).join(' ')}`;
}

// Time to answer: about 3 words a second, between 15 and 30 seconds.
export function recallSeconds({ question, options }) {
  const words = `${question} ${options.join(' ')}`.split(/\s+/).length;
  return Math.min(30, Math.max(15, Math.round(words / 3) + 8));
}

// Browsers cut off long utterances (Chrome stops after about 15 seconds), so speak sentence-sized pieces.
export function speechChunks(text, max = 220) {
  const pieces = [];
  for (const sentence of String(text ?? '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:])\s+/)) {
    let rest = sentence;
    while (rest.length > max) {
      const cut = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf(' ', max));
      const at = cut > max / 2 ? cut + 1 : max;
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }
  // Pack short sentences together so the voice does not pause after every one.
  const chunks = [];
  for (const piece of pieces) {
    if (chunks.length && chunks.at(-1).length + 1 + piece.length <= max) chunks[chunks.length - 1] += ` ${piece}`;
    else chunks.push(piece);
  }
  return chunks;
}

// Prefer a natural-sounding English voice: Canadian, then US, then British, then any English.
export function pickVoice(voices = []) {
  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  const natural = (voice) => /natural|online|google|premium|enhanced/i.test(voice.name);
  for (const lang of ['en-CA', 'en-US', 'en-GB']) {
    const matches = english.filter((voice) => voice.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    const best = matches.find(natural) ?? matches[0];
    if (best) return best;
  }
  return english.find(natural) ?? english[0] ?? null;
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Split text into plain strings and { term } pieces, marking only the first time each term appears (tracked in `seen`).
export function markTerms(text, terms = [], seen = new Set()) {
  const list = terms.filter((t) => t.term?.trim()).sort((a, b) => b.term.length - a.term.length);
  if (!list.length) return [text];
  const byName = new Map(list.map((t) => [t.term.toLowerCase(), t]));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${list.map((t) => escape(t.term)).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const term = byName.get(match[0].toLowerCase());
    if (!term || seen.has(term.term.toLowerCase())) continue;
    seen.add(term.term.toLowerCase());
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push({ term, text: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
