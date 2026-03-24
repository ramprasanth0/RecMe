import type { TMDBTrendingResponse } from "@/types/tmdb";

const TMDB_BASE = "https://api.themoviedb.org/3";

// TMDB genre ID → name mapping (movies)
const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

export interface TMDBMovieData {
  tmdbId: number;
  posterPath: string | null;
  genres: string[];
  rating: number | null;
  synopsis: string | null;
}

/**
 * Search TMDB for a movie by title + optional year.
 * Returns verified metadata including poster, genres, rating, and synopsis.
 * Always excludes adult content.
 */
export async function searchMovieTMDB(
  title: string,
  year?: number
): Promise<TMDBMovieData | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  // Try with year first for precision, then without as fallback
  const attempts = year
    ? [`query=${encodeURIComponent(title)}&year=${year}`, `query=${encodeURIComponent(title)}`]
    : [`query=${encodeURIComponent(title)}`];

  for (const params of attempts) {
    try {
      const res = await fetch(
        `${TMDB_BASE}/search/movie?api_key=${apiKey}&${params}&include_adult=false&language=en-US`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const movie = data.results?.[0];
      if (!movie) continue;

      return {
        tmdbId: movie.id,
        posterPath: movie.poster_path ?? null,
        genres: (movie.genre_ids ?? [])
          .map((id: number) => GENRE_MAP[id])
          .filter(Boolean) as string[],
        rating: movie.vote_average ?? null,
        synopsis: movie.overview ?? null,
      };
    } catch {
      // continue to next attempt
    }
  }

  return null;
}

export async function getTrendingMovies(): Promise<TMDBTrendingResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY not set");

  const res = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${apiKey}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json();
}

export function getPosterUrl(path: string | null, size = "w500"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
