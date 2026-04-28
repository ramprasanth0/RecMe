import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${env.tmdb.apiKey()}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch TMDB videos");
    }

    const data = await res.json();
    
    // Find the first YouTube Trailer
    const trailer = data.results?.find(
      (v: { site: string; type: string; key: string }) => v.site === "YouTube" && v.type === "Trailer"
    );

    return NextResponse.json({
      youtubeKey: trailer?.key || null,
    });
  } catch (error) {
    console.error("TMDB trailer error:", error);
    return NextResponse.json({ youtubeKey: null }, { status: 500 });
  }
}
