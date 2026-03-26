import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopArtists, searchPlaylists } from "@/lib/spotify";
import type { TrendingPlaylist } from "@/types/trending";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ playlists: [] });
    }

    const artists = await getTopArtists(user.spotify_access_token, 3);
    const artistNames: string[] = artists.map((a: { name: string }) => a.name);

    const results = await Promise.allSettled(
      artistNames.map((name) => searchPlaylists(user.spotify_access_token!, name, 5))
    );

    const seen = new Set<string>();
    const playlists: TrendingPlaylist[] = [];
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const p of r.value) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          playlists.push(p);
          if (playlists.length >= 9) break;
        }
      }
      if (playlists.length >= 9) break;
    }

    return NextResponse.json({ playlists });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}
