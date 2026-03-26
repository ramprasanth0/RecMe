import type { SpotifyTopData } from "@/types/spotify";
import type { TrendingPlaylist, TrendingSong } from "@/types/trending";

const SPOTIFY_API = "https://api.spotify.com/v1";
const GLOBAL_TOP_50_ID = "37i9dQZEVXbMDoHDwVN2tF";

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
  const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/items`, {
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

/** Fetch tracks from the Global Top 50 playlist */
export async function getGlobalTop50(
  accessToken: string,
  limit = 20
): Promise<TrendingSong[]> {
  const fields = "items(track(id,name,artists(id,name),album(images),external_urls))";
  const res = await fetch(
    `${SPOTIFY_API}/playlists/${GLOBAL_TOP_50_ID}/tracks?limit=${limit}&fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const items = (data.items ?? []) as Array<{ track: { id: string; name: string; artists: { id: string; name: string }[]; album: { images: { url: string }[] }; external_urls: { spotify: string } } }>;
  const result: TrendingSong[] = [];
  for (const item of items) {
    const track = item?.track;
    if (!track) continue;
    result.push({
      id: track.id,
      title: track.name,
      artist: track.artists[0]?.name ?? "",
      ...(track.artists[0]?.id ? { artistId: track.artists[0].id } : {}),
      albumArt: track.album?.images?.[0]?.url ?? null,
      spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
    });
  }
  return result;
}

/** Fetch Spotify featured playlists */
export async function getFeaturedPlaylists(
  accessToken: string,
  limit = 10
): Promise<TrendingPlaylist[]> {
  const res = await fetch(
    `${SPOTIFY_API}/browse/featured-playlists?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.playlists?.items ?? []) as Array<{ id: string; name: string; images: { url: string }[]; external_urls: { spotify: string }; tracks: { total: number }; description: string }>)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.images?.[0]?.url ?? null,
      spotifyUrl: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
      trackCount: p.tracks?.total ?? 0,
      ...(p.description ? { description: p.description } : {}),
    } satisfies TrendingPlaylist));
}

/** Fetch the current user's own playlists */
export async function getUserPlaylists(
  accessToken: string,
  limit = 20
): Promise<TrendingPlaylist[]> {
  const res = await fetch(
    `${SPOTIFY_API}/me/playlists?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.items ?? []) as Array<{ id: string; name: string; images: { url: string }[]; external_urls: { spotify: string }; tracks: { total: number }; description: string }>)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.images?.[0]?.url ?? null,
      spotifyUrl: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
      trackCount: p.tracks?.total ?? 0,
      ...(p.description ? { description: p.description } : {}),
    } satisfies TrendingPlaylist));
}

/** Search Spotify for playlists matching a query */
export async function searchPlaylists(
  accessToken: string,
  query: string,
  limit = 5
): Promise<TrendingPlaylist[]> {
  const res = await fetch(
    `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.playlists?.items ?? []) as Array<{ id: string; name: string; images: { url: string }[]; external_urls: { spotify: string }; tracks: { total: number }; description: string } | null>)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.images?.[0]?.url ?? null,
      spotifyUrl: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
      trackCount: p.tracks?.total ?? 0,
      ...(p.description ? { description: p.description } : {}),
    } satisfies TrendingPlaylist));
}

/** Search for a track on Spotify and return its URI.
 *  Pass 1: title + artist  →  Pass 2: title only (wider net for name mismatches) */
export async function searchTrack(
  accessToken: string,
  title: string,
  artist: string
): Promise<string | null> {
  const search = async (q: string) => {
    const res = await fetch(
      `${SPOTIFY_API}/search?q=${encodeURIComponent(q)}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.tracks?.items?.[0]?.uri as string) ?? null;
  };

  const uri = await search(`${title} ${artist}`);
  if (uri) return uri;

  // Fallback: title only — catches artist name mismatches
  const uriFallback = await search(title);
  if (uriFallback) return uriFallback;

  console.warn(`No Spotify match for: "${title}" by "${artist}"`);
  return null;
}
