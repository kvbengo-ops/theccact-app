# Kokoro voice service

Reads lesson text aloud with the open-source Kokoro voice (model `onnx-community/Kokoro-82M-v1.0-ONNX`, 8-bit, about 90 MB, Apache-2.0). Runs on CPU; no GPU needed.

When the site is built with `PUBLIC_TTS_URL`, the lesson page's **Listen** and **Say it** buttons use this service. Without it, or if the service is down, they use the device's own voice.

## Try it locally (Windows, PowerShell)

1. Install once: `npm --prefix tts-server install`
2. Start the voice (first start downloads the model): `npm run tts`. Leave it running; it serves `http://localhost:8880`.
3. In a second terminal, build the site pointing at it, then preview:
   ```powershell
   $env:PUBLIC_TTS_URL='http://localhost:8880'; npm run build; Remove-Item Env:PUBLIC_TTS_URL; npm run preview
   ```
4. Open a lesson at http://localhost:4321/learn/ and press **Listen to this lesson**.

On a laptop each sentence takes a few seconds to make, so expect short pauses before long paragraphs. Production will make the audio once per lesson and store it, so students never wait.

## API

- `POST /speak` with `{ "text": "...", "voice": "af_heart", "speed": 1 }` returns `audio/wav`. Text is 1 to 1000 characters.
- `GET /health` returns `{ "ok": true, "voice": "af_heart" }`.

## Settings

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8880` | |
| `TTS_KEY` | empty | When set, callers must send `Authorization: Bearer <key>`. **Always set it on Lightsail.** |
| `TTS_ALLOW_ORIGINS` | `http://localhost:4321` | Browser origins allowed to call it, comma-separated. |
| `TTS_VOICE` | `af_heart` | Other English voices: `af_bella`, `af_nicole`, `am_michael`, `bf_emma`, `bm_george` and more. |

## Lightsail (later)

Ubuntu instance with 2 vCPU / 4 GB or more. Install Node 20+, copy this folder, `npm install`, then run `node server.mjs` under systemd with `TTS_KEY` set. Put it behind HTTPS (Caddy or the Lightsail load balancer) and allow only the owner console and Netlify functions to call it. Students should play stored audio files, not call this service directly.
