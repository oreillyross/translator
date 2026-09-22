import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { env } from "./env.js";
import { appRouter } from "./router.js";
import { loadVocabulary } from "./vocabulary/loader.js";

// Fail fast and loud on a malformed vocabulary file (2.6 / HC-15).
loadVocabulary();

const app = Fastify({ logger: true });

await app.register(cors, { origin: env.APP_BASE_URL, credentials: true });

await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
  },
});

app.get("/health", async () => ({ status: "ok" }));

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
