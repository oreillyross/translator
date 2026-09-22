import { useCallback, useMemo, useState } from "react";
import { type CommittedTerm, type Grammar, type GrammarResolution, resolveGrammar } from "@translator/shared";

const LOADING_RESOLUTION: GrammarResolution = {
  slot: null,
  bucket: null,
  candidates: [],
  completion: null,
  isComplete: false,
};

export interface PromptComposer {
  committedTerms: CommittedTerm[];
  draftText: string;
  resolution: GrammarResolution;
  isComplete: boolean;
  setDraftText: (next: string) => void;
  /** Commits the current best completion and advances to the next slot (4.7). */
  accept: () => void;
  /** Un-commits the previous term, e.g. Backspace at slot start (4.7). */
  backtrack: () => void;
  /** Clears the draft only, e.g. Escape (4.7). */
  clearDraft: () => void;
  reset: () => void;
}

/**
 * Owns the composer's state — committed terms and the in-progress draft —
 * and drives it through the pure `resolveGrammar` (4.1). No DOM/positioning
 * concerns live here; that's `PromptComposer.tsx`'s job.
 */
export function usePromptComposer(grammar: Grammar | undefined): PromptComposer {
  const [committedTerms, setCommittedTerms] = useState<CommittedTerm[]>([]);
  const [draftText, setDraftTextState] = useState("");

  const resolution = useMemo(
    () => (grammar ? resolveGrammar(grammar, committedTerms, draftText) : LOADING_RESOLUTION),
    [grammar, committedTerms, draftText],
  );

  const setDraftText = useCallback(
    (next: string) => {
      if (!grammar) return;
      // HC-1 / 4.8: the box physically cannot hold text that can't lead to a
      // valid term — reject any keystroke whose resulting prefix matches
      // nothing in the current slot's bucket. An empty draft is always fine.
      if (next !== "" && resolveGrammar(grammar, committedTerms, next).candidates.length === 0) {
        return;
      }
      setDraftTextState(next);
    },
    [grammar, committedTerms],
  );

  const accept = useCallback(() => {
    if (!resolution.slot || !resolution.completion) return;
    const { slot, completion } = resolution;
    setCommittedTerms((prev) => [...prev, { slotId: slot.id, term: completion }]);
    setDraftTextState("");
  }, [resolution]);

  const backtrack = useCallback(() => {
    setCommittedTerms((prev) => prev.slice(0, -1));
    setDraftTextState("");
  }, []);

  const clearDraft = useCallback(() => setDraftTextState(""), []);

  const reset = useCallback(() => {
    setCommittedTerms([]);
    setDraftTextState("");
  }, []);

  return {
    committedTerms,
    draftText,
    resolution,
    isComplete: resolution.isComplete,
    setDraftText,
    accept,
    backtrack,
    clearDraft,
    reset,
  };
}
