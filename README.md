# Two Paths

Two Paths is a calm, audio-led spiritual learning app for daily reflections across Judaism and Buddhism.

## MVP

- Split-symbol landing page for choosing Judaism or Buddhism.
- 4 daily topic cards generated through Gemini, with starter fallback topics when no key is configured.
- Short narrated lesson generation with Gemini TTS when `GEMINI_API_KEY` is present.
- Browser speech fallback for local demos without an API key.
- Gentle multiple-choice question, simpler explanation, repeat, pause, and finish controls.
- Optional Neon Postgres persistence for topics, sessions, preferences, and favourites.

## Environment variables

Use this in Vercel for the Google/Gemini API key:

```bash
GEMINI_API_KEY=your_google_ai_studio_key
```

Optional:

```bash
DATABASE_URL=your_neon_pooled_connection_string
GEMINI_TEXT_MODEL=gemini-3-flash-preview
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
```

Do not prefix the Gemini key with `NEXT_PUBLIC_`; the app only reads it inside server route handlers.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Neon schema

The app creates tables automatically on first API use when `DATABASE_URL` is configured. The same schema is available at `neon/schema.sql` if you prefer running it manually.
