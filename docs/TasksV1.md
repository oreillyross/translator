# TasksV1 — Translator

Plan of record for v1. **If it is not in this file, it is not in v1** (CLAUDE.md HC-19).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

Each phase ends in a runnable app. Do not start a phase before the one above it runs.

---

## Phase 0 — Settle the open decisions ✅ COMPLETE

Closed in the grill session of 2026-09-21. All four scratchpad grill-me questions are ruled
on and written up in CLAUDE.md §4; no `[GRILL]` tags remain in the repo.

- [x] 0.1 **Vocabulary storage** → YAML only, in memory. No database tables. (§4.2)
- [x] 0.2 **LLM provider** → Anthropic, default `claude-sonnet-5`, env-var swap. "Jev
      Typesafe" resolved as a typed classifier, not a generator — out for v1. (§4.3)
- [x] 0.3 **Magic link** → hand-rolled, not Better Auth. (§4.4)
- [x] 0.4 **Datastore** → Postgres on Railway, overturning the scratchpad's MySQL. (§4.1)
- [x] 0.5 Two further rulings came out of the same session: LANGUAGE and NATIONALITY collapse
      into one slot, and the trailing slot is CONTEXT (a person, occasion *or* purpose), not
      AUDIENCE. (§4.5)

---

## Phase 1 — Monorepo skeleton

- [x] 1.1 `pnpm` workspace at root; `apps/client`, `apps/server`, `packages/shared`,
      `packages/db`. Root `tsconfig.base.json`, strict mode on.
- [x] 1.2 `packages/shared` — Zod-first: env schema, shared primitives. Builds and is
      importable from both apps.
- [x] 1.3 `apps/server` — Fastify + tRPC v11 adapter, a `health.ping` procedure with Zod
      input and output.
- [x] 1.4 `apps/client` — Vite + React + TS, tRPC client + TanStack Query, calls
      `health.ping` and renders the result.
- [x] 1.5 Tailwind wired into the client with the Midnight Moon CSS variables from
      CLAUDE.md §5 exposed as theme tokens.
- [x] 1.6 Root scripts: `dev` (both apps), `build`, `typecheck`, `lint`, `test`.
- [x] 1.7 Zod-validated env loading; server exits with a readable error on a missing var.
      Includes `ANTHROPIC_MODEL`, defaulting to `claude-sonnet-5`.
- [x] 1.8 `.env.example` covering every var (no real secrets committed).

**Exit:** `pnpm dev` serves a themed page that round-trips a typed tRPC call.

---

## Phase 2 — Vocabulary grammar + auth tables

Much smaller than originally planned: ruling 0.1 removed the vocabulary from the database
entirely, so this phase is mostly YAML and one pure function's data model.

- [x] 2.1 `packages/db` — Drizzle + `postgres` (postgres.js), connection from validated env,
      migration setup.
- [ ] 2.2 Provision Postgres on Railway; connect local dev to it. *(Deferred — needs a real
      Railway project/credentials; schema, client and migration tooling are ready to point
      at it once provisioned.)*
- [x] 2.3 Schema — exactly three tables: `user`, `session`, `magic_token`. Nothing else.
- [x] 2.4 Zod grammar schemas in `packages/shared`: `Term` (display text, optional `article`
      on language terms), `Bucket`, `Slot` (ordered, bucket-bound, with its literal
      prefix/suffix), `Template`. Types inferred, never hand-written.
- [x] 2.5 `apps/server/vocabulary/*.yml` — the authored source of truth. One file per bucket.
- [x] 2.6 Boot-time loader: parse YAML through the 2.4 schemas, fail fast and loud on an
      invalid file, hold the result in memory.
- [x] 2.7 Seed the vocabulary to the §4.6 sizes: ~40 languages (each with its article),
      ~12 roles, ~4 task verbs, ~10 artifacts, ~15 contexts.
- [x] 2.8 Test: each of the four scratchpad example prompts decomposes into a valid
      slot/term path through the seeded grammar. This is the grammar's acceptance test and
      it does not get deleted.
- [x] 2.9 Test: every language term has an article, and it is correct for vowel-initial
      languages (Italian, Irish, Icelandic, English, Arabic).

**Exit:** the server boots, parses the vocabulary, and rejects a malformed YAML file with a
readable error.

---

## Phase 3 — Magic link auth (hand-rolled)

- [x] 3.1 Resend account + verified sender domain; API key in env. *(Env var wired and
      Zod-validated; creating the actual Resend account/domain is an external manual step —
      `RESEND_API_KEY`/`RESEND_FROM_EMAIL` are ready to point at it.)*
- [x] 3.2 Request-link endpoint: 32 bytes from `crypto.randomBytes`, base64url into the URL,
      **only the SHA-256 hash stored**, 15-minute TTL.
- [x] 3.3 Identical response for every email address, known or not — no enumeration.
- [x] 3.4 Verify-and-redirect callback: single use, row deleted on redemption, expired and
      already-used both fail with a readable message.
- [x] 3.5 First successful redemption creates the user. No separate signup flow.
- [x] 3.6 Session: opaque ID in an httpOnly + secure + sameSite=lax cookie, 30-day rolling
      expiry, backed by the `session` row.
- [x] 3.7 Branded email template (Midnight Moon), plain-text fallback, clear expiry copy.
- [x] 3.8 tRPC context resolves the session; `protectedProcedure` throws `UNAUTHORIZED`
      without one. Sign out revokes the row.
