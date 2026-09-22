import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { TRPCError } from "@trpc/server";
import Fastify from "fastify";
import { env } from "./env.js";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import { redeemMagicToken } from "./auth/magicLink.js";
import { createSession, SESSION_COOKIE_NAME } from "./auth/session.js";
import { renderAuthErrorPage } from "./auth/errorPage.js";

// appRouter's grammar router parses the vocabulary at import time above, so
// a malformed YAML file already failed boot fast and loud (2.6 / HC-15)
// before this line.
const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, { origin: env.APP_BASE_URL, credentials: true });
await app.register(cookie, { secret: env.SESSION_COOKIE_SECRET });

await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    /**
     * Basic error monitoring (6.7): every procedure failure — expected
     * (UNAUTHORIZED, BAD_GATEWAY) or not — lands in the structured server
     * log with its route, so a bad deploy or a dead upstream is visible in
     * Railway's log stream without a separate monitoring service.
     */
    onError({ error, path }: { error: TRPCError; path?: string | undefined }) {
      app.log.error({ err: error, path }, "tRPC procedure error");
    },
  },
});

app.get("/health", async () => ({ status: "ok" }));

/**
 * Last-resort net for anything that escapes tRPC's own error handling
 * (e.g. a rejected promise in a fire-and-forget call). Logged, not
 * swallowed — Railway restarts the process on crash, so this doesn't try
 * to keep a corrupted process alive, just makes sure the cause is visible.
 */
process.on("unhandledRejection", (reason) => {
  app.log.error({ err: reason }, "unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  app.log.error({ err }, "uncaught exception");
});

/**
 * The one REST route beyond /health (HC-10): verifies a magic link,
 * establishes the session cookie, and redirects into the app. Single use —
 * redeemMagicToken deletes the token row before returning.
 */
app.get("/auth/callback", async (request, reply) => {
  const query = z.object({ token: z.string().min(1) }).safeParse(request.query);
  if (!query.success) {
    return reply
      .code(400)
      .type("text/html")
      .send(renderAuthErrorPage("This sign-in link is missing its token."));
  }

  const result = await redeemMagicToken(query.data.token);
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This sign-in link has expired. Request a new one."
        : "This sign-in link is invalid or has already been used.";
    return reply.code(400).type("text/html").send(renderAuthErrorPage(message));
  }

  const { id, expiresAt } = await createSession(result.userId);
  reply.setCookie(SESSION_COOKIE_NAME, id, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    signed: true,
    expires: expiresAt,
  });

  return reply.redirect(`${env.APP_BASE_URL}/`);
});

/**
 * Single-service deploy: the built client is served from this same Fastify
 * process, same origin, so the magic-link session cookie (sameSite=lax,
 * HC-14) just works with no CORS or cross-subdomain cookie configuration.
 *
 * apps/client/dist sits two levels above this file whether it's running
 * compiled (apps/server/dist/index.js) or via tsx from source
 * (apps/server/src/index.ts) — both resolve to apps/client/dist.
 *
 * Guarded on existence so local `pnpm dev` (Vite's own dev server + proxy,
 * no client build present) is unaffected.
 */
const clientDist = join(dirname(fileURLToPath(import.meta.url)), "../../client/dist");

if (existsSync(clientDist)) {
  await app.register(fastifyStatic, {
    root: clientDist,
    index: "index.html",
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method === "GET" && !request.url.startsWith("/trpc")) {
      return reply.sendFile("index.html");
    }
    return reply.code(404).send({ error: "Not found" });
  });
} else {
  app.log.warn(
    `No built client found at ${clientDist} — serving API only. Run "pnpm build" for the full app.`,
  );
}

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
