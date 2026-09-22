import { eq } from "drizzle-orm";
import { magicToken, session as sessionTable, user } from "@translator/db";
import { db } from "../db.js";

/**
 * Thin Drizzle-backed stores behind small interfaces, so the auth logic in
 * magicLink.ts / session.ts can be unit-tested against in-memory fakes
 * without a live Postgres connection (Railway provisioning is deferred —
 * see docs/TasksV1.md 2.2).
 */

export interface StoredMagicToken {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface MagicTokenStore {
  insert(record: Omit<StoredMagicToken, "id">): Promise<void>;
  findByHash(tokenHash: string): Promise<StoredMagicToken | null>;
  deleteById(id: string): Promise<void>;
}

export interface StoredUser {
  id: string;
  email: string;
}

export interface UserStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  create(email: string): Promise<StoredUser>;
}

export interface StoredSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface SessionWithUser extends StoredSession {
  email: string;
}

export interface SessionStore {
  insert(record: StoredSession): Promise<void>;
  findByIdWithUser(id: string): Promise<SessionWithUser | null>;
  updateExpiry(id: string, expiresAt: Date): Promise<void>;
  deleteById(id: string): Promise<void>;
}

export const drizzleMagicTokenStore: MagicTokenStore = {
  async insert(record) {
    await db.insert(magicToken).values(record);
  },
  async findByHash(tokenHash) {
    const [row] = await db
      .select()
      .from(magicToken)
      .where(eq(magicToken.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  },
  async deleteById(id) {
    await db.delete(magicToken).where(eq(magicToken.id, id));
  },
};

export const drizzleUserStore: UserStore = {
  async findByEmail(email) {
    const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return row ?? null;
  },
  async create(email) {
    const [row] = await db.insert(user).values({ email }).returning();
    if (!row) throw new Error("failed to create user");
    return row;
  },
};

export const drizzleSessionStore: SessionStore = {
  async insert(record) {
    await db.insert(sessionTable).values(record);
  },
  async findByIdWithUser(id) {
    const [row] = await db
      .select({
        id: sessionTable.id,
        userId: sessionTable.userId,
        expiresAt: sessionTable.expiresAt,
        email: user.email,
      })
      .from(sessionTable)
      .innerJoin(user, eq(sessionTable.userId, user.id))
      .where(eq(sessionTable.id, id))
      .limit(1);
    return row ?? null;
  },
  async updateExpiry(id, expiresAt) {
    await db.update(sessionTable).set({ expiresAt }).where(eq(sessionTable.id, id));
  },
  async deleteById(id) {
    await db.delete(sessionTable).where(eq(sessionTable.id, id));
  },
};
