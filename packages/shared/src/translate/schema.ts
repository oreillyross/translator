import { z } from "zod";

/** Hard cap on the free-text body (5.3/5.8) — generous for an email/letter/speech. */
export const TRANSLATE_BODY_MAX_CHARS = 8000;

export const translateInputSchema = z.object({
  systemPrompt: z.string().min(1),
  language: z.string().min(1),
  body: z.string().min(1).max(TRANSLATE_BODY_MAX_CHARS),
});
export type TranslateInput = z.infer<typeof translateInputSchema>;

export const translateOutputSchema = z.object({
  translation: z.string(),
});
export type TranslateOutput = z.infer<typeof translateOutputSchema>;
