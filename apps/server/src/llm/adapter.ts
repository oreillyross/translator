import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";

const REQUEST_TIMEOUT_MS = 30_000;

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: REQUEST_TIMEOUT_MS });

export interface TranslateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * The one LLM call per Translate press (HC-7), behind one adapter (HC-16).
 * Deliberately sends no `thinking` and no `effort` — those differ in shape
 * between model tiers, and omitting them is what keeps a model swap a
 * one-variable (`ANTHROPIC_MODEL`) change rather than a code change.
 */
export async function translate(systemPrompt: string, body: string): Promise<TranslateResult> {
  const response = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: body }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
