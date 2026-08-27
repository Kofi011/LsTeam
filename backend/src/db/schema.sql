CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  overview TEXT,
  duration_sec INTEGER,
  engine_used VARCHAR(50),
  language VARCHAR(50),
  file_name VARCHAR(255),
  transcript TEXT,
  key_concepts JSONB DEFAULT '[]',
  main_arguments JSONB DEFAULT '[]',
  important_terms JSONB DEFAULT '[]',
  study_notes JSONB DEFAULT '[]',
  key_takeaways JSONB DEFAULT '[]',
  revision_questions JSONB DEFAULT '[]',
  notes_markdown TEXT,
  tutor_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
