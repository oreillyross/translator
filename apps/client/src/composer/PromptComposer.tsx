import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import type { Grammar } from "@translator/shared";
import { renderCommitted } from "@translator/shared";
import { usePromptComposer } from "./usePromptComposer.js";
import { useMirrorWidth } from "./useMirrorWidth.js";

const SLOT_LABELS: Record<string, string> = {
  language: "language",
  role: "role",
  taskVerb: "task",
  artifact: "artifact",
  context: "context",
};

export interface PromptComposerProps {
  grammar: Grammar | undefined;
  /** Where Enter should move focus once the prompt is complete (4.9). */
  nextFieldRef: RefObject<HTMLElement>;
  /** Fired with the full composed system prompt whenever composition completes; `null` while incomplete. */
  onPromptChange?: (prompt: string | null) => void;
}

/**
 * The constrained prompt composer (Phase 4 / HC-1, HC-6): one real `<input>`
 * inline among rendered committed terms, non-editable literal "furniture",
 * and a grey ghost completion for the current slot only — never a dropdown.
 */
export function PromptComposer({ grammar, nextFieldRef, onPromptChange }: PromptComposerProps) {
  const composer = usePromptComposer(grammar);
  const { committedTerms, draftText, resolution, isComplete, setDraftText, accept, backtrack, clearDraft } = composer;
  const inputRef = useRef<HTMLInputElement>(null);
  const { mirrorRef, width } = useMirrorWidth(draftText);

  useEffect(() => {
    if (!onPromptChange) return;
    if (!grammar || !isComplete) {
      onPromptChange(null);
      return;
    }
    onPromptChange(renderCommitted(grammar, committedTerms) + grammar.template.trailingLiteral);
  }, [grammar, committedTerms, isComplete, onPromptChange]);

  // Completion swaps in a fresh (initially unfocused) hidden input so
  // Backspace-to-undo and Enter-to-advance still work immediately (4.7/4.9).
  useEffect(() => {
    if (isComplete) inputRef.current?.focus();
  }, [isComplete]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const atEnd = input.selectionStart === draftText.length && input.selectionEnd === draftText.length;

    if (event.key === "Tab" && !event.shiftKey && resolution.completion) {
      event.preventDefault();
      accept();
      return;
    }
    if (event.key === "ArrowRight" && atEnd && resolution.completion) {
      event.preventDefault();
      accept();
      return;
    }
    if (event.key === "Backspace" && draftText === "") {
      event.preventDefault();
      backtrack();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      clearDraft();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (isComplete) {
        nextFieldRef.current?.focus();
      }
    }
  }

  const ghost = resolution.completion ? resolution.completion.display.slice(draftText.length) : "";
  const currentSlotLabel = resolution.slot ? (SLOT_LABELS[resolution.slot.id] ?? resolution.slot.id) : null;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Prompt composer"
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-baseline gap-y-1 whitespace-pre-wrap break-words rounded-md border border-dm-plum bg-dm-shadow px-4 py-3 font-mono text-lg leading-relaxed text-dm-cream focus-within:ring-2 focus-within:ring-dm-gold"
      >
        {committedTerms.map(({ slotId, term }) => {
          const slot = grammar?.template.slots.find((s) => s.id === slotId);
          if (!slot) return null;
          const article = slot.rendersArticle && term.article ? `${term.article} ` : "";
          return (
            <span key={slotId}>
              <span className="text-dm-cream/50">{slot.prefix}</span>
              <span className="text-dm-cream">
                {article}
                {term.display}
              </span>
            </span>
          );
        })}

        {!isComplete && resolution.slot && (
          <>
            <span className="text-dm-cream/50">{resolution.slot.prefix}</span>
            <span className="relative inline-block" style={{ minWidth: width }}>
              <span ref={mirrorRef} aria-hidden className="invisible absolute whitespace-pre">
                {draftText || " "}
              </span>
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width }}
                className="bg-transparent align-baseline text-dm-cream caret-dm-cream outline-none"
                aria-label={currentSlotLabel ? `Compose the ${currentSlotLabel}` : "Compose prompt"}
                aria-describedby="composer-help"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </span>
            <span aria-hidden className="pointer-events-none whitespace-pre text-dm-blush/60">
              {ghost}
            </span>
          </>
        )}

        {isComplete && (
          <>
            <span className="text-dm-cream/50">{grammar?.template.trailingLiteral}</span>
            {/* Kept mounted (not typed into) so Backspace can still undo the last term and Enter still moves focus onward. */}
            <input
              ref={inputRef}
              type="text"
              value=""
              readOnly
              onKeyDown={handleKeyDown}
              className="sr-only h-0 w-0"
              aria-hidden
              tabIndex={-1}
            />
          </>
        )}
      </div>

      <div id="composer-help" className="text-xs text-dm-cream/50">
        Tab accepts the greyed suggestion · Backspace undoes the last word · Esc clears what you've typed.
      </div>

      <div aria-live="polite" className="sr-only">
        {isComplete
          ? "Prompt complete."
          : resolution.completion
            ? `Suggesting ${resolution.completion.display}`
            : "No matching term."}
      </div>

      {isComplete && (
        <div className="flex items-center gap-2 text-sm text-dm-leaf">
          <span aria-hidden>✓</span>
          <span>Prompt complete — press Enter to continue.</span>
        </div>
      )}
    </div>
  );
}
