import { generateToken, hashToken } from "./token.js";
import {
  drizzleMagicTokenStore,
  drizzleUserStore,
  type MagicTokenStore,
  type UserStore,
} from "./stores.js";

const TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Creates and stores a magic token (hash only, §4.4) and returns the raw
 * token to embed in the emailed link. Callers default to the real Postgres
 * stores; tests inject fakes.
 */
export async function issueMagicToken(
  email: string,
  store: MagicTokenStore = drizzleMagicTokenStore,
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await store.insert({ email: email.toLowerCase(), tokenHash, expiresAt });
  return token;
}

export type RedeemResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Single-use: the row is deleted immediately on lookup, before the expiry
 * check, so a redeemed or expired token can never be redeemed again. The
 * first successful redemption creates the user — no separate signup flow.
 */
export async function redeemMagicToken(
  token: string,
  tokenStore: MagicTokenStore = drizzleMagicTokenStore,
  userStore: UserStore = drizzleUserStore,
): Promise<RedeemResult> {
  const tokenHash = hashToken(token);
  const row = await tokenStore.findByHash(tokenHash);
  if (!row) return { ok: false, reason: "invalid" };

  await tokenStore.deleteById(row.id);

  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const existing = await userStore.findByEmail(row.email);
  if (existing) return { ok: true, userId: existing.id };

  const created = await userStore.create(row.email);
  return { ok: true, userId: created.id };
}
