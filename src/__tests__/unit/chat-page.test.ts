/**
 * Chat page — DB failure resilience
 *
 * Regression for fix #3: the chat page server component must not crash with an
 * unhandled exception when the Supabase query fails. A DB failure should
 * degrade gracefully, rendering the page with user=null.
 *
 * STATUS: should PASS (fix already applied)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockCookieValue: string | undefined = "test-user-id-abc";

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () =>
      mockCookieValue ? { value: mockCookieValue } : undefined,
  }),
}));

vi.mock("@/components/shared/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/chat/ChatPageClient", () => ({
  ChatPageClient: () => null,
}));

describe("ChatPage — DB failure resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieValue = "test-user-id-abc";
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("renders without throwing when DB query succeeds", async () => {
    mockSingle.mockResolvedValue({
      data: { display_name: "Test User", avatar_url: null },
      error: null,
    });
    const { default: ChatPage } = await import("@/app/chat/page");
    await expect(ChatPage()).resolves.not.toThrow();
  });

  it("renders without throwing when DB query throws", async () => {
    mockSingle.mockRejectedValue(new Error("Connection timeout"));
    const { default: ChatPage } = await import("@/app/chat/page");
    await expect(ChatPage()).resolves.not.toThrow();
  });

  it("renders without throwing when DB returns an error object", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Row not found" },
    });
    const { default: ChatPage } = await import("@/app/chat/page");
    await expect(ChatPage()).resolves.not.toThrow();
  });

  it("renders without throwing when no session cookie is present", async () => {
    mockCookieValue = undefined;
    const { default: ChatPage } = await import("@/app/chat/page");
    await expect(ChatPage()).resolves.not.toThrow();
  });
});
