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

/** Normalise a string for fuzzy comparison — lowercase, strip punctuation/articles */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")          // curly/straight apostrophes
    .replace(/[^a-z0-9\s]/g, " ")   // punctuation → space
    .replace(/\b(the|a|an)\b/g, "") // drop leading articles
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check whether a Spotify track result plausibly matches the requested title/artist.
 * Returns true if both the title and at least one artist name are present as substrings.
 */
function isGoodMatch(
  expected: { title: string; artist: string },
  result: { name: string; artists: { name: string }[] }
): boolean {
  const eTitle = normalise(expected.title);
  const rTitle = normalise(result.name);
  const rArtists = result.artists.map((a) => normalise(a.name));

  const titleOk = rTitle.includes(eTitle) || eTitle.includes(rTitle);
  const artistOk = rArtists.some(
    (ra) => ra.includes(normalise(expected.artist)) || normalise(expected.artist).includes(ra)
  );
  return titleOk && artistOk;
}

/** Search Spotify with a pre-encoded query and return the URI if the top result is a good match */
async function runSearch(
  accessToken: string,
  encodedQuery: string,
  expected: { title: string; artist: string }
): Promise<string | null> {
  const res = await fetch(
    `${SPOTIFY_API}/search?q=${encodedQuery}&type=track&limit=3`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const items: { uri: string; name: string; artists: { name: string }[] }[] =
    data.tracks?.items ?? [];
  // Pick first item that passes the match check
  const match = items.find((item) => isGoodMatch(expected, item));
  return match?.uri ?? null;
}

/** Search for a track on Spotify and return its URI.
 *  Strategy: exact field filter first, then plain-query fallback. */
export async function searchTrack(
  accessToken: string,
  title: string,
  artist: string
): Promise<string | null> {
  const expected = { title, artist };

  // Pass 1 — strict field filter (exact title + artist)
  const fieldQuery = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
  const uri = await runSearch(accessToken, fieldQuery, expected);
  if (uri) return uri;

  // Pass 2 — plain query fallback (handles AI name variations)
  const plainQuery = encodeURIComponent(`${title} ${artist}`);
  const uriFallback = await runSearch(accessToken, plainQuery, expected);
  if (uriFallback) return uriFallback;

  console.warn(`No Spotify match for: "${title}" by "${artist}"`);
  return null;
}
