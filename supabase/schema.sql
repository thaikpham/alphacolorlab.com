-- Sony Camera Memory Recall Crowd Game Submissions
-- Run once in the Supabase SQL editor to set up the submissions table

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  model TEXT NOT NULL CHECK (model IN ('zve10', 'a6400')),
  firmware TEXT CHECK (CHAR_LENGTH(firmware) <= 16),
  region TEXT CHECK (region IN ('pal', 'ntsc')),
  nickname TEXT CHECK (CHAR_LENGTH(nickname) <= 32),
  lang TEXT NOT NULL CHECK (lang IN ('vi', 'en')),
  score INT NOT NULL CHECK (score >= 0 AND score <= 1000),
  duration_ms INT CHECK (duration_ms >= 0 AND duration_ms <= 86400000),
  retries INT CHECK (retries >= 0 AND retries <= 20),
  app_version TEXT CHECK (CHAR_LENGTH(app_version) <= 32),
  payload JSONB NOT NULL CHECK (octet_length(payload::text) < 150000)
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can only INSERT
DROP POLICY IF EXISTS submissions_anon_insert ON public.submissions;
CREATE POLICY submissions_anon_insert ON public.submissions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Revoke SELECT, UPDATE, DELETE from anonymous users
REVOKE ALL ON public.submissions FROM anon, authenticated;
GRANT INSERT ON public.submissions TO anon;

-- Comment: Export by running "SELECT payload FROM public.submissions WHERE created_at > now() - interval '1 day'" in SQL editor
-- or use Table editor › Export CSV
COMMENT ON TABLE public.submissions IS 'Game submissions. Export via SQL: SELECT payload FROM submissions WHERE created_at > now() - interval ''7 days''';
