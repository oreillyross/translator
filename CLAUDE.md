# CLAUDE.md — Translator

Standing system prompt for every session in this repo. Read this before writing code.
The north star lives in `docs/Vision.md`. The plan of record lives in `docs/TasksV1.md`.
Original intent is preserved verbatim in `docs/scratchpad` — it is the source, this file is
the contract. Where the two disagree, this file wins: it records decisions made after the
scratchpad was written.

---

## 1. What this app is (one paragraph)

Translator is a magic-link-gated web app with two inputs. The first is a **constrained prompt
composer**: the user builds a system prompt out of a pre-approved vocabulary using inline
grey ghost-text typeahead — they cannot free-type arbitrary text there. The second is a
**free-text body box** where they write their actual email/letter/speech in English. Tab to a
Translate button, one LLM call goes out with the composed system prompt plus the body, the
translated result comes back and is displayed with a one-click copy.

---

## 2. Hard constraints

**"HC" means Hard Constraint.** They are numbered so a change can be challenged precisely —
"that breaks HC-3" rather than "that breaks the thing about the two inputs." They exist to
stop app drift, and they are non-negotiable: a proposed change that breaks one is out of
scope regardless of merit, until the constraint itself is edited here first.

**Product**

- HC-1 — The prompt composer is **constrained**. No free typing in it, ever. Every accepted
  token comes from an approved vocabulary bucket bound to a template slot.
- HC-2 — The body box **is** free text. Do not constrain it. The composer sets persona and
  speech act; every specific fact belongs in the body.
- HC-3 — Exactly two text inputs and one action. No chat history UI, no multi-turn thread,
  no streaming conversation in v1.
- HC-4 — MVP is **English → one target language**. Source language is hardcoded English.
  Language-pair settings, saved prompts and a settings UI of any kind are **v2**, explicitly
  out of scope for v1.
- HC-5 — Keyboard flow is a first-class feature: compose prompt → Tab/Enter → body →
  Tab → Translate. It must work end to end without a mouse.
- HC-6 — Ghost-text prediction renders as grey inline text in the same box, completing
  **the current slot only** — never the rest of the line. It is not a dropdown;
  `react-select` and dropdown-first pickers are rejected. There are no exceptions to this:
  every slot, including language, resolves by inline typeahead.
- HC-7 — One translation call per Translate press. No agent loops, no tool calling, no
  multi-step chains in v1.

**Technical**

- HC-8 — TypeScript everywhere. No `.js` source files, no `any` in committed code.
- HC-9 — Zod is the single source of truth for every boundary: tRPC inputs/outputs, env
  vars, LLM response parsing, YAML vocabulary parsing. Types are inferred from schemas,
  never hand-written alongside them.
- HC-10 — tRPC is the only client↔server transport. No REST routes except the auth
  callback and a health check.
- HC-11 — pnpm monorepo, `apps/client` + `apps/server` + `packages/shared` + `packages/db`.
  Shared code goes in a package, never imported across app boundaries by relative path.
- HC-12 — **Postgres on Railway** via Drizzle ORM. No MySQL, no SQLite, no Prisma. The
  database holds exactly three tables — `user`, `session`, `magic_token` — and nothing else.
  The vocabulary is **not** in the database (HC-20).
- HC-13 — Tailwind CSS with the Dahlia "Midnight Moon" palette in §5. No second design
  system, no component library that ships its own opinionated theme.
- HC-14 — Auth is passwordless magic link over Resend, hand-rolled per §4. No passwords,
  no OAuth, no third-party auth library in v1.
- HC-15 — Secrets live in env vars validated by Zod at boot. The server fails fast and loud
  on a missing var. No API key ever reaches the client bundle.
- HC-16 — The LLM provider sits behind one adapter interface. Swapping providers touches one
  file; swapping *models* touches one env var. To keep that true, **the adapter sends no
  `thinking` and no `effort` parameter** — those differ in shape between model tiers and
  would turn a string swap into a code change.
- HC-20 — The vocabulary lives in **YAML in the repo**, parsed through Zod and held in
  memory. It is served to the client once per load and resolved entirely client-side. No
  vocabulary tables, no per-keystroke network calls.

**Process**

- HC-17 — Ship the smallest working vertical slice. Prefer a working thin path over a
  complete design.
- HC-18 — Decisions in §4 are settled. Reopening one means editing this file in the same
  commit, not working around it.
- HC-19 — Anything not in `docs/TasksV1.md` is not in v1. New ideas get appended to the
  Vision.md "v2 parking lot", not implemented.

---

## 3. Stack of record

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Validation | Zod |
| Client | React + Vite |
| Transport | tRPC v11 + TanStack Query |
| Server | Node + Fastify tRPC adapter |
| DB | **Postgres (Railway)** via Drizzle ORM + `postgres` (postgres.js) |
| Auth | Hand-rolled magic link over Resend — see §4 |
| LLM | Anthropic SDK (`@anthropic-ai/sdk`) behind the HC-16 adapter |
| Styling | Tailwind CSS |
| Package mgr | pnpm workspaces |
| Hosting | Railway (server + Postgres); client static or same service |

```
translator/
├─ apps/
│  ├─ client/      React + Vite + Tailwind
│  └─ server/      Fastify + tRPC + auth + LLM adapter + YAML vocabulary
├─ packages/
│  ├─ shared/      Zod schemas, grammar types, resolveGrammar()
│  └─ db/          Drizzle schema + migrations (3 tables)
└─ docs/           Vision.md, TasksV1.md, scratchpad
```

---

## 4. Settled decisions

Ruled on in the grill session of 2026-09-21. These are answers, not recommendations.

