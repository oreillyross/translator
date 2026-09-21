import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";

export const healthRouter = router({
  ping: publicProcedure
    .input(z.object({}).optional())
    .output(z.object({ status: z.literal("ok"), timestamp: z.string() }))
    .query(() => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    })),
});
