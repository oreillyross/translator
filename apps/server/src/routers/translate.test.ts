import { describe, expect, it, vi } from "vitest";

vi.mock("../llm/adapter.js", () => ({
  translate: vi.fn().mockResolvedValue({ text: "Hallo daar", inputTokens: 10, outputTokens: 5 }),
}));

const { translate } = await import("../llm/adapter.js");
const { appRouter } = await import("../router.js");

function callerWithSession() {
  return appRouter.createCaller({
    ip: "203.0.113.9",
    session: { id: "sess-1", userId: "user-1", email: "user@example.com", expiresAt: new Date() },
    logError: vi.fn(),
    clearSessionCookie: vi.fn(),
  });
}

function callerWithoutSession() {
  return appRouter.createCaller({
    ip: "203.0.113.9",
    session: null,
    logError: vi.fn(),
    clearSessionCookie: vi.fn(),
  });
}

describe("translate.run", () => {
  it("requires a session", async () => {
    const caller = callerWithoutSession();
    await expect(
      caller.translate.run({ systemPrompt: "You are a Dutch friend.", language: "Dutch", body: "Hi there" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the adapter's translation for a signed-in user", async () => {
    const caller = callerWithSession();
    const result = await caller.translate.run({
      systemPrompt: "You are a Dutch friend.",
      language: "Dutch",
      body: "Hi there",
    });
    expect(result).toEqual({ translation: "Hallo daar" });
  });

  it("appends the language instruction to the system prompt server-side", async () => {
    const caller = callerWithSession();
    await caller.translate.run({ systemPrompt: "You are a Dutch friend.", language: "Dutch", body: "Hi there" });
    expect(translate).toHaveBeenCalledWith(
      expect.stringContaining("Write your response entirely in Dutch."),
      "Hi there",
    );
  });

  it("rejects an empty body", async () => {
    const caller = callerWithSession();
    await expect(
      caller.translate.run({ systemPrompt: "You are a Dutch friend.", language: "Dutch", body: "" }),
    ).rejects.toThrow();
  });
});
