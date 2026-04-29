import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getQueueRoute } from "@/app/api/spotify/queue/route";
import { POST as addToQueueRoute } from "@/app/api/spotify/add-to-queue/route";
import * as session from "@/lib/auth/session";
import * as spotifyLib from "@/lib/spotify";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/spotify");
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe("Spotify Queue API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/spotify/queue", () => {
    it("returns 401 if user is not authenticated", async () => {
      vi.mocked(session.getUserWithFreshToken).mockResolvedValue(null);
      
      const res = await getQueueRoute();
      expect(res.status).toBe(401);
    });

    it("returns the queue data when authenticated", async () => {
      const mockUser = { spotify_access_token: "fake-token" };
      const mockQueue = { currently_playing: { name: "Song 1" }, queue: [{ name: "Song 2" }] };
      
      vi.mocked(session.getUserWithFreshToken).mockResolvedValue(mockUser as any);
      vi.mocked(spotifyLib.getQueue).mockResolvedValue(mockQueue);

      const res = await getQueueRoute();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockQueue);
      expect(spotifyLib.getQueue).toHaveBeenCalledWith("fake-token");
    });
  });

  describe("POST /api/spotify/add-to-queue", () => {
    it("returns 400 if URI is missing", async () => {
      vi.mocked(session.getUserWithFreshToken).mockResolvedValue({ spotify_access_token: "token" } as any);
      
      const req = new Request("http://localhost/api/spotify/add-to-queue", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const res = await addToQueueRoute(req);
      expect(res.status).toBe(400);
    });

    it("successfully adds to queue and returns success", async () => {
      vi.mocked(session.getUserWithFreshToken).mockResolvedValue({ spotify_access_token: "token" } as any);
      
      // Mock the global fetch for the Spotify API call inside the route
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "OK",
      });

      const req = new Request("http://localhost/api/spotify/add-to-queue", {
        method: "POST",
        body: JSON.stringify({ uri: "spotify:track:123" }),
      });

      const res = await addToQueueRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toContain("spotify%3Atrack%3A123");
      expect(init?.method).toBe("POST");
      expect((init?.headers as any)["Authorization"]).toBe("Bearer token");
    });
  });
});
