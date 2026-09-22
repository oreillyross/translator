import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { translateInputSchema, translateOutputSchema } from "@translator/shared";
import { protectedProcedure, router } from "../trpc.js";
import { translate } from "../llm/adapter.js";
import { buildSystemPrompt } from "../llm/basePrompt.js";
import { checkTranslateRateLimit } from "../llm/rateLimit.js";

export const translateRouter = router({
  /**
   * One LLM call per press (HC-7), protected (auth required), Zod in/out.
   * The body text is never logged (5.9) — only latency, token counts and
   * whether the call succeeded.
   */
  run: protectedProcedure
    .input(translateInputSchema)
    .output(translateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      if (!checkTranslateRateLimit(ctx.session.userId)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many translations. Try again shortly." });
      }

      const systemPrompt = buildSystemPrompt(input.systemPrompt, input.language);
      const startedAt = Date.now();

      try {
        const result = await translate(systemPrompt, input.body);
        ctx.logError(
          null,
          `translate.run ok in ${Date.now() - startedAt}ms, in=${result.inputTokens} out=${result.outputTokens}`,
        );
        return { translation: result.text };
      } catch (err) {
        ctx.logError(err, `translate.run failed after ${Date.now() - startedAt}ms`);
        if (err instanceof Anthropic.APIConnectionTimeoutError) {
          throw new TRPCError({ code: "TIMEOUT", message: "Translation took too long. Try again." });
        }
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Translation failed. Try again." });
      }
    }),
});
