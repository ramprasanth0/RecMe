
const GENIUS_API = "https://api.genius.com";
const ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

export async function searchGenius(query: string) {
  if (!ACCESS_TOKEN) {
    throw new Error("GENIUS_ACCESS_TOKEN is not configured");
  }

  const res = await fetch(`${GENIUS_API}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Genius API error: ${res.status}`);
  }

  const data = await res.json();
  return data.response.hits;
}

export async function getGeniusSong(id: number) {
  if (!ACCESS_TOKEN) {
    throw new Error("GENIUS_ACCESS_TOKEN is not configured");
  }

  const res = await fetch(`${GENIUS_API}/songs/${id}?text_format=html`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Genius API error: ${res.status}`);
  }

  const data = await res.json();
  return data.response.song;
}

export async function getGeniusArtist(id: number) {
    if (!ACCESS_TOKEN) {
      throw new Error("GENIUS_ACCESS_TOKEN is not configured");
    }
  
    const res = await fetch(`${GENIUS_API}/artists/${id}?text_format=html`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });
  
    if (!res.ok) {
      throw new Error(`Genius API error: ${res.status}`);
    }
  
    const data = await res.json();
    return data.response.artist;
  }
