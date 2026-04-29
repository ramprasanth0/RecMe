import { Page } from "@playwright/test";

export async function mockExternalApis(page: Page) {
  // Disable animations for stability
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0.01s !important;
        animation-delay: 0s !important;
        transition-duration: 0.01s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });

  // Mock iTunes Top Songs
  await page.route(/.*api\/itunes\/top-songs.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        global: [
          { id: "1", title: "Global Hit", artist: "Artist A", albumArt: "https://picsum.photos/300", spotifyUrl: "https://spotify.com/1" }
        ],
        india: [
          { id: "2", title: "India Hit", artist: "Artist B", albumArt: "https://picsum.photos/300", spotifyUrl: "https://spotify.com/2" }
        ]
      })
    });
  });

  // Mock TMDB Trending
  await page.route(/.*api\/tmdb\/trending.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          { id: 101, title: "Trending Movie", release_date: "2024-01-01", poster_path: "/fake.jpg", vote_average: 8.5 }
        ]
      })
    });
  });

  // Mock Spotify Player Token
  await page.route(/.*api\/spotify\/player-token.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accessToken: "fake-token", expires_in: 3600 })
    });
  });

  // Mock Spotify Queue
  await page.route(/.*api\/spotify\/queue.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currently_playing: { name: "Current Song", artists: [{ name: "Current Artist" }] },
        queue: [
          { name: "Next Song", artists: [{ name: "Next Artist" }], album: { images: [{ url: "https://picsum.photos/100" }] } }
        ]
      })
    });
  });

  // Mock Genius Search (Lyrics)
  await page.route(/.*api\/genius\/search.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        hits: [
          {
            result: {
              id: 12345,
              title: "Mock Song",
              primary_artist: { name: "Mock Artist" },
              song_art_image_thumbnail_url: "https://picsum.photos/100"
            }
          }
        ]
      })
    });
  });

  // Mock Spotify Search
  await page.route(/.*api\/spotify\/search-track.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        uri: "spotify:track:mock-uri-123"
      })
    });
  });
}
