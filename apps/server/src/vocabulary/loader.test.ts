import { describe, expect, it } from "vitest";
import type { Grammar } from "@translator/shared";
import { loadVocabulary } from "./loader.js";

function findTerm(grammar: Grammar, bucketId: string, value: string) {
  const bucket = grammar.buckets.find((b) => b.id === bucketId);
  if (!bucket) throw new Error(`No bucket "${bucketId}"`);
  const term = bucket.terms.find((t) => t.value === value);
  if (!term) throw new Error(`No term "${value}" in bucket "${bucketId}"`);
  return term;
}

/** Renders the template with one chosen term per slot — the grammar's acceptance check. */
function renderPrompt(
  grammar: Grammar,
  selections: { language: string; role: string; taskVerb: string; artifact: string; context: string },
) {
  const language = findTerm(grammar, "languages", selections.language);
  const role = findTerm(grammar, "roles", selections.role);
  const taskVerb = findTerm(grammar, "taskVerbs", selections.taskVerb);
  const artifact = findTerm(grammar, "artifacts", selections.artifact);
  const context = findTerm(grammar, "contexts", selections.context);

  const slots = grammar.template.slots;
  const languageSlot = slots.find((s) => s.id === "language")!;
  const roleSlot = slots.find((s) => s.id === "role")!;
  const taskVerbSlot = slots.find((s) => s.id === "taskVerb")!;
  const artifactSlot = slots.find((s) => s.id === "artifact")!;
  const contextSlot = slots.find((s) => s.id === "context")!;

  const article = languageSlot.rendersArticle && language.article ? `${language.article} ` : "";

  return (
    languageSlot.prefix +
    article +
    language.display +
    roleSlot.prefix +
    role.display +
    taskVerbSlot.prefix +
    taskVerb.display +
    artifactSlot.prefix +
    artifact.display +
    contextSlot.prefix +
    context.display +
    grammar.template.trailingLiteral
  );
}

describe("vocabulary loader", () => {
  it("parses every YAML file and cross-checks slot bucket references", () => {
    const grammar = loadVocabulary();
    expect(grammar.buckets.length).toBe(5);
    expect(grammar.template.slots.length).toBe(5);
  });

  // 2.8 — the four scratchpad example prompts must each decompose into a
  // valid path through the grammar. This test does not get deleted.
  it.each([
    {
      selections: { language: "dutch", role: "teacher", taskVerb: "help", artifact: "email", context: "to_my_college_professor" },
      expected: "You are a Dutch teacher. Help me to write an email to my college professor.",
    },
    {
      selections: {
        language: "french",
        role: "businessman",
        taskVerb: "advise",
        artifact: "informal_letter",
        context: "to_the_business_administration",
      },
      expected: "You are a French businessman. Advise me to write an informal letter to the business administration.",
    },
    {
      selections: {
        language: "german",
        role: "friend",
        taskVerb: "help",
        artifact: "speech",
        context: "for_my_friends_birthday_party",
      },
      expected: "You are a German friend. Help me to write a speech for my friend's birthday party.",
    },
    {
      selections: {
        language: "italian",
        role: "real_estate_agent",
        taskVerb: "help",
        artifact: "motivation_letter",
        context: "to_buy_the_house",
      },
      expected: "You are an Italian real estate agent. Help me to write a motivation letter to buy the house.",
    },
  ])("decomposes scratchpad example: $expected", ({ selections, expected }) => {
    const grammar = loadVocabulary();
    expect(renderPrompt(grammar, selections)).toBe(expected);
  });

  // 2.9 — every language term has an article, correct for vowel-initial languages.
  it("gives every language term an article, correct for vowel-initial languages", () => {
    const grammar = loadVocabulary();
    const languages = grammar.buckets.find((b) => b.id === "languages")!;
    for (const term of languages.terms) {
      expect(term.article, `${term.display} is missing an article`).toBeDefined();
    }

    const vowelInitial = ["Italian", "Irish", "Icelandic", "English", "Arabic"];
    for (const display of vowelInitial) {
      const term = languages.terms.find((t) => t.display === display);
      expect(term, `${display} not found in seeded languages`).toBeDefined();
      expect(term!.article).toBe("an");
    }

    const consonantInitial = ["Dutch", "French", "German"];
    for (const display of consonantInitial) {
      const term = languages.terms.find((t) => t.display === display);
      expect(term!.article).toBe("a");
    }
  });
});
