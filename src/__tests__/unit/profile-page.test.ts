/**
 * Profile page — token leakage prevention
 *
 * Regression for fix #8: spotify_access_token / spotify_refresh_token must
 * never be included in the Supabase select query on the profile page. If they
 * are selected, they end up in the RSC payload and are readable by any
 * client-side script.
 *
 * STATUS: should PASS (fix already applied)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture the select argument each time it is called
let capturedSelectArg: string | null = null;

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => ({ value: "test-user-id-abc" }),
  }),
}));

vi.mock("@/components/shared/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/profile/ProfileClient", () => ({
  ProfileClient: () => null,
}));

describe("ProfilePage — token leakage prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSelectArg = null;

    mockSingle.mockResolvedValue({
      data: {
        id: "test-user-id-abc",
        email: "test@example.com",
        display_name: "Test User",
        avatar_url: null,
        spotify_id: null,
        preferences: {},
        created_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockImplementation((arg: string) => {
      capturedSelectArg = arg;
      return { eq: mockEq };
    });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("does not select spotify_access_token", async () => {
    const { default: ProfilePage } = await import("@/app/profile/page");
    await ProfilePage();
    expect(capturedSelectArg).not.toContain("spotify_access_token");
  });

  it("does not select spotify_refresh_token", async () => {
    const { default: ProfilePage } = await import("@/app/profile/page");
    await ProfilePage();
    expect(capturedSelectArg).not.toContain("spotify_refresh_token");
  });

  it("selects the required display columns", async () => {
    const { default: ProfilePage } = await import("@/app/profile/page");
    await ProfilePage();
    expect(capturedSelectArg).toContain("display_name");
    expect(capturedSelectArg).toContain("avatar_url");
    expect(capturedSelectArg).toContain("email");
    expect(capturedSelectArg).toContain("id");
  });

  it("renders without throwing when DB returns a valid user", async () => {
    const { default: ProfilePage } = await import("@/app/profile/page");
    await expect(ProfilePage()).resolves.not.toThrow();
  });
});
