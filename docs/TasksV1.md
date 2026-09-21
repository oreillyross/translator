# TasksV1 — Translator

Plan of record for v1. **If it is not in this file, it is not in v1** (CLAUDE.md HC-19).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[GRILL]` blocked on a ruling from the
user before it can be built.

Each phase ends in a runnable app. Do not start a phase before the one above it runs.

---

## Phase 0 — Settle the open decisions `[GRILL]`

These four are called out in the scratchpad as grill-me items. They change the architecture,
so they are answered before Phase 2. A recommendation is already on record in CLAUDE.md §4 —
the session's job is to defend or overturn it, not to start from blank.

- [ ] 0.1 `[GRILL]` **Vocabulary storage** — YAML-authored + seeded into MySQL (recommended),
      vs. YAML-only at runtime, vs. DB-only with an admin UI.
- [ ] 0.2 `[GRILL]` **LLM provider** — Anthropic behind an adapter (recommended), vs. OpenAI,
      vs. a translation-tuned Google model, vs. "Jev Typesafe" (user to explain what this is).
- [ ] 0.3 `[GRILL]` **Magic link implementation** — Better Auth magic-link plugin
      (recommended) vs. hand-rolled signed-token in the Kent C. Dodds shape.
- [ ] 0.4 `[GRILL]` **MySQL confirmation** — scratchpad wants to experiment with MySQL on
      Railway; confirm that stands (CLAUDE.md HC-12) or overturn it here.
- [ ] 0.5 Record every ruling by editing CLAUDE.md §4 and striking the `[GRILL]` tags.

**Exit:** no `[GRILL]` tags remain in this file or CLAUDE.md.

---

## Phase 1 — Monorepo skeleton

- [ ] 1.1 `pnpm` workspace at root; `apps/client`, `apps/server`, `packages/shared`,
      `packages/db`. Root `tsconfig.base.json`, strict mode on.
- [ ] 1.2 `packages/shared` — Zod-first: env schema, shared primitives. Builds and is
      importable from both apps.
- [ ] 1.3 `apps/server` — Fastify + tRPC v11 adapter, a `health.ping` procedure with Zod
      input and output.
- [ ] 1.4 `apps/client` — Vite + React + TS, tRPC client + TanStack Query, calls
      `health.ping` and renders the result.
- [ ] 1.5 Tailwind wired into the client with the Midnight Moon CSS variables from
      CLAUDE.md §5 exposed as theme tokens.
- [ ] 1.6 Root scripts: `dev` (both apps), `build`, `typecheck`, `lint`.
- [ ] 1.7 Zod-validated env loading; server exits with a readable error on a missing var.
- [ ] 1.8 `.env.example` covering every var (no real secrets committed).

**Exit:** `pnpm dev` serves a themed page that round-trips a typed tRPC call.

---

## Phase 2 — Database and vocabulary grammar

- [ ] 2.1 `packages/db` — Drizzle + `mysql2`, connection from validated env, migration setup.
- [ ] 2.2 Provision MySQL on Railway; connect local dev to it.
- [ ] 2.3 Schema — `user`, `session` (+ whatever 0.3's ruling requires for magic tokens).
- [ ] 2.4 Schema — the grammar: `bucket`, `term` (belongs to a bucket, has display text and
      an optional value), `template`, `template_slot` (ordered, points at a bucket, carries
      a literal prefix/suffix and a required/optional flag).
- [ ] 2.5 Schema — `language` (ISO code, English name, endonym, adjective/nationality form —
      the adjective is what feeds the `NATIONALITY` slot).
- [ ] 2.6 Zod schemas in `packages/shared` mirroring every table; inferred types only.
- [ ] 2.7 Authoring source: `packages/db/seed/*.yml` for buckets, terms and templates,
      parsed through Zod. Seed the four scratchpad example prompts as the fixture set.
- [ ] 2.8 Idempotent `pnpm db:seed` — safe to re-run.
- [ ] 2.9 Test: each of the four scratchpad example prompts decomposes into a valid
      slot/term path through the seeded grammar. This is the grammar's acceptance test.

**Exit:** seed runs against Railway MySQL; a query returns a template with its ordered slots
and each slot's terms.

---

## Phase 3 — Magic link auth

- [ ] 3.1 Resend account + verified sender domain; API key in env.
- [ ] 3.2 Implement per the 0.3 ruling: request-link endpoint, single-use short-TTL token,
      verify-and-redirect callback, httpOnly + secure + sameSite session cookie.
- [ ] 3.3 Branded email template (Midnight Moon), plain-text fallback, clear expiry copy.
- [ ] 3.4 tRPC context resolves the session; `protectedProcedure` throws `UNAUTHORIZED`
      without one.
- [ ] 3.5 Client: landing page with the email field + "check your inbox" state; gated app
      shell behind the session; sign out.
- [ ] 3.6 Rate-limit link requests per email and per IP.
- [ ] 3.7 Manual test: request → email → click → land in the gated app; expired and
      already-used links both fail with a readable message.

**Exit:** a real inbox round-trip logs a real user into an empty gated shell.

---

## Phase 4 — The constrained composer (the hard part)

- [ ] 4.1 `packages/shared` — a pure `resolveGrammar(template, committedTerms, draftText)`
      function: given what is committed and what is half-typed, return the current slot, the
      candidate terms, and the single best completion. No React in it, fully unit-testable.
- [ ] 4.2 Unit tests for 4.1 including every scratchpad example, prefix ambiguity
      (`Du` → Dutch), no-match, and end-of-template.
- [ ] 4.3 `usePromptComposer` hook — owns committed terms, draft text and cursor state, calls
      4.1, exposes accept / backtrack / reset.
- [ ] 4.4 Ghost-text input component: one real input over a positioned layer that renders
      committed text plus the grey completion. No dropdown (HC-6). Must survive font,
      resize and long-line cases without drifting out of alignment.
- [ ] 4.5 Keys: `Tab` / `→`-at-end accepts the completion and advances the slot; `Backspace`
      at slot start un-commits the previous term; `Esc` clears the draft.
- [ ] 4.6 Reject any keystroke that cannot lead to a valid term — the box physically cannot
      hold invalid text (HC-1).
- [ ] 4.7 Language slot: the one searchable-list exception, google-translate style, still
      keyboard-driven.
- [ ] 4.8 `Enter` on a complete prompt moves focus to the body box.
- [ ] 4.9 Visible state of the composed prompt — committed terms styled distinctly from the
      ghost, and a clear "prompt complete" signal.
- [ ] 4.10 Accessibility: correct ARIA for the prediction, screen-reader-announced
      completions, gold focus ring everywhere.

**Exit:** all four scratchpad prompts are composable with keyboard only, and nothing outside
the grammar can be typed.

---

## Phase 5 — Translate

- [ ] 5.1 LLM adapter interface in the server (`translate(systemPrompt, body) => string`),
      one implementation per the 0.2 ruling.
- [ ] 5.2 Baked-in base system prompt, composed with the user's grammar-built prompt. The
      base prompt is server-side only and never reaches the client.
- [ ] 5.3 `translate.run` tRPC procedure — protected, Zod in/out, body length cap, timeout,
      typed error surface.
- [ ] 5.4 Body textarea: free text (HC-2), autosize, char counter near the cap.
- [ ] 5.5 `Tab` from the body focuses Translate; `Cmd/Ctrl+Enter` submits.
- [ ] 5.6 Result panel with loading, error and empty states.
- [ ] 5.7 Copy button/icon with a confirmation tick; `Cmd/Ctrl+C`-adjacent shortcut.
- [ ] 5.8 Per-user rate limit and a hard cap on request size.
- [ ] 5.9 Log latency, token usage and failures server-side. Never log the body text.

**Exit:** the full loop works — compose, write, translate, copy.

---

## Phase 6 — Polish and ship

- [ ] 6.1 Full Midnight Moon pass over every screen; dark-first; responsive down to mobile.
- [ ] 6.2 Empty / loading / error / offline states everywhere.
- [ ] 6.3 End-to-end keyboard walkthrough with no mouse (HC-5 acceptance).
- [ ] 6.4 Deploy server + MySQL to Railway; client build served; env configured in prod.
- [ ] 6.5 Production magic-link round-trip on the real domain.
- [ ] 6.6 README: run locally, seed, deploy, add a new vocabulary term.
- [ ] 6.7 Basic error monitoring and a health check.
- [ ] 6.8 Walk the Vision.md success criteria and record the actual timings.

**Exit:** a stranger can use it on the public URL.

---

## Explicitly out of scope for v1

Saved prompts · translation history · from/to language settings · non-English source ·
multi-turn chat · streaming output · team accounts · admin vocabulary UI · mobile app.
New ideas go to the Vision.md parking lot.
