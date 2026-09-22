import type {} from "@fastify/cookie";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { getSession, SESSION_COOKIE_NAME } from "./auth/session.js";

/**
 * Deliberately narrow: raw FastifyRequest/FastifyReply carry deep generic
 * types tied to the server's own route config, which aren't nameable from
 * apps/client's separate tsc program (TS2742) once they flow through
 * AppRouter into the client's trpc.ts. Procedures get exactly the primitives
 * they need instead.
 */
export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const raw = req.cookies[SESSION_COOKIE_NAME];
  const unsigned = raw ? req.unsignCookie(raw) : null;
  const sessionId = unsigned?.valid ? unsigned.value : null;
  const session = sessionId ? await getSession(sessionId) : null;

  return {
    ip: req.ip,
    session,
    logError: (err: unknown, message: string): void => {
      req.log.error(err, message);
    },
    clearSessionCookie: (): void => {
      res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
