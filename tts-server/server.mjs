// Kokoro text-to-speech for the Learning Portal.
// Local test: `npm start` (http://localhost:8880). Lightsail: same file, with TTS_KEY set and the port behind HTTPS.
//
//   POST /speak  { "text": "...", "voice": "af_heart", "speed": 1 }  ->  audio/wav
//   GET  /health                                                     ->  { ok, voice }
//
// Settings (environment variables):
//   PORT               default 8880
//   TTS_KEY            when set, callers must send "Authorization: Bearer <key>" (always set it on Lightsail)
//   TTS_ALLOW_ORIGINS  comma-separated browser origins allowed to call it (default http://localhost:4321)
//   TTS_VOICE          default voice (default af_heart)
import http from 'node:http';
import { KokoroTTS } from 'kokoro-js';

const PORT = Number(process.env.PORT || 8880);
const KEY = process.env.TTS_KEY || '';
const ORIGINS = (process.env.TTS_ALLOW_ORIGINS || 'http://localhost:4321').split(',').map((o) => o.trim()).filter(Boolean);
const MAX_TEXT = 1000;
const MAX_BODY = 8 * 1024;

console.log('Loading Kokoro (first start downloads the model, about 90 MB)…');
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const VOICES = new Set(Object.keys(tts.voices));
const DEFAULT_VOICE = VOICES.has(process.env.TTS_VOICE) ? process.env.TTS_VOICE : 'af_heart';

// Same sentence asked again (a "Say it" tap, a replay) comes from memory.
// ponytail: in-memory cache of 300 clips, lost on restart; audio files made once per lesson replace this in production.
const cache = new Map();
const remember = (key, value) => {
  cache.set(key, value);
  if (cache.size > 300) cache.delete(cache.keys().next().value);
};

// One clip at a time: parallel runs on a small CPU only make every request slower.
let queue = Promise.resolve();
const speak = (text, voice, speed) => {
  const key = `${voice}|${speed}|${text}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  const job = queue.then(async () => {
    const audio = await tts.generate(text, { voice, speed });
    const wav = Buffer.from(audio.toWav());
    remember(key, wav);
    return wav;
  });
  queue = job.catch(() => {});
  return job;
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
};
const json = (res, status, value, headers) => send(res, status, JSON.stringify(value), { 'Content-Type': 'application/json', ...headers });

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = origin && ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', Vary: 'Origin' }
    : {};
  if (req.method === 'OPTIONS') return send(res, 204, '', cors);
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, voice: DEFAULT_VOICE }, cors);
  if (req.method !== 'POST' || req.url !== '/speak') return json(res, 404, { error: 'Not found' }, cors);
  if (KEY && req.headers.authorization !== `Bearer ${KEY}`) return json(res, 401, { error: 'Unauthorized' }, cors);

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) return json(res, 413, { error: 'Too large' }, cors);
  }
  let body;
  try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid JSON' }, cors); }
  const text = String(body?.text ?? '').replace(/\s+/g, ' ').trim();
  const voice = VOICES.has(body?.voice) ? body.voice : DEFAULT_VOICE;
  const speed = Math.min(2, Math.max(0.5, Number(body?.speed) || 1));
  if (!text || text.length > MAX_TEXT) return json(res, 400, { error: `Text must be 1 to ${MAX_TEXT} characters` }, cors);

  try {
    const wav = await speak(text, voice, speed);
    send(res, 200, wav, { 'Content-Type': 'audio/wav', ...cors });
  } catch (error) {
    console.error('Speech failed:', error?.message);
    json(res, 500, { error: 'Speech failed' }, cors);
  }
});

server.listen(PORT, () => console.log(`Kokoro TTS ready on http://localhost:${PORT} (voice ${DEFAULT_VOICE}${KEY ? ', key required' : ''})`));
