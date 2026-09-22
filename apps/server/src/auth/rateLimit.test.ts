import { describe, expect, it } from "vitest";
import { checkLinkRequestRateLimit } from "./rateLimit.js";

describe("checkLinkRequestRateLimit", () => {
  it("allows requests under the per-email cap and blocks once it's hit", () => {
    const email = `email-cap-${Date.now()}@example.com`;
    let allowed = 0;
    for (let i = 0; i < 10; i++) {
      if (checkLinkRequestRateLimit(email, `10.0.0.${i}`)) allowed++;
    }
    expect(allowed).toBe(5);
  });

  it("blocks a shared IP once its cap is hit even across different emails", () => {
    const ip = `203.0.113.${Date.now() % 250}`;
    let allowed = 0;
    for (let i = 0; i < 25; i++) {
      if (checkLinkRequestRateLimit(`ip-cap-${i}@example.com`, ip)) allowed++;
    }
    expect(allowed).toBe(20);
  });

  it("tracks separate emails on the same IP independently up to the IP cap", () => {
    const ip = `198.51.100.${Date.now() % 250}`;
    expect(checkLinkRequestRateLimit("a@example.com", ip)).toBe(true);
    expect(checkLinkRequestRateLimit("b@example.com", ip)).toBe(true);
  });
});
