CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  preferred_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
);

CREATE TABLE IF NOT EXISTS topics (
  id text PRIMARY KEY,
  tradition text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  difficulty text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_notes jsonb NOT NULL DEFAULT '{}'::jsonb
);

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
);

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
);

CREATE TABLE IF NOT EXISTS favourites (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  tradition text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO users (id, name, preferred_name)
VALUES ('dad', 'Dad', 'Dad')
ON CONFLICT (id) DO NOTHING;

INSERT INTO preferences (user_id)
VALUES ('dad')
ON CONFLICT (user_id) DO NOTHING;
