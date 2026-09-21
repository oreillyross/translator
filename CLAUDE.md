# CLAUDE.md — Translator

Standing system prompt for every session in this repo. Read this before writing code.
The north star lives in `docs/Vision.md`. The plan of record lives in `docs/TasksV1.md`.
Original intent is preserved verbatim in `docs/scratchpad` — it is the source, this file is the contract.

---

## 1. What this app is (one paragraph)

Translator is a magic-link-gated web app with two inputs. The first is a **constrained prompt
composer**: the user builds a system prompt out of a pre-approved vocabulary using inline
grey ghost-text typeahead — they cannot free-type arbitrary text there. The second is a
**free-text body box** where they write their actual email/letter/speech in English. Tab to a
Translate button, one LLM call goes out with the composed system prompt plus the body, the
translated result comes back and is displayed with a one-click copy.

---

## 2. Hard constraints (non-negotiable — these exist to stop app drift)

**Product**

- HC-1 — The prompt composer is **constrained**. No free typing in it, ever. Every accepted
  token comes from an approved vocabulary bucket bound to a template slot.
- HC-2 — The body box **is** free text. Do not constrain it.
- HC-3 — Exactly two text inputs and one action. No chat history UI, no multi-turn thread,
  no streaming conversation in v1.
- HC-4 — MVP is **English → one target language**. Source language is hardcoded English.
  Language pair settings and saved prompts are **v2**, explicitly out of scope for v1.
- HC-5 — Keyboard flow is a first-class feature: compose prompt → Tab/Enter → body →
  Tab → Translate. It must work end to end without a mouse.
- HC-6 — Ghost-text prediction renders as grey inline text in the same box. It is not a
  dropdown. `react-select` and dropdown-first pickers are rejected for the composer.
  (A searchable list is permitted **only** for the language slot, google-translate style.)
- HC-7 — One translation call per Translate press. No agent loops, no tool calling, no
  multi-step chains in v1.

**Technical**

- HC-8 — TypeScript everywhere. No `.js` source files, no `any` in committed code.
- HC-9 — Zod is the single source of truth for every boundary: tRPC inputs/outputs, env
  vars, LLM response parsing, seed-file parsing. Types are inferred from schemas, never
  hand-written alongside them.
- HC-10 — tRPC is the only client↔server transport. No REST routes except the auth
  callback and a health check.
- HC-11 — pnpm monorepo, `apps/client` + `apps/server` + `packages/shared` (+ `packages/db`).
  Shared code goes in a package, never imported across app boundaries by relative path.
- HC-12 — MySQL on Railway is the datastore. Drizzle is the ORM. No Postgres, no SQLite,
  no Prisma, unless a grill session overturns it and this line is edited first.
- HC-13 — Tailwind CSS with the Dahlia "Midnight Moon" palette in §5. No second design
  system, no component library that ships its own opinionated theme.
- HC-14 — Auth is passwordless magic link over Resend. No passwords, no OAuth in v1.
- HC-15 — Secrets live in env vars validated by Zod at boot. The server fails fast and loud
  on a missing var. No API key ever reaches the client bundle.
- HC-16 — The LLM provider sits behind one interface in `packages/shared` (or a
  `server/llm` module). Swapping providers must touch one file.

**Process**

- HC-17 — Ship the smallest working vertical slice. Prefer a working thin path over a
  complete design.
- HC-18 — A decision marked `[GRILL]` below is **not settled**. Do not build past it on a
  guess — surface it and get a ruling.
- HC-19 — Anything not in `docs/TasksV1.md` is not in v1. New ideas get appended to a
  "V2 parking lot", not implemented.

---

## 3. Stack of record

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Validation | Zod |
| Client | React + Vite |
| Transport | tRPC v11 + TanStack Query |
| Server | Node + Fastify tRPC adapter |
| DB | MySQL (Railway) via Drizzle ORM + `mysql2` |
| Auth | Magic link (Resend) — see §4 |
| Styling | Tailwind CSS |
| Package mgr | pnpm workspaces |
| Hosting | Railway (server + MySQL); client static or same service |

```
translator/
├─ apps/
│  ├─ client/      React + Vite + Tailwind
│  └─ server/      Fastify + tRPC + auth + LLM adapter
├─ packages/
│  ├─ shared/      Zod schemas, tRPC router types, prompt-grammar types
│  └─ db/          Drizzle schema, migrations, seed
└─ docs/           Vision.md, TasksV1.md, scratchpad
```

---

## 4. Decisions carried over from the scratchpad

**Magic link.** The Kent C. Dodds pattern is: sign a short-lived payload server-side, email
the URL, verify the signature on click, then set an httpOnly session cookie. That pattern is
correct; hand-rolling it in 2026 is not the best use of the first sprint.
**Recommendation: Better Auth's magic-link plugin with the Drizzle/MySQL adapter and a Resend
sender.** Same semantics (single-use, short TTL, httpOnly cookie), maintained by someone else.
Fallback if it fights the monorepo: hand-rolled signed token, 15-min TTL, single-use row in
a `magic_token` table. `[GRILL]`

**Vocabulary storage.** Neither pure flatfile nor DB-only.
**Recommendation: YAML in the repo is the authored source of truth; a seed script parses it
through Zod and loads it into MySQL; the app reads MySQL at runtime.** Version-controlled and
reviewable when authoring, queryable and editable-without-deploy later. `[GRILL]`

**Prompt compartmentalisation.** The vocabulary is not a flat bag of words — it is a
**grammar**. A template is an ordered list of slots; each slot points at a bucket of approved
terms; the typeahead at any cursor position offers only the current slot's bucket. This is
what makes constrained-but-flexible work.

Template: `You are a {NATIONALITY} {ROLE}, help me to write {ARTIFACT} {AUDIENCE} in {LANGUAGE}.`

| Slot | Bucket examples |
|---|---|
| `NATIONALITY` | Dutch, French, German, Italian … (derived from the language list) |
| `ROLE` | teacher, businessman, friend, real estate agent, lawyer … |
| `ARTIFACT` | an email, an informal letter, a speech, a motivation letter … |
| `AUDIENCE` | to my college professor, to the business administration, for my friend's birthday party … |
| `LANGUAGE` | full ISO language list (searchable slot — the one HC-6 exception) |
| `REGISTER` | formal / informal (optional slot) |

All four scratchpad examples decompose cleanly into this grammar. That is the acceptance test
for any change to it.

**LLM provider.** Google's translation-tuned models are translation-only and cannot honour a
persona system prompt; this app is persona-driven rewriting, not literal translation.
**Recommendation: Anthropic Claude behind the §2 HC-16 adapter interface**, with an OpenAI
implementation of the same interface as a swap-in. "Jev Typesafe" is unverified — parked
until the user explains what it is. `[GRILL]`

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

Committed tokens render in `--dm-cream`; the predicted ghost word renders in
`--dm-blush` at reduced opacity. Focus ring is always `--dm-gold` (HC-5 depends on the
user seeing where focus is).

---

## 6. Working agreements

- Commit in vertical slices that leave the app runnable.
- Every tRPC procedure has a Zod input and a Zod output. No exceptions.
- Do not add a dependency that duplicates something in §3.
- When a `[GRILL]` item is settled, edit this file in the same commit that implements it.
