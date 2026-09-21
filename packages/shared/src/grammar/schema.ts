import { z } from "zod";

/**
 * One approved word/phrase in a bucket. `article` only makes sense on the
 * LANGUAGE bucket (CLAUDE.md §4.5) — carried as data so there is no
 * a/an inflection logic anywhere in the app.
 */
export const termSchema = z.object({
  value: z.string().min(1),
  display: z.string().min(1),
  article: z.enum(["a", "an"]).optional(),
});
export type Term = z.infer<typeof termSchema>;

export const bucketSchema = z.object({
  id: z.string().min(1),
  terms: z.array(termSchema).min(1),
});
export type Bucket = z.infer<typeof bucketSchema>;

/**
 * One fillable position in the template: the literal text before it, which
 * bucket supplies its terms, and whether committing a term in it should
 * render an article ahead of it (LANGUAGE only).
 */
export const slotSchema = z.object({
  id: z.string().min(1),
  bucketId: z.string().min(1),
  prefix: z.string(),
  suffix: z.string(),
  rendersArticle: z.boolean().default(false),
});
export type Slot = z.infer<typeof slotSchema>;

export const templateSchema = z.object({
  id: z.string().min(1),
  slots: z.array(slotSchema).min(1),
  trailingLiteral: z.string(),
});
export type Template = z.infer<typeof templateSchema>;

export const grammarSchema = z.object({
  template: templateSchema,
  buckets: z.array(bucketSchema).min(1),
});
export type Grammar = z.infer<typeof grammarSchema>;
