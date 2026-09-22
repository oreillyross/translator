import { router } from "./trpc.js";
import { healthRouter } from "./routers/health.js";
import { authRouter } from "./routers/auth.js";
import { grammarRouter } from "./routers/grammar.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  grammar: grammarRouter,
});

export type AppRouter = typeof appRouter;
