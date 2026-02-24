CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'url',
  interactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
