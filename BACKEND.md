# Backend (Node + Express + SQLite)

The app can run with or without the backend.

- **Without backend:** Open `index.html` in a browser (or use a static host). Data is stored in the browser (localStorage + IndexedDB).
- **With backend:** Run the server; open `http://localhost:3000`. Data is stored in SQLite and shared across devices/browsers.

## Run locally

1. Install Node.js (v18 or newer) from [nodejs.org](https://nodejs.org).
2. In the project folder, install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
3. Open **http://localhost:3000** in your browser.

The SQLite database is created at `data/voxscholar.db` (you can set `DB_PATH` to change it). Port is 3000 by default; set `PORT` to change it.

## Production (one platform)

To host both the frontend and backend together:

1. **Railway** or **Render** — deploy this repo as a Node app. Set start command to `npm start`. They will run `node server.js`, serve the app, and persist the SQLite file (or use their persistent disk).
2. **Netlify** — does not run a long-lived Node server; it’s for static sites. So for the full stack (frontend + this backend), use Railway or Render instead.

The app detects the backend automatically: if it can reach `/api/health`, it uses the API; otherwise it uses localStorage and IndexedDB.

## Text-to-speech (TTS)

For more natural-sounding voice, the server uses **OpenAI TTS**. The API key is only on the server; the client never sees it.

1. Copy `.env.example` to `.env` in the project root.
2. In `.env`, set your key:
   - `OPENAI_API_KEY=sk-your-key-here` (or use `TTS_API_KEY` if you prefer a separate key).
3. Restart the server. The app loads `.env` automatically (via `dotenv`).

Optional in `.env`: `TTS_MODEL=tts-1-hd`, `TTS_VOICE=alloy` (or `nova`, `shimmer`, etc.).

If no key is set, the app falls back to the browser’s built-in speech. The frontend calls `POST /api/tts` and plays the returned MP3; the “speaking” state still drives the wave animation.

## Charlotte chat (LLM)

The same `OPENAI_API_KEY` is used for **Charlotte’s conversational replies**. `POST /api/chat` accepts `{ "message": "user text", "history": [] }` and returns `{ "reply": "..." }` using OpenAI chat (default model: `gpt-4o-mini`). Optional in `.env`: `CHAT_MODEL=gpt-4o` for a stronger model.
