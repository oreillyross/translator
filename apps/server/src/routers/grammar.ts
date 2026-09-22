import { grammarSchema } from "@translator/shared";
import { publicProcedure, router } from "../trpc.js";
import { loadVocabulary } from "../vocabulary/loader.js";

// Parsed once at module load (index.ts already calls loadVocabulary() at
// boot to fail fast on bad YAML — this reuses that cost, not repeats it per
// request). Held in memory and served as-is; resolution happens client-side
// (HC-20, 4.11) so no further request ever touches the vocabulary files.
const grammar = loadVocabulary();

export const grammarRouter = router({
  get: publicProcedure.output(grammarSchema).query(() => grammar),
});
