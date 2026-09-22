import { useRef, useState } from "react";
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
  const [, setSystemPrompt] = useState<string | null>(null);

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
        <PromptComposer grammar={grammar.data} nextFieldRef={bodyRef} onPromptChange={setSystemPrompt} />

        <textarea
          ref={bodyRef}
          placeholder="Write what you want translated…"
          rows={6}
          className="w-full resize-y rounded-md border border-dm-plum bg-dm-shadow px-4 py-3 text-dm-cream outline-none focus:ring-2 focus:ring-dm-gold"
        />
      </div>
    </main>
  );
}
