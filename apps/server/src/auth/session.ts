import { randomBytes } from "node:crypto";
import { drizzleSessionStore, type SessionStore } from "./stores.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = "translator_session";

export interface ActiveSession {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
}

export async function createSession(
  userId: string,
  store: SessionStore = drizzleSessionStore,
): Promise<{ id: string; expiresAt: Date }> {
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await store.insert({ id, userId, expiresAt });
  return { id, expiresAt };
}

/**
 * Rolling 30-day expiry: every lookup that finds a live session pushes its
 * expiry back out. An expired row is deleted on read rather than left for a
 * cleanup job — the single user of this app never hits enough rows to matter.
 */
export async function getSession(
  sessionId: string,
  store: SessionStore = drizzleSessionStore,
): Promise<ActiveSession | null> {
  const row = await store.findByIdWithUser(sessionId);
  if (!row) return null;

  if (row.expiresAt.getTime() < Date.now()) {
    await store.deleteById(sessionId);
    return null;
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await store.updateExpiry(sessionId, expiresAt);
  return { ...row, expiresAt };
}

export async function revokeSession(
  sessionId: string,
  store: SessionStore = drizzleSessionStore,
): Promise<void> {
  await store.deleteById(sessionId);
}
