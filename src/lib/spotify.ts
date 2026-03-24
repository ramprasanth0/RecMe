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

/** Create a new playlist in the user's Spotify account */
export async function createPlaylist(
  accessToken: string,
  _userId: string,
  name: string,
  description = ""
) {
  // Use /me/playlists — avoids 403 issues with user-scoped endpoint in dev mode
  const res = await fetch(`${SPOTIFY_API}/me/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create playlist failed: ${res.status} — ${body}`);
  }
  return res.json() as Promise<{ id: string; external_urls: { spotify: string } }>;
}

/** Add tracks to a Spotify playlist */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
) {
  const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Add tracks failed: ${res.status} — ${body}`);
  }
  return res.json();
}

/** Search for a track on Spotify and return its URI */
export async function searchTrack(
  accessToken: string,
  title: string,
  artist: string
): Promise<string | null> {
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(
    `${SPOTIFY_API}/search?q=${query}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.tracks?.items?.[0]?.uri ?? null;
}
