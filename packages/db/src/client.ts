import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * Connection is built from an already-validated DATABASE_URL — the caller
 * (apps/server/src/env.ts) owns validation so this package stays a plain
 * Drizzle client and never re-reads process.env itself.
 */
export function createDb(databaseUrl: string) {
  const queryClient = postgres(databaseUrl);
  return drizzle(queryClient, { schema });
}

export type Db = ReturnType<typeof createDb>;
