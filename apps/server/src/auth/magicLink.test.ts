import { describe, expect, it } from "vitest";
import { issueMagicToken, redeemMagicToken } from "./magicLink.js";
import { hashToken } from "./token.js";
import type { MagicTokenStore, StoredMagicToken, StoredUser, UserStore } from "./stores.js";

function createFakeMagicTokenStore(): MagicTokenStore & {
  records: Map<string, StoredMagicToken>;
} {
  const records = new Map<string, StoredMagicToken>();
  let nextId = 0;
  return {
    records,
    async insert(record) {
      const id = String(nextId++);
      records.set(id, { ...record, id });
    },
    async findByHash(tokenHash) {
      for (const record of records.values()) {
        if (record.tokenHash === tokenHash) return record;
      }
      return null;
    },
    async deleteById(id) {
      records.delete(id);
    },
  };
}

function createFakeUserStore(): UserStore {
  const users = new Map<string, StoredUser>();
  let nextId = 0;
  return {
    async findByEmail(email) {
      return users.get(email) ?? null;
    },
    async create(email) {
      const created = { id: `user-${nextId++}`, email };
      users.set(email, created);
      return created;
    },
  };
}

describe("issueMagicToken", () => {
  it("stores only the SHA-256 hash of the token, never the token itself", async () => {
    const store = createFakeMagicTokenStore();
    const token = await issueMagicToken("person@example.com", store);

    const record = [...store.records.values()][0];
    expect(record).toBeDefined();
    expect(record?.tokenHash).toBe(hashToken(token));
    expect(record?.tokenHash).not.toBe(token);
    expect(JSON.stringify([...store.records.values()])).not.toContain(token);
  });
});

describe("redeemMagicToken", () => {
  it("succeeds on first redemption and creates the user", async () => {
    const tokenStore = createFakeMagicTokenStore();
    const userStore = createFakeUserStore();
    const token = await issueMagicToken("new@example.com", tokenStore);

    const result = await redeemMagicToken(token, tokenStore, userStore);
    expect(result.ok).toBe(true);
    await expect(userStore.findByEmail("new@example.com")).resolves.not.toBeNull();
  });

  it("returns the same user on a second sign-in without creating a duplicate", async () => {
    const tokenStore = createFakeMagicTokenStore();
    const userStore = createFakeUserStore();

    const firstToken = await issueMagicToken("returning@example.com", tokenStore);
    const first = await redeemMagicToken(firstToken, tokenStore, userStore);

    const secondToken = await issueMagicToken("returning@example.com", tokenStore);
    const second = await redeemMagicToken(secondToken, tokenStore, userStore);

    expect(first.ok && second.ok && first.userId === second.userId).toBe(true);
  });

  it("cannot be redeemed twice", async () => {
    const tokenStore = createFakeMagicTokenStore();
    const userStore = createFakeUserStore();
    const token = await issueMagicToken("reuse@example.com", tokenStore);

    const first = await redeemMagicToken(token, tokenStore, userStore);
    const second = await redeemMagicToken(token, tokenStore, userStore);

    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: "invalid" });
  });

  it("fails for an expired token", async () => {
    const tokenStore = createFakeMagicTokenStore();
    const userStore = createFakeUserStore();
    tokenStore.records.set("expired-id", {
      id: "expired-id",
      email: "late@example.com",
      tokenHash: hashToken("expired-token"),
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await redeemMagicToken("expired-token", tokenStore, userStore);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("fails for a token that was never issued", async () => {
    const tokenStore = createFakeMagicTokenStore();
    const userStore = createFakeUserStore();

    const result = await redeemMagicToken("never-issued", tokenStore, userStore);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });
});
