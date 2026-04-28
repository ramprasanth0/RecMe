import type { SpotifyTopData } from "@/types/spotify";
import type { TrendingPlaylist, TrendingSong } from "@/types/trending";

const SPOTIFY_API = "https://api.spotify.com/v1";
export const GLOBAL_TOP_50_ID = "37i9dQZEVXbMDoHDwVN2tF";
export const INDIA_TOP_50_ID = "37i9dQZEVXbLZ52XmnySIA";

export async function getTopArtists(accessToken: string, limit = 20) {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/artists?time_range=long_term&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function getTopTracks(accessToken: string, limit = 50, timeRange: "short_term" | "medium_term" | "long_term" = "long_term") {
  const res = await fetch(
    `${SPOTIFY_API}/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function getRecentlyPlayed(accessToken: string, limit = 20) {
  const res = await fetch(
    `${SPOTIFY_API}/me/player/recently-played?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const data = await res.json();
  // Map the play history object structure to standard track structure
  return data.items.map((item: { track: unknown }) => item.track);
}

export async function getArtists(accessToken: string, artistIds: string[]) {
  if (artistIds.length === 0) return [];
  const res = await fetch(
    `${SPOTIFY_API}/artists?ids=${artistIds.slice(0, 50).join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists;
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

/** Fetch tracks from any Spotify playlist using the correct /items endpoint */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 20
): Promise<TrendingSong[]> {
  const fields = "items(track(id,name,artists(id,name),album(images),external_urls))";
  const res = await fetch(
    `${SPOTIFY_API}/playlists/${playlistId}/items?limit=${limit}&fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } , cache: 'no-store' }
  );
  if (!res.ok) {
    console.error("[getPlaylistTracks] Spotify API Error:", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  console.log(`[getPlaylistTracks] Raw JSON length for ${playlistId}:`, JSON.stringify(data).length, "Items:", data.items?.length);
  if (!data.items || data.items.length === 0) {
    console.log(`[getPlaylistTracks] Empty items payload for ${playlistId}:`, JSON.stringify(data).substring(0, 300));
  }
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

/** Get Spotify recommendations seeded from track IDs */
export async function getRecommendations(
  accessToken: string,
  seedTrackIds: string[],
  limit = 20
): Promise<TrendingSong[]> {
  const seeds = seedTrackIds.slice(0, 5).join(","); // max 5 seeds
  const res = await fetch(
    `${SPOTIFY_API}/recommendations?seed_tracks=${seeds}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const tracks = (data.tracks ?? []) as Array<{ id: string; name: string; artists: { id: string; name: string }[]; album: { images: { url: string }[] }; external_urls: { spotify: string } }>;
  return tracks.map((track) => ({
    id: track.id,
    title: track.name,
    artist: track.artists[0]?.name ?? "",
    ...(track.artists[0]?.id ? { artistId: track.artists[0].id } : {}),
    albumArt: track.album?.images?.[0]?.url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
  }));
}

/** Fetch Spotify featured playlists */
export async function getFeaturedPlaylists(
  accessToken: string,
  limit = 10
): Promise<TrendingPlaylist[]> {
  const res = await fetch(
    `${SPOTIFY_API}/browse/featured-playlists?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } , cache: 'no-store' }
  );
  if (!res.ok) {
    console.error("[getFeaturedPlaylists] Spotify API Error:", res.status, await res.text());
    return [];
  }
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
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) {
    console.error("[getUserPlaylists] Spotify API Error:", res.status, await res.text());
    return [];
  }
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

/** Get the current user's playback queue */
export async function getQueue(accessToken: string) {
  const res = await fetch(`${SPOTIFY_API}/me/player/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 403) return { queue: [], currently_playing: null };
    throw new Error(`Spotify API error: ${res.status}`);
  }
  return await res.json();
}

/** Get audio features for several tracks */
export async function getAudioFeatures(accessToken: string, trackIds: string[]) {
  if (trackIds.length === 0) return [];
  const res = await fetch(
    `${SPOTIFY_API}/audio-features?ids=${trackIds.slice(0, 100).join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.audio_features;
}
