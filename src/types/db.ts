export interface DBUser {
  id: string;
  email: string | null;
  spotify_id: string | null;
  spotify_access_token: string | null;
  spotify_refresh_token: string | null;
  spotify_token_expires_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  preferences: {
    music_genres?: string[];
    movie_genres?: string[];
    mood?: string;
    default_landing?: "music" | "movies";
  };
  created_at: string;
}

export interface DBRecommendation {
  id: string;
  user_id: string;
  type: "music" | "movie";
  item_data: Record<string, unknown>;
  saved_at: string;
}
