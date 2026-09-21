import { z } from "zod";

/**
 * Vars every part of the app agrees on. `apps/server` extends this with
 * server-only secrets (DATABASE_URL, RESEND_API_KEY, ANTHROPIC_API_KEY, ...).
 */
export const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;
