# Translator

A magic-link-gated web app with two inputs: a constrained prompt composer (pick who's
writing, via inline grey ghost-text typeahead) and a free-text body box. One Translate press
sends both to Anthropic and returns a native-sounding translation, ready to copy.

The full product spec lives in [`docs/Vision.md`](docs/Vision.md); the hard constraints and
settled decisions are in [`CLAUDE.md`](CLAUDE.md); the phase-by-phase build plan is in
[`docs/TasksV1.md`](docs/TasksV1.md).

## Stack

TypeScript, React + Vite, Fastify + tRPC v11, Zod everywhere, Drizzle ORM over Postgres,
Tailwind, Anthropic SDK — see [`CLAUDE.md` §3](CLAUDE.md#3-stack-of-record) for the full
table and the monorepo layout (`apps/client`, `apps/server`, `packages/shared`,
`packages/db`).

## Run locally

Prerequisites: Node 20+, pnpm, a local Postgres instance, and (for a real translation) an
Anthropic API key.

```bash
pnpm install

# Postgres — point DATABASE_URL at any reachable instance, then apply the schema:
pnpm --filter @translator/db run db:migrate

cp .env.example .env   # fill in DATABASE_URL, ANTHROPIC_API_KEY, RESEND_API_KEY, etc.

pnpm dev                # runs apps/client (Vite, :5173) and apps/server (Fastify, :3001)
```

Open `http://localhost:5173`. Signing in sends a magic link via Resend — without a real
`RESEND_API_KEY`/`RESEND_FROM_EMAIL` the request still succeeds (no enumeration, per
CLAUDE.md §4.4) but no email arrives; the token is written to the `magic_token` table if you
need to redeem one by hand while developing.

Useful root scripts (each fans out to every workspace): `pnpm build`, `pnpm typecheck`,
`pnpm lint`, `pnpm test`.

### Env vars

See [`.env.example`](.env.example) for the full list; every var is Zod-validated at server
boot (`apps/server/src/env.ts`), so a missing one fails fast with a readable error rather
than a runtime crash later. The `ANTHROPIC_MODEL` var is how you swap models — no code
change, no settings UI (HC-4/HC-16).

## Deploy

One Railway service — the Fastify server serves the built client same-origin, so the
magic-link session cookie needs no cross-subdomain config (see
[`CLAUDE.md` §4.7](CLAUDE.md#47-deploy--one-railway-service-not-two) for why). `railway.json`
at the repo root drives it:

- **Build**: `pnpm install --frozen-lockfile && pnpm build` (topological — `packages/db` and
  `packages/shared` build before the apps).
- **Pre-deploy**: `pnpm --filter @translator/db run db:migrate` — applies any new Drizzle
  migration before the new server code starts.
- **Start**: `pnpm --filter @translator/server run start`.
- **Health check**: `/health`.

Manual steps a config file can't do for you:

1. Provision a Postgres instance on Railway and set `DATABASE_URL` from it.
2. Set every other env var in `.env.example` on the Railway service (`ANTHROPIC_API_KEY`,
   `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SESSION_COOKIE_SECRET`, `APP_BASE_URL`).
3. Delete the `@translator/client` service Railway's monorepo auto-detection creates — only
   the server service should exist; it serves the client's built assets itself.

## Adding a vocabulary term

The vocabulary is YAML in the repo (`apps/server/src/vocabulary/*.yml`), parsed through Zod
at server boot and held in memory — never in the database (CLAUDE.md §4.2/HC-20). To add a
term:

1. Open the bucket file for the slot you're extending — `languages.yml`, `roles.yml`,
   `taskVerbs.yml`, `artifacts.yml`, or `contexts.yml`.
2. Add a row: `value` (a stable internal id, lowercase), `display` (what the user sees and
   types toward), and — for `languages.yml` only — `article` (`a` or `an`).
3. Restart the server (or redeploy). A malformed row fails boot loudly rather than serving a
   broken grammar (`apps/server/src/vocabulary/loader.ts`).

No code change, no migration — that's the point (Vision.md success criterion #4). Adding a
new *slot* (as opposed to a new term in an existing slot) is a bigger change: it touches the
template (`template.yml`) and the grammar resolver's tests, and is out of scope for a
one-line edit.

## Testing

`pnpm test` runs Vitest across every workspace: the grammar resolver's unit tests
(`packages/shared`), auth/vocabulary/translate router tests (`apps/server`), and the
composer's component tests (`apps/client`). CI-equivalent checks: `pnpm typecheck`,
`pnpm lint`, `pnpm build`, `pnpm test`.
