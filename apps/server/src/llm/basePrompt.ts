/**
 * Composed server-side only (5.2) — the grammar-built prompt never carries
 * the target-language instruction itself (CLAUDE.md §4.5: "No trailing 'in
 * {language}'"), so it's appended here where it can't be tampered with or
 * omitted by the client.
 */
export function buildSystemPrompt(composedPrompt: string, language: string): string {
  return `${composedPrompt}\n\nWrite your response entirely in ${language}.`;
}
