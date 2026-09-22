import type { Grammar } from "./schema.js";

/**
 * A small grammar fixture shaped exactly like the seeded production
 * vocabulary (same template, same slot ids) — big enough to cover every
 * scratchpad example plus a couple of prefix-ambiguity cases ("ar" ->
 * Arabic/Armenian), small enough to keep test output readable. Shared by
 * this package's own `resolveGrammar` tests and apps/client's
 * `PromptComposer` tests so neither hand-duplicates the same fixture.
 */
/**
 * The four scratchpad example prompts (CLAUDE.md §4.5's acceptance test),
 * as one selection per slot plus the fully rendered prompt they must
 * decompose into. Shared between apps/server's loader test (grammar loaded
 * from the real seeded YAML) and this package's resolveGrammar test (a
 * small fixture grammar) so the same acceptance data isn't hand-duplicated
 * at both layers.
 */
export interface ScratchpadExample {
  name: string;
  language: string;
  role: string;
  taskVerb: string;
  artifact: string;
  context: string;
  expected: string;
}

export const scratchpadExamples: ScratchpadExample[] = [
  {
    name: "Dutch teacher / email / college professor",
    language: "dutch",
    role: "teacher",
    taskVerb: "help",
    artifact: "email",
    context: "to_my_college_professor",
    expected: "You are a Dutch teacher. Help me to write an email to my college professor.",
  },
  {
    name: "French businessman / informal letter / business administration",
    language: "french",
    role: "businessman",
    taskVerb: "advise",
    artifact: "informal_letter",
    context: "to_the_business_administration",
    expected: "You are a French businessman. Advise me to write an informal letter to the business administration.",
  },
  {
    name: "German friend / speech / birthday party",
    language: "german",
    role: "friend",
    taskVerb: "help",
    artifact: "speech",
    context: "for_my_friends_birthday_party",
    expected: "You are a German friend. Help me to write a speech for my friend's birthday party.",
  },
  {
    name: "Italian real estate agent / motivation letter / buy the house",
    language: "italian",
    role: "real_estate_agent",
    taskVerb: "help",
    artifact: "motivation_letter",
    context: "to_buy_the_house",
    expected: "You are an Italian real estate agent. Help me to write a motivation letter to buy the house.",
  },
];

export const sampleGrammar: Grammar = {
  template: {
    id: "v1-template",
    trailingLiteral: ".",
    slots: [
      { id: "language", bucketId: "languages", prefix: "You are ", suffix: "", rendersArticle: true },
      { id: "role", bucketId: "roles", prefix: " ", suffix: "", rendersArticle: false },
      { id: "taskVerb", bucketId: "taskVerbs", prefix: ". ", suffix: "", rendersArticle: false },
      { id: "artifact", bucketId: "artifacts", prefix: " me to write ", suffix: "", rendersArticle: false },
      { id: "context", bucketId: "contexts", prefix: " ", suffix: "", rendersArticle: false },
    ],
  },
  buckets: [
    {
      id: "languages",
      terms: [
        { value: "arabic", display: "Arabic", article: "an" },
        { value: "armenian", display: "Armenian", article: "an" },
        { value: "dutch", display: "Dutch", article: "a" },
        { value: "french", display: "French", article: "a" },
        { value: "german", display: "German", article: "a" },
        { value: "italian", display: "Italian", article: "an" },
      ],
    },
    {
      id: "roles",
      terms: [
        { value: "businessman", display: "businessman" },
        { value: "friend", display: "friend" },
        { value: "real_estate_agent", display: "real estate agent" },
        { value: "teacher", display: "teacher" },
      ],
    },
    {
      id: "taskVerbs",
      terms: [
        { value: "advise", display: "Advise" },
        { value: "help", display: "Help" },
      ],
    },
    {
      id: "artifacts",
      terms: [
        { value: "email", display: "an email" },
        { value: "informal_letter", display: "an informal letter" },
        { value: "motivation_letter", display: "a motivation letter" },
        { value: "speech", display: "a speech" },
      ],
    },
    {
      id: "contexts",
      terms: [
        { value: "for_my_friends_birthday_party", display: "for my friend's birthday party" },
        { value: "to_buy_the_house", display: "to buy the house" },
        { value: "to_my_college_professor", display: "to my college professor" },
        { value: "to_the_business_administration", display: "to the business administration" },
      ],
    },
  ],
};
