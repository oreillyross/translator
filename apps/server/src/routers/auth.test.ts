import { describe, expect, it, vi } from "vitest";

vi.mock("../auth/magicLink.js", () => ({
  issueMagicToken: vi.fn().mockResolvedValue("fake-token"),
}));
vi.mock("../auth/email.js", () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

const { appRouter } = await import("../router.js");

function callerWithoutSession() {
  return appRouter.createCaller({
    ip: "203.0.113.9",
    session: null,
    logError: vi.fn(),
    clearSessionCookie: vi.fn(),
  });
}

describe("auth.requestLink", () => {
  it("responds identically for a plausible email regardless of whether an account exists", async () => {
    const caller = callerWithoutSession();

    const known = await caller.auth.requestLink({ email: "known@example.com" });
    const unknown = await caller.auth.requestLink({ email: "unknown@example.com" });

    expect(known).toEqual({ ok: true });
    expect(unknown).toEqual({ ok: true });
  });
});

describe("auth.session", () => {
  it("returns null without a session", async () => {
    const caller = callerWithoutSession();
    await expect(caller.auth.session()).resolves.toBeNull();
  });
});
