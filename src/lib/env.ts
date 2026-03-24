/** Typed environment variable access with validation */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  spotify: {
    clientId: () => required("SPOTIFY_CLIENT_ID"),
    clientSecret: () => required("SPOTIFY_CLIENT_SECRET"),
    redirectUri: () => required("SPOTIFY_REDIRECT_URI"),
  },
  tmdb: {
    apiKey: () => required("TMDB_API_KEY"),
  },
  gemini: {
    apiKey: () => required("GEMINI_API_KEY"),
  },
  supabase: {
    url: () => required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  },
  app: {
    nextAuthSecret: () => required("NEXTAUTH_SECRET"),
    nextAuthUrl: () => optional("NEXTAUTH_URL", "http://localhost:3000"),
  },
} as const;
