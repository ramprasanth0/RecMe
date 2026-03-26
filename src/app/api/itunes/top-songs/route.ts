import { NextResponse } from "next/server";
import type { TrendingSong } from "@/types/trending";

const ITUNES_RSS = "https://rss.applemarketingtools.com/api/v2";

interface ITunesEntry {
  id: string;
  name: string;
  artistName: string;
  artistId?: string;
  artworkUrl100: string;
  url: string;
}

async function fetchChart(country: string, limit = 25): Promise<TrendingSong[]> {
  const res = await fetch(`${ITUNES_RSS}/${country}/music/most-played/${limit}/songs.json`, {
    next: { revalidate: 3600 }, // cache 1 hour
  });
  if (!res.ok) return [];
  const data = await res.json();
  const results: ITunesEntry[] = data?.feed?.results ?? [];
  return results.map((entry) => ({
    id: entry.id,
    title: entry.name,
    artist: entry.artistName,
    artistId: entry.artistId,
    // Upscale artwork from 100x100 to 300x300
    albumArt: entry.artworkUrl100?.replace("100x100bb", "300x300bb") ?? null,
    spotifyUrl: entry.url, // Apple Music link
  }));
}

export async function GET() {
  try {
    const [global, india] = await Promise.all([
      fetchChart("us", 25),
      fetchChart("in", 25),
    ]);
    return NextResponse.json(
      { global, india },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" } }
    );
  } catch (error) {
    console.error("[itunes/top-songs] Error:", error);
    return NextResponse.json({ global: [], india: [] }, { status: 500 });
  }
}