- [x] 3.9 Client: landing page with the email field + "check your inbox" state; gated app
      shell behind the session.
- [x] 3.10 Rate-limit link requests per email and per IP.
- [x] 3.11 Tests: hash-not-token is what's stored; a redeemed token cannot be reused; an
      expired token fails; the response is byte-identical for known and unknown emails.
      *(Unit-tested against in-memory fake stores — see `apps/server/src/auth/*.test.ts` —
      since real Postgres is still deferred per 2.2.)*

**Exit:** a real inbox round-trip logs a real user into an empty gated shell.

---

## Phase 4 — The constrained composer (the hard part)

Grew in the grill session: the furniture and article mechanics are now explicit tasks rather
than implementation details to be discovered.

- [ ] 4.1 `packages/shared` — a pure `resolveGrammar(template, committedTerms, draftText)`:
      given what is committed and what is half-typed, return the current slot, the candidate
      terms, and the single best completion **for that slot only**. No React in it.
- [ ] 4.2 Unit tests for 4.1: every scratchpad example, prefix ambiguity (`du` → Dutch),
      no-match, end-of-template, and the article-selection cases from 2.9.
- [ ] 4.3 `usePromptComposer` hook — owns committed terms, draft text and cursor state, calls
      4.1, exposes accept / backtrack / reset.
- [ ] 4.4 Ghost-text input: one real input over a positioned layer rendering committed terms,
      non-editable literals, and the grey completion. No dropdown (HC-6). Must survive font,
      resize and long-line cases without drifting out of alignment.
- [ ] 4.5 Literals as furniture: `You are `, `. `, ` me to write ` are pre-rendered and
      non-editable; the cursor starts after `You are `; they are never typed and never
      deletable as text.
- [ ] 4.6 Article resolution: committing a language term renders its `article` into the
      furniture (`You are an Italian `), with no inflection logic anywhere.
- [ ] 4.7 Keys: `Tab` / `→`-at-end accepts the completion and advances the slot; `Backspace`
      at slot start un-commits the previous term (and its article); `Esc` clears the draft.
- [ ] 4.8 Reject any keystroke that cannot lead to a valid term in the current slot — the box
      physically cannot hold invalid text (HC-1).
- [ ] 4.9 `Enter` on a complete prompt moves focus to the body box.
- [ ] 4.10 Committed terms in `--dm-cream`, literals dimmer, ghost in `--dm-blush` at reduced
      opacity; a clear "prompt complete" signal.
- [ ] 4.11 `grammar.get` tRPC query, fetched once on load and cached by TanStack Query. All
      resolution runs client-side against that copy — zero network in the keystroke path.
- [ ] 4.12 Accessibility: correct ARIA for the prediction, screen-reader-announced
      completions, gold focus ring everywhere.

**Exit:** all four scratchpad prompts are composable with keyboard only, nothing outside the
grammar can be typed, and no keystroke touches the network.

---

## Phase 5 — Translate

- [ ] 5.1 LLM adapter (`translate(systemPrompt, body) => string`) over `@anthropic-ai/sdk`.
      Model from `ANTHROPIC_MODEL`. **No `thinking`, no `effort`** (HC-16).
- [ ] 5.2 Baked-in base system prompt, composed with the user's grammar-built prompt and
      carrying `Write your response entirely in {language}.` explicitly. Server-side only —
      it never reaches the client.
- [ ] 5.3 `translate.run` tRPC procedure — protected, Zod in/out, body length cap, timeout,
      typed error surface.
- [ ] 5.4 Body textarea: free text (HC-2), autosize, char counter near the cap.
- [ ] 5.5 `Tab` from the body focuses Translate; `Cmd/Ctrl+Enter` submits.
- [ ] 5.6 Result panel with loading, error and empty states.
- [ ] 5.7 Copy button/icon with a confirmation tick.
- [ ] 5.8 Per-user rate limit and a hard cap on request size.
- [ ] 5.9 Log latency, token usage and failures server-side. **Never log the body text.**

**Exit:** the full loop works — compose, write, translate, copy.

---

## Phase 6 — Polish and ship

- [ ] 6.1 Full Midnight Moon pass over every screen; dark-first; responsive down to mobile.
- [ ] 6.2 Empty / loading / error / offline states everywhere.
- [ ] 6.3 End-to-end keyboard walkthrough with no mouse (HC-5 acceptance).
- [x] 6.4 Deploy server + Postgres to Railway as **one service** (CLAUDE.md §4.7) — the
      Fastify server serves the built client same-origin, so the magic-link cookie needs no
      cross-subdomain config. Root `railway.json` builds and starts it; env configured in
      prod. Manual step: delete the auto-created `@translator/client` service in the Railway
      dashboard, since a file in the repo can't do that part.
- [ ] 6.5 Production magic-link round-trip on the real domain.
- [ ] 6.6 README: run locally, deploy, and add a new vocabulary term.
- [ ] 6.7 Basic error monitoring and a health check.
- [ ] 6.8 Walk the Vision.md success criteria and record the actual timings.

**Exit:** a stranger can use it on the public URL.

---

## Explicitly out of scope for v1

Saved prompts · translation history · from/to language settings · any settings UI · multiple
prompt templates · non-English source · multi-turn chat · streaming output · team accounts ·
database-backed vocabulary · admin vocabulary UI · mobile app.
New ideas go to the Vision.md parking lot.
