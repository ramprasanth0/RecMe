import type { TMDBTrendingResponse } from "@/types/tmdb";

const TMDB_BASE = "https://api.themoviedb.org/3";

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
