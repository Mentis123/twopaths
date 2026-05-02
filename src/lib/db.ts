import "server-only";

import { neon } from "@neondatabase/serverless";
import type { LessonSession, Topic, Tradition } from "@/lib/types";

type SqlClient = ReturnType<typeof neon>;

let cachedSql: SqlClient | null | undefined;
let schemaReady = false;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function sql() {
  if (cachedSql !== undefined) {
    return cachedSql;
  }

  cachedSql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
  return cachedSql;
}

export async function ensureSchema() {
  const db = sql();

  if (!db || schemaReady) {
    return Boolean(db);
  }

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      preferred_name text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS preferences (
      user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferred_voice text NOT NULL DEFAULT 'ara',
      speech_speed text NOT NULL DEFAULT 'normal',
      default_mode text NOT NULL DEFAULT 'listen',
      preferred_session_length integer NOT NULL DEFAULT 5,
      show_text boolean NOT NULL DEFAULT true,
      tradition_bias text NOT NULL DEFAULT 'balanced',
      voice_provider text NOT NULL DEFAULT 'xai',
      voice_id text NOT NULL DEFAULT 'ara',
      audio_first boolean NOT NULL DEFAULT true
    )
  `;

  await db`
    ALTER TABLE preferences
    ALTER COLUMN preferred_voice SET DEFAULT 'ara'
  `;

  await db`
    ALTER TABLE preferences
    ALTER COLUMN speech_speed TYPE text
    USING CASE
      WHEN speech_speed::text IN ('slower', 'normal', 'faster') THEN speech_speed::text
      WHEN speech_speed::text ~ '^[0-9.]+$' THEN CASE
        WHEN (speech_speed::text)::numeric < 1 THEN 'slower'
        WHEN (speech_speed::text)::numeric > 1 THEN 'faster'
        ELSE 'normal'
      END
      ELSE 'normal'
    END
  `;

  await db`
    ALTER TABLE preferences
    ALTER COLUMN speech_speed SET DEFAULT 'normal'
  `;

  await db`
    ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS voice_provider text NOT NULL DEFAULT 'xai'
  `;

  await db`
    ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS voice_id text NOT NULL DEFAULT 'ara'
  `;

  await db`
    ALTER TABLE preferences
    ADD COLUMN IF NOT EXISTS audio_first boolean NOT NULL DEFAULT true
  `;

  await db`
    CREATE TABLE IF NOT EXISTS topics (
      id text PRIMARY KEY,
      tradition text NOT NULL,
      title text NOT NULL,
      summary text NOT NULL,
      difficulty text NOT NULL,
      generated_at timestamptz NOT NULL DEFAULT now(),
      source_notes jsonb NOT NULL DEFAULT '{}'::jsonb
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tradition text NOT NULL,
      topic text NOT NULL,
      mode text NOT NULL,
      lesson_script text,
      audio_asset_id text,
      voice_id text NOT NULL DEFAULT 'ara',
      created_at timestamptz NOT NULL DEFAULT now(),
      completed boolean NOT NULL DEFAULT false,
      enjoyment_rating integer
    )
  `;

  await db`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS lesson_script text
  `;

  await db`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS audio_asset_id text
  `;

  await db`
    ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS voice_id text NOT NULL DEFAULT 'ara'
  `;

  await db`
    CREATE TABLE IF NOT EXISTS audio_assets (
      id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      session_id text REFERENCES sessions(id) ON DELETE SET NULL,
      tradition text NOT NULL,
      topic text NOT NULL,
      voice_id text NOT NULL DEFAULT 'ara',
      script_hash text NOT NULL,
      audio_url text NOT NULL,
      duration_seconds integer,
      provider text NOT NULL DEFAULT 'xai',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS favourites (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic text NOT NULL,
      tradition text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await db`
    INSERT INTO users (id, name, preferred_name)
    VALUES ('dad', 'Dad', 'Dad')
    ON CONFLICT (id) DO NOTHING
  `;

  await db`
    INSERT INTO preferences (user_id)
    VALUES ('dad')
    ON CONFLICT (user_id) DO NOTHING
  `;

  schemaReady = true;
  return true;
}

export async function saveTopics(topics: Topic[]) {
  const db = sql();

  if (!db || topics.length === 0) {
    return false;
  }

  await ensureSchema();

  for (const topic of topics) {
    await db`
      INSERT INTO topics (id, tradition, title, summary, difficulty, source_notes)
      VALUES (
        ${topic.id},
        ${topic.tradition},
        ${topic.title},
        ${topic.summary},
        ${topic.difficulty},
        ${JSON.stringify({ visual: topic.visual })}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  return true;
}

export async function saveSession({
  session,
  userId = "dad",
}: {
  session: LessonSession;
  userId?: string;
}) {
  const db = sql();

  if (!db) {
    return false;
  }

  await ensureSchema();

  await db`
    INSERT INTO sessions (
      id,
      user_id,
      tradition,
      topic,
      mode,
      lesson_script,
      voice_id,
      completed
    )
    VALUES (
      ${session.id},
      ${userId},
      ${session.tradition},
      ${session.topic.title},
      ${session.mode},
      ${session.script},
      ${session.voiceId || "ara"},
      true
    )
    ON CONFLICT (id) DO NOTHING
  `;

  return true;
}

export async function recentSessions(userId = "dad") {
  const db = sql();

  if (!db) {
    return [];
  }

  await ensureSchema();

  const rows = await db`
    SELECT id, tradition, topic, mode, created_at
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 6
  `;

  return rows as Array<{
    id: string;
    tradition: Tradition;
    topic: string;
    mode: string;
    created_at: string;
  }>;
}
