import type { SpotifyTopData } from "@/types/spotify";

const SPOTIFY_API = "https://api.spotify.com/v1";

export async function getTopArtists(accessToken: string, limit = 20) {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/artists?time_range=long_term&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function getTopTracks(accessToken: string, limit = 50) {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/tracks?time_range=long_term&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function getSpotifyTopData(
  accessToken: string
): Promise<SpotifyTopData> {
  const [topArtists, topTracks] = await Promise.all([
    getTopArtists(accessToken),
    getTopTracks(accessToken),
  ]);
  return { topArtists, topTracks };
}
