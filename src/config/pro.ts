/**
 * Central configuration for Pro-gated features.
 * Add new features here to gate them behind the Pro plan.
 */

export interface ProFeature {
  id: string;
  label: string;
  description: string;
}

export const PRO_FEATURES: Record<string, ProFeature> = {
  ai_playlist: {
    id: "ai_playlist",
    label: "AI Playlist Generator",
    description: "Generate custom Spotify playlists powered by AI based on your mood and preferences.",
  },
  // Future Pro features go here, e.g.:
  // ai_movie_list: { id: "ai_movie_list", label: "AI Movie Watchlist", description: "..." },
} as const;

/** Check if a feature is Pro-gated */
export function isProFeature(featureId: string): boolean {
  return featureId in PRO_FEATURES;
}
