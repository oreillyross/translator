import { describe, expect, it } from "vitest";
import type { Term } from "./schema.js";
import { type CommittedTerm, renderCommitted, resolveGrammar } from "./resolve.js";
import { sampleGrammar as grammar, scratchpadExamples } from "./testFixtures.js";

function term(bucketId: string, value: string): Term {
  const bucket = grammar.buckets.find((b) => b.id === bucketId);
  const found = bucket?.terms.find((t) => t.value === value);
  if (!found) throw new Error(`fixture missing ${bucketId}/${value}`);
  return found;
}

function commit(...entries: Array<[string, string]>): CommittedTerm[] {
  return entries.map(([slotId, value]) => ({ slotId, term: term(slotId === "language" ? "languages" : `${slotId}s`, value) }));
}

/** Commits every slot of a scratchpad example, in template order. */
function commitExample({ language, role, taskVerb, artifact, context }: (typeof scratchpadExamples)[number]): CommittedTerm[] {
  return commit(["language", language], ["role", role], ["taskVerb", taskVerb], ["artifact", artifact], ["context", context]);
}

describe("resolveGrammar", () => {
  it.each(scratchpadExamples)("decomposes scratchpad example: $name", (example) => {
    const committed = commitExample(example);
    // After committing every slot the resolution reports completion and the
    // rendered text plus the trailing literal matches the example verbatim.
    const resolution = resolveGrammar(grammar, committed, "");
    expect(resolution.isComplete).toBe(true);
    expect(resolution.slot).toBeNull();
    expect(renderCommitted(grammar, committed) + grammar.template.trailingLiteral).toBe(example.expected);
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
    const committed = commitExample(scratchpadExamples[0]!);
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
