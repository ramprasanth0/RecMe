/**
 * Proxy route handlers — Cache-Control headers
 *
 * Regression for fix #12: /api/itunes/artwork and /api/tmdb/poster must set
 * Cache-Control response headers so browsers and CDN edges cache the responses.
 * Without this, every page load re-requests these routes even for artwork/posters
 * already fetched seconds ago.
 *
 * Tests marked PASSES NOW verify existing correct behaviour.
 * Tests marked FAILS UNTIL FIX #12 will pass once Cache-Control headers are added.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── iTunes artwork ────────────────────────────────────────────────────────────

describe("GET /api/itunes/artwork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ artworkUrl100: "https://example.com/art100x100bb.jpg" }],
        }),
        { status: 200 }
      )
    );
  });

  // PASSES NOW
  it("returns 400 when both title and artist are missing", async () => {
    const { GET } = await import("@/app/api/itunes/artwork/route");
    const req = new Request("http://localhost/api/itunes/artwork");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  // PASSES NOW
  it("returns artwork URL with 600x600 resolution", async () => {
    const { GET } = await import("@/app/api/itunes/artwork/route");
    const req = new Request(
      "http://localhost/api/itunes/artwork?title=Blinding+Lights&artist=The+Weeknd"
    );
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.url).toContain("600x600bb");
  });

  // PASSES NOW
  it("returns null url gracefully when iTunes has no results", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    );
    const { GET } = await import("@/app/api/itunes/artwork/route");
    const req = new Request(
      "http://localhost/api/itunes/artwork?title=Unknown&artist=Nobody"
    );
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.url).toBeNull();
  });

  // PASSES NOW
  it("returns null url gracefully when iTunes fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const { GET } = await import("@/app/api/itunes/artwork/route");
    const req = new Request(
      "http://localhost/api/itunes/artwork?title=Test&artist=Test"
    );
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.url).toBeNull();
  });

  // FAILS UNTIL FIX #12
  it("sets Cache-Control header for browser/CDN caching", async () => {
    const { GET } = await import("@/app/api/itunes/artwork/route");
    const req = new Request(
      "http://localhost/api/itunes/artwork?title=Blinding+Lights&artist=The+Weeknd"
    );
    const res = await GET(req as never);
    const cacheControl = res.headers.get("Cache-Control");
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toMatch(/max-age/);
  });
});

// ─── TMDB poster ───────────────────────────────────────────────────────────────

describe("GET /api/tmdb/poster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          poster_path: "/abc123.jpg",
          backdrop_path: "/bg456.jpg",
          vote_average: 8.5,
        }),
        { status: 200 }
      )
    );
  });

  // PASSES NOW
  it("returns 400 when id param is missing", async () => {
    const { GET } = await import("@/app/api/tmdb/poster/route");
    const req = { nextUrl: new URL("http://localhost/api/tmdb/poster") };
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  // PASSES NOW
  it("returns posterPath and rating in response", async () => {
    const { GET } = await import("@/app/api/tmdb/poster/route");
    const req = { nextUrl: new URL("http://localhost/api/tmdb/poster?id=550") };
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.posterPath).toBe("/abc123.jpg");
    expect(body.rating).toBe(8.5);
  });

  // PASSES NOW
  it("returns posterPath null gracefully when TMDB fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const { GET } = await import("@/app/api/tmdb/poster/route");
    const req = { nextUrl: new URL("http://localhost/api/tmdb/poster?id=550") };
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.posterPath).toBeNull();
  });

  // FAILS UNTIL FIX #12
  it("sets Cache-Control header for browser/CDN caching", async () => {
    const { GET } = await import("@/app/api/tmdb/poster/route");
    const req = { nextUrl: new URL("http://localhost/api/tmdb/poster?id=550") };
    const res = await GET(req as never);
    const cacheControl = res.headers.get("Cache-Control");
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toMatch(/max-age/);
  });
});
