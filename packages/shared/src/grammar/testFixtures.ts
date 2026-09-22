import type { Grammar } from "./schema.js";

/**
 * A small grammar fixture shaped exactly like the seeded production
 * vocabulary (same template, same slot ids) — big enough to cover every
 * scratchpad example plus a couple of prefix-ambiguity cases ("ar" ->
 * Arabic/Armenian), small enough to keep test output readable. Shared by
 * this package's own `resolveGrammar` tests and apps/client's
 * `PromptComposer` tests so neither hand-duplicates the same fixture.
 */
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
