/**
 * Unit tests for app/api/newsletter/* route handlers with service + rate-limit mocked.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyRateLimit = vi.fn();
const mockValidatePayload = vi.fn();
const mockSubscribe = vi.fn();
const mockConfirm = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/newsletter/rate-limit", () => ({
  applyRateLimit: (...args: unknown[]) => mockApplyRateLimit(...args),
}));

vi.mock("@/lib/newsletter/service", () => ({
  validateNewsletterPayload: (...args: unknown[]) => mockValidatePayload(...args),
  subscribeToNewsletter: (...args: unknown[]) => mockSubscribe(...args),
  confirmNewsletterSubscription: (...args: unknown[]) => mockConfirm(...args),
  unsubscribeFromNewsletter: (...args: unknown[]) => mockUnsubscribe(...args),
}));

describe("newsletter route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("subscribes successfully", async () => {
    const { POST } = await import("../app/api/newsletter/route");
    mockValidatePayload.mockReturnValue(null);
    mockSubscribe.mockResolvedValue({ ok: true, message: "ok" });

    const request = new Request("http://localhost/api/newsletter", {
      method: "POST",
      body: JSON.stringify({
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
      }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("confirms successfully", async () => {
    const { POST } = await import("../app/api/newsletter/confirm/route");
    mockConfirm.mockResolvedValue({ ok: true, message: "confirmed" });

    const request = new Request("http://localhost/api/newsletter/confirm", {
      method: "POST",
      body: JSON.stringify({
        email: "a@b.com",
        token: "token",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("unsubscribes successfully", async () => {
    const { POST } = await import("../app/api/newsletter/unsubscribe/route");
    mockUnsubscribe.mockResolvedValue({ ok: true, message: "done" });

    const request = new Request("http://localhost/api/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({
        email: "a@b.com",
        token: "token",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
