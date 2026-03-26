/**
 * Implements the Spotify Client Credentials flow for server-to-server requests.
 * Used to fetch public data (trending songs, featured playlists) for unauthenticated guest users.
 */

let cachedToken: string | null = null;
let tokenExpiration: number = 0;

export async function getClientCredentialsToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiration - 5 * 60 * 1000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    // Cache for 1 hour exactly as Spotify dictates, but Next.js fetch cache is also fine.
    // We handle custom caching above, so don't let next.js over-cache it.
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch client credentials token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  cachedToken = data.access_token;
  // data.expires_in is typically 3600 seconds (1 hour)
  tokenExpiration = Date.now() + data.expires_in * 1000;

  console.log(`[clientToken] Fetched token: ${cachedToken?.substring(0, 15)}... len: ${cachedToken?.length}`);
  return cachedToken!;
}
