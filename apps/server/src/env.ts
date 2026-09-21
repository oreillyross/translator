import { z } from "zod";
import { sharedEnvSchema } from "@translator/shared";

/**
 * Fails fast and loud on boot (HC-15). Every secret the server needs lives
 * here — nothing reaches the client bundle because this module is never
 * imported from apps/client.
 */
const serverEnvSchema = sharedEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  SESSION_COOKIE_SECRET: z.string().min(32),
  APP_BASE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
