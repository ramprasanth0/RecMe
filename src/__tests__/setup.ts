// Global env stubs so modules that read process.env at import time don't throw
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.TMDB_API_KEY = "test-tmdb-key";
process.env.SPOTIFY_CLIENT_ID = "test-spotify-id";
process.env.SPOTIFY_CLIENT_SECRET = "test-spotify-secret";
process.env.GEMINI_API_KEY = "test-gemini-key";
