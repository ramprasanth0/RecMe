import { NextRequest } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

/** GET /api/tmdb/poster?id=123 — fetch poster path for a movie */
export async function GET(request: NextRequest) {
  const tmdbId = request.nextUrl.searchParams.get("id");
  if (!tmdbId) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "TMDB not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/${tmdbId}?api_key=${apiKey}`,
      { next: { revalidate: 86400 } } // cache 24h
    );

    if (!res.ok) {
      return Response.json({ posterPath: null });
    }

    const data = await res.json();
    return Response.json({
      posterPath: data.poster_path || null,
      backdropPath: data.backdrop_path || null,
      rating: data.vote_average || null,
    });
  } catch {
    return Response.json({ posterPath: null });
  }
}
