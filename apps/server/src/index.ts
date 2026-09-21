import cors from "@fastify/cors";
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

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
