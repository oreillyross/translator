import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Dummy values so importing env.ts (pulled in transitively via db.ts)
    // doesn't fail boot validation — no test touches a real DB, Resend, or
    // Anthropic call; the auth tests inject in-memory fake stores instead.
    env: {
      DATABASE_URL: "postgres://user:password@localhost:5432/translator_test",
      ANTHROPIC_API_KEY: "sk-ant-test",
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "login@example.com",
      SESSION_COOKIE_SECRET: "test-secret-at-least-32-characters-long",
      APP_BASE_URL: "http://localhost:5173",
    },
  },
});
