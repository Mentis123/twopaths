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
      preferred_voice text NOT NULL DEFAULT 'Kore',
      speech_speed numeric NOT NULL DEFAULT 1.0,
      default_mode text NOT NULL DEFAULT 'listen',
      preferred_session_length integer NOT NULL DEFAULT 5,
      show_text boolean NOT NULL DEFAULT true,
      tradition_bias text NOT NULL DEFAULT 'balanced'
    )
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
      created_at timestamptz NOT NULL DEFAULT now(),
      completed boolean NOT NULL DEFAULT false,
      enjoyment_rating integer
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
        ${JSON.stringify({
          visual: topic.visual,
          cluster: topic.cluster,
          keyLine: topic.keyLine,
          sourceTitle: topic.sourceTitle,
          researchId: topic.researchId,
        })}::jsonb
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
    INSERT INTO sessions (id, user_id, tradition, topic, mode, completed)
    VALUES (
      ${session.id},
      ${userId},
      ${session.tradition},
      ${session.topic.title},
      ${session.mode},
      true
    )
    ON CONFLICT (id) DO NOTHING
  `;

  return true;
}

export type Preferences = {
  preferred_voice: string;
  speech_speed: number;
  default_mode: string;
  preferred_session_length: number;
  show_text: boolean;
  tradition_bias: string;
};

export async function getPreferences(userId = "dad"): Promise<Preferences | null> {
  const db = sql();

  if (!db) {
    return null;
  }

  await ensureSchema();

  const rows = (await db`
    SELECT preferred_voice, speech_speed, default_mode, preferred_session_length, show_text, tradition_bias
    FROM preferences
    WHERE user_id = ${userId}
    LIMIT 1
  `) as unknown as Preferences[];

  return rows[0] ?? null;
}

export async function savePreferences(
  userId: string,
  prefs: Partial<Preferences>,
): Promise<boolean> {
  const db = sql();

  if (!db) {
    return false;
  }

  await ensureSchema();

  const current = (await getPreferences(userId)) ?? {
    preferred_voice: "Kore",
    speech_speed: 1.0,
    default_mode: "listen",
    preferred_session_length: 5,
    show_text: true,
    tradition_bias: "balanced",
  };

  const merged = { ...current, ...prefs };

  await db`
    UPDATE preferences SET
      preferred_voice = ${merged.preferred_voice},
      speech_speed = ${merged.speech_speed},
      default_mode = ${merged.default_mode},
      preferred_session_length = ${merged.preferred_session_length},
      show_text = ${merged.show_text},
      tradition_bias = ${merged.tradition_bias}
    WHERE user_id = ${userId}
  `;

  return true;
}

export async function recentSessions(userId = "dad") {
  const db = sql();

  if (!db) {
    return [];
  }

  await ensureSchema();

  const sessions = await db`
    SELECT id, tradition, topic, mode, created_at
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 6
  `;

  return sessions as {
    id: string;
    tradition: Tradition;
    topic: string;
    mode: string;
    created_at: string;
  }[];
}
