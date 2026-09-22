import type { Bucket, Grammar, Slot, Term } from "./schema.js";

/** One slot the user has already filled, in template order. */
export interface CommittedTerm {
  slotId: string;
  term: Term;
}

/**
 * Everything the ghost-text input needs to render and validate the current
 * keystroke: which slot is live, what it could still become, and the single
 * best completion for it. `slot`/`bucket` are `null` once every slot is
 * committed (4.1).
 */
export interface GrammarResolution {
  slot: Slot | null;
  bucket: Bucket | null;
  /** Terms in the current slot's bucket whose display starts with `draftText`, alphabetical. */
  candidates: Term[];
  /** The candidate the ghost text completes to — the first, alphabetically. `null` if none match. */
  completion: Term | null;
  isComplete: boolean;
}

const EMPTY_RESOLUTION: GrammarResolution = {
  slot: null,
  bucket: null,
  candidates: [],
  completion: null,
  isComplete: true,
};

function findBucket(grammar: Grammar, bucketId: string): Bucket {
  const bucket = grammar.buckets.find((b) => b.id === bucketId);
  if (!bucket) {
    throw new Error(`Grammar is missing bucket "${bucketId}" referenced by the template.`);
  }
  return bucket;
}

/**
 * Given what's committed and what's half-typed, resolves the current slot,
 * its matching candidate terms, and the single best completion — for that
 * slot only (HC-6). Pure, no React, safe to call on every keystroke.
 */
export function resolveGrammar(
  grammar: Grammar,
  committedTerms: CommittedTerm[],
  draftText: string,
): GrammarResolution {
  const slot = grammar.template.slots[committedTerms.length];
  if (!slot) {
    return EMPTY_RESOLUTION;
  }

  const bucket = findBucket(grammar, slot.bucketId);
  const normalizedDraft = draftText.toLowerCase();
  const candidates = bucket.terms
    .filter((term) => term.display.toLowerCase().startsWith(normalizedDraft))
    .sort((a, b) => a.display.localeCompare(b.display));

  return {
    slot,
    bucket,
    candidates,
    completion: candidates[0] ?? null,
    isComplete: false,
  };
}

/** Whether `draftText` could still lead to a valid term in the current slot (HC-1 / 4.8). */
export function isValidDraft(grammar: Grammar, committedTerms: CommittedTerm[], draftText: string): boolean {
  return resolveGrammar(grammar, committedTerms, draftText).candidates.length > 0;
}

/**
 * Renders the committed prefix of the prompt: each slot's literal prefix,
 * its article (LANGUAGE only, data-driven per HC-1/4.6, no inflection
 * logic), and the committed term's display text. Stops at the last
 * committed slot — the trailing literal is only appended once `isComplete`.
 */
export function renderCommitted(grammar: Grammar, committedTerms: CommittedTerm[]): string {
  return committedTerms
    .map(({ slotId, term }) => {
      const slot = grammar.template.slots.find((s) => s.id === slotId);
      if (!slot) {
        throw new Error(`Grammar has no slot "${slotId}" for a committed term.`);
      }
      const article = slot.rendersArticle && term.article ? `${term.article} ` : "";
      return `${slot.prefix}${article}${term.display}`;
    })
    .join("");
}
