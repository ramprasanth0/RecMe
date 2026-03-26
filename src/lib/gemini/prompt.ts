interface PromptContext {
  type: "music" | "movie";
  mood: string;
  topArtists?: string[];
  topTracks?: string[];
  favoriteGenres?: string[];
  movieGenres?: string[];
  likedItems?: string[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  // The query is the PRIMARY directive — listed first and most prominently
  const lines: string[] = [
    `You are RecMe's recommendation engine. Your ONLY job is to return results that directly and specifically match what the user asked for.`,
    ``,
    `USER QUERY (match this precisely):`,
    `"${ctx.mood}"`,
  ];

  // User context is secondary — only used to break ties, never to override query relevance
  const contextParts: string[] = [];
  if (ctx.topArtists?.length)
    contextParts.push(`Top artists: ${ctx.topArtists.slice(0, 8).join(", ")}`);
  if (ctx.topTracks?.length)
    contextParts.push(`Top tracks: ${ctx.topTracks.slice(0, 8).join(", ")}`);
  if (ctx.favoriteGenres?.length)
    contextParts.push(`Preferred music genres: ${ctx.favoriteGenres.join(", ")}`);
  if (ctx.movieGenres?.length)
    contextParts.push(`Preferred movie genres: ${ctx.movieGenres.join(", ")}`);
  if (ctx.likedItems?.length)
    contextParts.push(`Previously liked: ${ctx.likedItems.slice(0, 5).join(", ")}`);

  if (contextParts.length) {
    lines.push(
      ``,
      `USER TASTE CONTEXT (secondary — use only to break ties or add personal flavour; never let this override query relevance):`,
      ...contextParts
    );
  }

  if (ctx.type === "music") {
    lines.push(`
TASK: Return exactly 10 music tracks that DIRECTLY match the query above, ordered from most to least relevant.

Output format — a single JSON object, no markdown, no extra text:
{
  "type": "music",
  "items": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "reason": "Specific one-sentence explanation of how this track matches the query"
    }
  ]
}

RULES:
1. Every item MUST be a direct, unambiguous match for the query — not tangentially related
2. If fewer than 10 tracks are a strong match, return only those that truly fit — do NOT pad with weak matches
3. Items are already ordered most → least relevant; maintain this order
4. The "reason" must explain the specific connection to the query, not describe the track in general
5. Use the EXACT official song title and artist name as they appear on Spotify (correct capitalisation, no extra words)
6. Only recommend songs you are confident exist on Spotify — skip obscure regional or unavailable tracks
7. If the query asks for discovery or new songs, NEVER recommend any track already listed in the user's top tracks above
8. Return ONLY the JSON object`);
  } else {
    lines.push(`
TASK: Return exactly 10 movies that DIRECTLY match the query above, ordered from most to least relevant. The user may describe by: mood, partial plot/story, cast, director, year, genre, theme, setting, or relevancy (e.g. "movie about diamond trade in Africa", "film starring Cate Blanchett", "90s sci-fi thriller", "something like Parasite but funnier").

Output format — a single JSON object, no markdown, no extra text:
{
  "type": "movie",
  "items": [
    {
      "title": "Movie Title",
      "year": 2024,
      "tmdbId": 0,
      "genres": ["Genre1", "Genre2"],
      "reason": "Specific one-sentence explanation of how this movie matches the query"
    }
  ]
}

RULES:
1. Every item MUST be a direct, unambiguous match for the query — not tangentially related
2. If fewer than 10 movies are a strong match, return only those that truly fit — do NOT pad with weak matches
3. Items are already ordered most → least relevant; maintain this order
4. The "reason" must explain the specific connection to the query (e.g. "set in Sierra Leone and centres on the illegal diamond trade" — not generic praise)
5. NEVER recommend adult, pornographic, or explicitly sexual content
6. Use real movie titles with accurate release year; set tmdbId to 0 (app verifies it)
7. Return ONLY the JSON object`);
  }

  return lines.join("\n");
}


