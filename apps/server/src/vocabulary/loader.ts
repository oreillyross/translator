import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { bucketSchema, grammarSchema, templateSchema, type Grammar } from "@translator/shared";

const vocabularyDir = dirname(fileURLToPath(import.meta.url));

const bucketFiles = ["languages.yml", "roles.yml", "taskVerbs.yml", "artifacts.yml", "contexts.yml"];
const templateFile = "template.yml";

function readYaml(fileName: string): unknown {
  const raw = readFileSync(join(vocabularyDir, fileName), "utf8");
  return parseYaml(raw);
}

/**
 * Parses every vocabulary YAML file through the shared Zod schemas and
 * cross-checks slot -> bucket references. Fails fast and loud (HC-15/2.6)
 * with a readable error naming the offending file instead of a raw Zod
 * stack trace.
 */
export function loadVocabulary(): Grammar {
  const buckets = bucketFiles.map((fileName) => {
    const parsed = bucketSchema.safeParse(readYaml(fileName));
    if (!parsed.success) {
      throw new Error(`Invalid vocabulary file "${fileName}":\n${parsed.error.toString()}`);
    }
    return parsed.data;
  });

  const templateParsed = templateSchema.safeParse(readYaml(templateFile));
  if (!templateParsed.success) {
    throw new Error(`Invalid vocabulary file "${templateFile}":\n${templateParsed.error.toString()}`);
  }
  const template = templateParsed.data;

  const bucketIds = new Set(buckets.map((bucket) => bucket.id));
  for (const slot of template.slots) {
    if (!bucketIds.has(slot.bucketId)) {
      throw new Error(
        `Invalid vocabulary: template slot "${slot.id}" references unknown bucket "${slot.bucketId}".`,
      );
    }
  }

  const grammarParsed = grammarSchema.safeParse({ template, buckets });
  if (!grammarParsed.success) {
    throw new Error(`Invalid vocabulary grammar:\n${grammarParsed.error.toString()}`);
  }
  return grammarParsed.data;
}
