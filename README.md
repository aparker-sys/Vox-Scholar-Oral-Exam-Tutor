# Vox Scholar

**Vox Scholar** is an oral exam tutor app with a React frontend and Node.js backend. It helps you practice with AI-generated questions, voice (TTS) coaching, and timers for think and answer phases.

## Features

- **Subjects & library** — Organize materials by subject; upload PDFs and other files.
- **AI-generated questions** — Questions are generated from your uploads using OpenAI.
- **Voice tutor (Charlotte)** — Text-to-speech for questions and feedback (OpenAI TTS).
- **Practice sessions** — Configurable think time and answer time with countdowns.
- **Speech recognition** — Optional voice input for answers.
- **Performance & weak areas** — Track progress and focus on topics that need work.
- **User accounts** — Sign up, sign in, and user-scoped data (SQLite + JWT).

## Tech stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3), JWT, bcrypt, multer
- **Frontend:** React 18, Vite, PDF.js
- **AI / voice:** OpenAI API (question generation + TTS)

## Prerequisites

- **Node.js** 18 or newer
- **OpenAI API key** — used for question generation and TTS ([get one here](https://platform.openai.com/api-keys))

## Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd oral-exam-tutor
   npm install
   cd client && npm install && cd ..
   ```

2. **Environment**

   Copy the example env file and add your OpenAI key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:

   - `OPENAI_API_KEY` — **required** for generating questions and for Charlotte’s voice (TTS).

   Optional TTS tuning (see `.env.example`):

   - `TTS_VOICE` — e.g. `shimmer`, `nova`, `alloy`, `coral`
   - `TTS_INSTRUCTIONS` — custom tone (for supported TTS models)

   For production, also set:

   - `JWT_SECRET` — use a long, random secret
   - `JWT_EXPIRY` — e.g. `30d`
   - `DB_PATH` — path to SQLite DB (default: `data/voxscholar.db`)
   - `PORT` — server port (default: 3000)

3. **Run**

   **Development** (API on port 3001, Vite dev server with proxy to `/api`):

   ```bash
   npm run dev
   ```

   **Production**

   ```bash
   npm run build
   npm start
   ```

   The API runs on `PORT` (default 3000). In dev, the Vite app proxies `/api` to `http://localhost:3001`.

## Scripts

| Script           | Description                                      |
|------------------|--------------------------------------------------|
| `npm run dev`    | Run API (port 3001) and client dev server        |
| `npm run dev:server` | Run API only                                |
| `npm run dev:client` | Run Vite client only                        |
| `npm run build`  | Install client deps and build client for production |
| `npm start`      | Run API only (serve built client if configured) |

## Deployment (Railway)

The repo includes a `railway.json` with:

- **Build:** `npm run build`
- **Health check:** `/api/health`

On Railway, set `OPENAI_API_KEY` (and optionally `JWT_SECRET`, `DB_PATH`, `PORT`) in Project → Variables.

## License

Private / unlicensed unless otherwise specified.
