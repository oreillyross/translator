import { useRef, useState, type KeyboardEvent } from "react";
import { TRANSLATE_BODY_MAX_CHARS } from "@translator/shared";
import { trpc } from "./trpc.js";
import { Landing } from "./pages/Landing.js";
import { PromptComposer } from "./composer/PromptComposer.js";

export function App() {
  const utils = trpc.useUtils();
  const session = trpc.auth.session.useQuery();
  const grammar = trpc.grammar.get.useQuery();
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => utils.auth.session.invalidate(),
  });
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const translateButtonRef = useRef<HTMLButtonElement>(null);
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const translate = trpc.translate.run.useMutation();

  function handleTranslate() {
    if (!systemPrompt || !language || !body.trim()) return;
    setCopied(false);
    translate.mutate({ systemPrompt, language, body });
  }

  function handleBodyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      translateButtonRef.current?.focus();
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleTranslate();
    }
  }

  async function handleCopy() {
    if (!translate.data) return;
    await navigator.clipboard.writeText(translate.data.translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canTranslate = Boolean(systemPrompt && language && body.trim()) && !translate.isPending;

  if (session.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-dm-ink text-dm-cream">
        <p>Loading…</p>
      </main>
    );
  }

  if (!session.data) {
    return <Landing />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-dm-ink p-8 text-dm-cream">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-3xl font-semibold text-dm-blush">Translator</h1>
        <button
          onClick={() => signOut.mutate()}
          className="rounded-md border border-dm-plum px-3 py-1.5 text-sm text-dm-cream/80 transition hover:text-dm-cream focus:outline-none focus:ring-2 focus:ring-dm-gold"
        >
          Sign out
        </button>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-6">
        <PromptComposer
          grammar={grammar.data}
          nextFieldRef={bodyRef}
          onPromptChange={(prompt, lang) => {
            setSystemPrompt(prompt);
            setLanguage(lang);
          }}
        />

        <div className="flex flex-col gap-1">
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, TRANSLATE_BODY_MAX_CHARS))}
            onKeyDown={handleBodyKeyDown}
            placeholder="Write what you want translated…"
            rows={6}
            maxLength={TRANSLATE_BODY_MAX_CHARS}
            className="w-full resize-y rounded-md border border-dm-plum bg-dm-shadow px-4 py-3 text-dm-cream outline-none focus:ring-2 focus:ring-dm-gold"
          />
          <span className="self-end text-xs text-dm-cream/50">
            {body.length} / {TRANSLATE_BODY_MAX_CHARS}
          </span>
        </div>

        <button
          ref={translateButtonRef}
          onClick={handleTranslate}
          disabled={!canTranslate}
          className="w-full rounded-md bg-dm-magenta px-4 py-2.5 font-semibold text-dm-cream transition hover:bg-dm-fuchsia focus:outline-none focus:ring-2 focus:ring-dm-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translate.isPending ? "Translating…" : "Translate"}
        </button>

        {translate.isPending && (
          <p role="status" className="text-sm text-dm-cream/70">
            Translating…
          </p>
        )}

        {translate.isError && (
          <p role="alert" className="text-sm text-red-400">
            {translate.error.message || "Translation failed. Try again."}
          </p>
        )}

        {translate.data && (
          <div className="flex flex-col gap-2 rounded-md border border-dm-plum bg-dm-shadow p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-dm-blush">Translation</h2>
              <button
                onClick={handleCopy}
                className={`rounded-md border border-dm-plum px-2.5 py-1 text-xs transition hover:text-dm-cream focus:outline-none focus:ring-2 focus:ring-dm-gold ${
                  copied ? "text-dm-leaf" : "text-dm-cream/80"
                }`}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p className="whitespace-pre-wrap text-dm-cream">{translate.data.translation}</p>
          </div>
        )}
      </div>
    </main>
  );
}
