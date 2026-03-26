-- Add Spotify token expiry timestamp so the app only refreshes when actually needed
-- Run this migration in the Supabase dashboard or via the CLI:
--   supabase db push  /  supabase migration up

alter table users
  add column if not exists spotify_token_expires_at timestamptz;
