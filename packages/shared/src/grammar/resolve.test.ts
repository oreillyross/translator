import { describe, expect, it } from "vitest";
import type { Term } from "./schema.js";
import { type CommittedTerm, renderCommitted, resolveGrammar } from "./resolve.js";
import { sampleGrammar as grammar } from "./testFixtures.js";

function term(bucketId: string, value: string): Term {
  const bucket = grammar.buckets.find((b) => b.id === bucketId);
  const found = bucket?.terms.find((t) => t.value === value);
  if (!found) throw new Error(`fixture missing ${bucketId}/${value}`);
  return found;
}

function commit(...entries: Array<[string, string]>): CommittedTerm[] {
  return entries.map(([slotId, value]) => ({ slotId, term: term(slotId === "language" ? "languages" : `${slotId}s`, value) }));
}

describe("resolveGrammar", () => {
  it.each([
    {
      name: "Dutch teacher / email / college professor",
      selections: [
        ["language", "dutch"],
        ["role", "teacher"],
        ["taskVerb", "help"],
        ["artifact", "email"],
        ["context", "to_my_college_professor"],
      ] as Array<[string, string]>,
      expected: "You are a Dutch teacher. Help me to write an email to my college professor.",
    },
    {
      name: "French businessman / informal letter / business administration",
      selections: [
        ["language", "french"],
        ["role", "businessman"],
        ["taskVerb", "advise"],
        ["artifact", "informal_letter"],
        ["context", "to_the_business_administration"],
      ] as Array<[string, string]>,
      expected: "You are a French businessman. Advise me to write an informal letter to the business administration.",
    },
    {
      name: "German friend / speech / birthday party",
      selections: [
        ["language", "german"],
        ["role", "friend"],
        ["taskVerb", "help"],
        ["artifact", "speech"],
        ["context", "for_my_friends_birthday_party"],
      ] as Array<[string, string]>,
      expected: "You are a German friend. Help me to write a speech for my friend's birthday party.",
    },
    {
      name: "Italian real estate agent / motivation letter / buy the house",
      selections: [
        ["language", "italian"],
        ["role", "real_estate_agent"],
        ["taskVerb", "help"],
        ["artifact", "motivation_letter"],
        ["context", "to_buy_the_house"],
      ] as Array<[string, string]>,
      expected: "You are an Italian real estate agent. Help me to write a motivation letter to buy the house.",
    },
  ])("decomposes scratchpad example: $name", ({ selections, expected }) => {
    const committed = commit(...selections);
    // After committing every slot the resolution reports completion and the
    // rendered text plus the trailing literal matches the example verbatim.
    const resolution = resolveGrammar(grammar, committed, "");
    expect(resolution.isComplete).toBe(true);
    expect(resolution.slot).toBeNull();
    expect(renderCommitted(grammar, committed) + grammar.template.trailingLiteral).toBe(expected);
  });

  it("narrows to a single unambiguous candidate on an unambiguous prefix", () => {
    const resolution = resolveGrammar(grammar, [], "du");
    expect(resolution.candidates.map((t) => t.value)).toEqual(["dutch"]);
    expect(resolution.completion?.value).toBe("dutch");
  });

  it("returns every match on an ambiguous prefix, completing to the alphabetically first", () => {
    const resolution = resolveGrammar(grammar, [], "ar");
    expect(resolution.candidates.map((t) => t.value)).toEqual(["arabic", "armenian"]);
    expect(resolution.completion?.value).toBe("arabic");
  });

  it("returns no candidates and no completion when nothing matches", () => {
    const resolution = resolveGrammar(grammar, [], "xyz");
    expect(resolution.candidates).toEqual([]);
    expect(resolution.completion).toBeNull();
  });

  it("resolves to the next slot after a term is committed", () => {
    const committed = commit(["language", "dutch"]);
    const resolution = resolveGrammar(grammar, committed, "");
    expect(resolution.slot?.id).toBe("role");
    expect(resolution.bucket?.id).toBe("roles");
  });

  it("reports completion once every slot is committed (end-of-template)", () => {
    const committed = commit(
      ["language", "dutch"],
      ["role", "teacher"],
      ["taskVerb", "help"],
      ["artifact", "email"],
      ["context", "to_my_college_professor"],
    );
    const resolution = resolveGrammar(grammar, committed, "");
    expect(resolution.isComplete).toBe(true);
    expect(resolution.slot).toBeNull();
    expect(resolution.bucket).toBeNull();
    expect(resolution.candidates).toEqual([]);
  });

  it("renders the article ahead of the language term and no article for other slots", () => {
    const committed = commit(["language", "italian"], ["role", "real_estate_agent"]);
    expect(renderCommitted(grammar, committed)).toBe("You are an Italian real estate agent");
  });
});
