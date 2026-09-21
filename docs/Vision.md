# Vision — Translator

> The north star. When a decision is ambiguous, the answer is whichever option moves toward
> the picture below. When a feature is tempting but not in this picture, it is v2.

---

## The one-sentence version

**Translator lets someone who cannot write in a language produce something that sounds like a
native wrote it — by choosing who is writing, not by wording a prompt.**

---

## The problem it solves

Generic translation gives you literally-correct text that lands wrong. An email to a Dutch
professor and a speech at a German friend's birthday need different registers, idioms and
conventions — and the person writing them has no idea what those are. An LLM can do this
well, but only if it is told *who it is*, and most people cannot write a good persona prompt.

So the app writes the prompt for them, from a menu they can feel their way through.

---

## The moment the app is built around

Land on the home page. One field, one button: "email me a link". The link arrives, they click,
they are in.

They see one composer line. They start typing `You are a Du` — the rest of the line ghosts in
grey ahead of the cursor: `tch teacher, help me to write…`. Tab. Tab again. The persona is
built in five keystrokes without a single dropdown. Enter drops the cursor into the big box.
They type their actual email in plain English, the way they'd say it out loud. Tab to
**Translate**. The native-sounding version appears. One click copies it. They paste it and
send it.

Under a minute, no thinking about prompts, no cursor-and-dropdown fumbling.

---

## What makes it good (the qualities to protect)

**Constrained is the feature, not the limitation.** Free-form prompt boxes make people freeze
and write bad prompts. A vocabulary that only offers valid, well-tested phrasings guarantees
every prompt that reaches the model is a good one. The constraint is what makes the output
reliable — do not "improve" it by loosening it.

**Flexible inside the constraint.** A rigid five-dropdown form would be equally reliable and
horrible to use. The grammar (slots → buckets → terms) is what buys expressiveness without
free text. Adding a new persona should mean adding rows, not writing code.

**Keyboard-native.** Every second the hand leaves the keyboard is a second the flow breaks.
Tab and Enter drive the whole app. This is a hard constraint, not a nice-to-have.

**Fast and quiet.** Two inputs, one button, one result. No sidebars, no history panel, no
settings gear in v1. The screen is the task.

**Beautiful in the dark.** Deep plum and magenta with a gold focus ring — the Midnight Moon
dahlia. The app should feel like a considered object, not an internal tool.

---

## What this is deliberately NOT

- Not a chat app. No conversation, no follow-ups, no message history in v1.
- Not Google Translate. It does not do literal word-for-word translation of arbitrary text —
  it does persona-driven rewriting into a target language.
- Not a prompt playground. The user never sees or edits raw prompt text.
- Not multi-turn or agentic. One system prompt + one body → one result.
- Not a team product. Single user, own account, own translations.

---

## Success looks like

1. A first-time user goes from the landing page to a copied translation in under 3 minutes,
   including checking their email.
2. A returning user does it in under 60 seconds.
3. Zero prompts reach the model that a human would call badly worded — because none can.
4. Adding a new persona role, artifact type or audience is a data change, not a deploy of
   new code.
5. A native speaker reading the output cannot tell it was machine-produced.

---

## Hard constraints (mirrored from CLAUDE.md §2 — the anti-drift list)

These are repeated here on purpose. If a proposed change breaks one of these, it is out of
scope regardless of how good the idea is.

- Prompt composer is constrained vocabulary only — no free typing.
- Ghost-text inline prediction, not a dropdown. (Language slot is the one exception.)
- Body box is free text.
- Two inputs, one action. No chat UI.
- MVP is English → one target language. Language-pair settings and saved prompts are v2.
- Full keyboard flow: compose → Tab/Enter → body → Tab → Translate.
- One LLM call per press. No agent loops.
- TypeScript + Zod + React + tRPC, pnpm monorepo (client / server / shared).
- MySQL on Railway via Drizzle.
- Magic link over Resend. No passwords, no OAuth.
- Tailwind with the Midnight Moon palette. One design system.
- LLM behind a single swappable adapter.

---

## The v2 parking lot (write ideas here; do not build them)

- Save and recall a composed prompt.
- Default from/to language in settings; non-English source languages.
- Translation history per user.
- Side-by-side original vs. translation with per-paragraph alignment.
- Tone slider (more formal ↔ more casual) as a post-pass.
- Admin UI for editing vocabulary buckets without touching YAML.
- Shareable read-only link to a translation.
