import { router } from "./trpc.js";
import { healthRouter } from "./routers/health.js";
import { authRouter } from "./routers/auth.js";
import { grammarRouter } from "./routers/grammar.js";
import { translateRouter } from "./routers/translate.js";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  grammar: grammarRouter,
  translate: translateRouter,
});

export type AppRouter = typeof appRouter;
