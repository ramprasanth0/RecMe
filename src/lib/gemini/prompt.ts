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
  const sections: string[] = [
    `You are RecMe's AI engine — a taste-aware recommendation assistant.`,
    `You are recommending ${ctx.type === "music" ? "music" : "movies"}.`,
  ];

  if (ctx.topArtists?.length) {
    sections.push(`User's top artists: ${ctx.topArtists.slice(0, 10).join(", ")}`);
  }

  if (ctx.topTracks?.length) {
    sections.push(`User's top tracks: ${ctx.topTracks.slice(0, 10).join(", ")}`);
  }

  if (ctx.favoriteGenres?.length) {
    sections.push(`User's favorite music genres: ${ctx.favoriteGenres.join(", ")}`);
  }

  if (ctx.movieGenres?.length) {
    sections.push(`User's favorite movie genres: ${ctx.movieGenres.join(", ")}`);
  }

  if (ctx.likedItems?.length) {
    sections.push(`Previously liked items: ${ctx.likedItems.slice(0, 5).join(", ")}`);
  }

  sections.push(`User's current mood/request: "${ctx.mood}"`);

  if (ctx.type === "music") {
    sections.push(`
Respond with exactly 5-8 music recommendations as a JSON object:
{
  "type": "music",
  "items": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "reason": "One sentence explaining why this fits"
    }
  ]
}

Rules:
- Every item MUST have a "reason" that connects to the user's mood or taste
- Be conversational, warm, and confident — like a friend with great taste
- Return ONLY the JSON object, no markdown fences, no extra text`);
  } else {
    sections.push(`
Respond with exactly 5-8 movie recommendations as a JSON object:
{
  "type": "movie",
  "items": [
    {
      "title": "Movie Title",
      "year": 2024,
      "tmdbId": 0,
      "genres": ["Genre1", "Genre2"],
      "reason": "One sentence explaining why this fits"
    }
  ]
}

Rules:
- Every item MUST have a "reason" that connects to the user's mood or taste
- Include accurate year and genre data
- Set tmdbId to 0 if unsure (the app will look it up)
- Be conversational, warm, and confident — like a friend with great taste
- Return ONLY the JSON object, no markdown fences, no extra text`);
  }

  return sections.join("\n\n");
}

export function buildChatSystemPrompt(context?: {
  topArtists?: string[];
  topTracks?: string[];
  musicGenres?: string[];
  movieGenres?: string[];
}): string {
  const sections: string[] = [
    `You are RecMe's AI assistant — a taste-aware recommendation engine that knows music and movies deeply.`,
    `You can recommend both music and movies based on the user's mood, preferences, and conversation.`,
  ];

  if (context?.topArtists?.length) {
    sections.push(`User's top artists: ${context.topArtists.slice(0, 10).join(", ")}`);
  }

  if (context?.topTracks?.length) {
    sections.push(`User's top tracks: ${context.topTracks.slice(0, 10).join(", ")}`);
  }

  sections.push(`
When recommending, always respond with structured JSON:

For music:
{"type": "music", "items": [{"title": "...", "artist": "...", "reason": "..."}]}

For movies:
{"type": "movie", "items": [{"title": "...", "year": 2024, "tmdbId": 0, "genres": ["..."], "reason": "..."}]}

For general conversation (not a recommendation request), respond normally as text.
Always be warm, confident, and conversational. Every recommendation must include a reason.`);

  return sections.join("\n\n");
}