### 4.1 Datastore — Postgres, not MySQL

The scratchpad wanted to experiment with MySQL on Railway. Nothing in this app needs a
MySQL-specific feature, Postgres is the better-trodden Drizzle+Railway path, and once the
vocabulary moved out of the database (4.2) the only thing left in it is three auth tables.
**Postgres.**

### 4.2 Vocabulary — YAML only, no database

Authored as YAML in the repo, parsed through Zod at server boot, held in memory. Database
tables were rejected: their only benefit is editing without a deploy, and the single user of
this app is also its only author. This deletes four tables, a seed script and a migration
path. A DB-backed vocabulary is a v2 migration if an admin UI ever matters.

### 4.3 LLM — Anthropic, default Sonnet 5

Google's translation-tuned models cannot honour a persona system prompt, and this app is
persona-driven rewriting rather than literal translation. **"Jev Typesafe" is resolved**: it
is a typed classifier (yes/no, pick-one, score-on-a-rubric, returning calibrated
probabilities) and explicitly not for generation — it cannot translate. It is out for v1; it
would be a reasonable v2 output-quality gate.

- Default model: **`claude-sonnet-5`** (no date suffix — the model IDs are complete as-is).
- Swap via the `ANTHROPIC_MODEL` env var, Zod-validated at boot. No settings UI (HC-4).
- No `thinking`, no `effort` in the request (HC-16) — those parameters differ in shape
  between model tiers, and omitting them is what keeps the swap a one-variable change.

### 4.4 Magic link — hand-rolled

No Better Auth, no third-party auth library. The mechanics are owned here:

- **Token**: 32 bytes from `crypto.randomBytes`, base64url-encoded into the URL. Only the
  **SHA-256 hash** is stored — a database leak yields nothing usable.
- **Lifetime**: 15-minute TTL, single use, row deleted on redemption.
- **Not a JWT**: single-use and revocation both need a row anyway, so a stateless token buys
  nothing and adds a signing-key footgun.
- **No signup flow**: the first successful redemption creates the user.
- **No enumeration**: every email address gets an identical response, known or not.
- **Session**: opaque session ID in an httpOnly + secure + sameSite=lax cookie, 30-day
  rolling expiry, backed by the `session` row so it can be revoked.

### 4.5 The prompt grammar

The vocabulary is a **grammar**, not a flat word list: one template, an ordered list of
slots, each slot bound to a bucket of approved terms. The typeahead at any cursor position
offers only the current slot's bucket. This is what makes constrained-but-flexible work.

```
You are {ARTICLE} {LANGUAGE} {ROLE}. {TASK_VERB} me to write {ARTIFACT} {CONTEXT}.
```

| Slot | Notes | Examples |
|---|---|---|
| `LANGUAGE` | Sets the persona's nationality **and** the target language — one value, never two. Each term carries its own `article` (`a`/`an`) as data. | Dutch, French, German, Italian |
| `ROLE` | | teacher, businessman, friend, real estate agent |
| `TASK_VERB` | The speech act. Needed because not every prompt is "help me". | help, give advice |
| `ARTIFACT` | | an email, an informal letter, a speech, a motivation letter |
| `CONTEXT` | A trailing prepositional phrase. **Not** "audience" — it may be a person, an occasion or a purpose. | to my college professor, to the business administration, for my friend's birthday party, to buy the house |

Rules that fall out of this:

- **One template only.** Multiple templates would need a picker, which breaks HC-3.
- **No trailing "in {language}".** Redundant once `LANGUAGE` opens the sentence. The
  server-side base prompt carries `Write your response entirely in {language}.` explicitly.
- **Articles are data, not logic.** `an Italian`, `a Dutch` — carried on the term, so there
  are no inflection rules to get wrong.
- **Literals are furniture.** `You are `, `. `, ` me to write ` are pre-rendered and
  non-editable; the cursor starts after `You are `. The user never types them.
- **Acceptance test**: all four scratchpad example prompts must decompose into a valid path
  through this grammar. They do. Any change to the grammar must keep that true.

### 4.6 Seed vocabulary size for v1

~40 languages, ~12 roles, ~4 task verbs, ~10 artifacts, ~15 contexts — about 81 terms, one
authoring sitting, yielding 7,200 distinct prompts per language. Do not seed all 180 ISO
languages up front.

---

## 5. Theme — Dahlia "Midnight Moon"

Dark near-black plum foliage, deep purple, vivid magenta bleeding to blush, cream petals,
a gold center, and green leaf. Dark-first, colourful, not neon.

```css
--dm-ink:      #12060F;  /* near-black plum — page bg */
--dm-shadow:   #2A0E2E;  /* deep foliage purple — surfaces */
--dm-plum:     #4B1651;  /* raised surfaces, borders */
--dm-magenta:  #C21E7A;  /* primary action */
--dm-fuchsia:  #E0479E;  /* hover / accent */
--dm-blush:    #F7C6DD;  /* soft highlight, ghost-text on dark */
--dm-cream:    #FBF4EA;  /* primary text */
--dm-gold:     #F2B705;  /* focus ring, the flower's center */
--dm-leaf:     #2E7D5B;  /* success / valid-token */
```

Committed terms render in `--dm-cream`; non-editable literals sit dimmer; the ghost
completion renders in `--dm-blush` at reduced opacity. Focus ring is always `--dm-gold`
(HC-5 depends on the user seeing where focus is).

---

## 6. Working agreements

- Commit in vertical slices that leave the app runnable.
- Every tRPC procedure has a Zod input and a Zod output. No exceptions.
- Do not add a dependency that duplicates something in §3.
- Reopening a §4 decision means editing §4 in the same commit that changes the code.
