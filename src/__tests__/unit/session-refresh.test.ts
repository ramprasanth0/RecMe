/**
 * Session — Spotify token refresh behaviour
 *
 * Documents current behaviour (proactive refresh on every call) and pins the
 * expected behaviour after fix #5 (only refresh when token is expired).
 *
 * Tests marked CURRENT pass now.
 * Tests marked DESIRED will pass once fix #5 (token_expires_at check) is applied.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRefreshAccessToken = vi.fn();
const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => ({ value: "test-user-id" }),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: mockSingle }),
      }),
      update: () => ({
        eq: mockUpdateEq,
      }),
    }),
  }),
}));

vi.mock("@/lib/spotify/auth", () => ({
  refreshAccessToken: mockRefreshAccessToken,
}));

const BASE_USER = {
  id: "test-user-id",
  email: "test@example.com",
  display_name: "Test User",
  avatar_url: null,
  spotify_id: "spotify-123",
  spotify_access_token: "existing-access-token",
  spotify_refresh_token: "existing-refresh-token",
  spotify_token_expires_at: null, // null → treated as expired → refresh fires
  preferences: {},
  created_at: "2024-01-01T00:00:00Z",
};

describe("getUserWithFreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: BASE_USER, error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockRefreshAccessToken.mockResolvedValue({
      access_token: "new-access-token",
      expires_in: 3600,
      refresh_token: null,
    });
  });

  // CURRENT: proactive refresh fires on every call
  it("[CURRENT] calls refreshAccessToken on every invocation", async () => {
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    await getUserWithFreshToken();
    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("returns the updated token after a successful refresh", async () => {
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    const result = await getUserWithFreshToken();
    expect(result?.spotify_access_token).toBe("new-access-token");
  });

  it("falls back to the original token when refresh fails", async () => {
    mockRefreshAccessToken.mockRejectedValueOnce(
      new Error("Spotify API unavailable")
    );
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    const result = await getUserWithFreshToken();
    expect(result?.spotify_access_token).toBe("existing-access-token");
  });

  it("skips refresh and returns user as-is when spotify_refresh_token is null", async () => {
    mockSingle.mockResolvedValue({
      data: { ...BASE_USER, spotify_refresh_token: null },
      error: null,
    });
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    const result = await getUserWithFreshToken();
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(result?.spotify_access_token).toBe("existing-access-token");
  });

  it("returns null when no session cookie exists", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "No row" } });
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    const result = await getUserWithFreshToken();
    expect(result).toBeNull();
  });

  // DESIRED behavior — now implemented (fix #5 applied)
  it("does NOT call refreshAccessToken when token_expires_at is well in the future", async () => {
    const futureExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min from now
    mockSingle.mockResolvedValue({
      data: { ...BASE_USER, spotify_token_expires_at: futureExpiry },
      error: null,
    });
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    const result = await getUserWithFreshToken();
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(result?.spotify_access_token).toBe("existing-access-token");
  });

  it("calls refreshAccessToken when token_expires_at is within 60s of expiry", async () => {
    const almostExpiredAt = new Date(Date.now() + 30 * 1000).toISOString(); // 30s from now
    mockSingle.mockResolvedValue({
      data: { ...BASE_USER, spotify_token_expires_at: almostExpiredAt },
      error: null,
    });
    const { getUserWithFreshToken } = await import("@/lib/auth/session");
    await getUserWithFreshToken();
    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
  });
});
