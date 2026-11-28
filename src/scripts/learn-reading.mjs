// Reading tools for lessons: read aloud (browser voice) and medical-term lookups. No DOM here, so it can be tested.

// Lesson text: blank lines separate blocks; a block starting with "## " is a heading.
export function readingBlocks(text) {
  return String(text ?? '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
    .map((block) => (block.startsWith('## ') ? { heading: true, text: block.slice(3).trim() } : { heading: false, text: block }));
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
