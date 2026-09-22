import { useState, type FormEvent } from "react";
import { trpc } from "../trpc.js";

export function Landing() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const requestLink = trpc.auth.requestLink.useMutation({
    onSuccess: () => setSentTo(email.trim()),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    requestLink.mutate({ email: trimmed });
  }

  if (sentTo) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dm-ink p-8 text-dm-cream">
        <h1 className="text-3xl font-semibold text-dm-blush">Check your inbox</h1>
        <p className="max-w-sm text-center text-sm text-dm-cream/80">
          If <span className="text-dm-cream">{sentTo}</span> can sign in, a link is on its way.
          It expires in 15 minutes and works once.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dm-ink p-8 text-dm-cream">
      <h1 className="text-3xl font-semibold text-dm-blush">Translator</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <label htmlFor="email" className="text-sm text-dm-cream/80">
          Sign in with your email
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-md border border-dm-plum bg-dm-shadow px-4 py-2 text-dm-cream outline-none focus:ring-2 focus:ring-dm-gold"
        />
        <button
          type="submit"
          disabled={requestLink.isPending}
          className="rounded-md bg-dm-magenta px-4 py-2 font-semibold text-dm-cream transition hover:bg-dm-fuchsia focus:outline-none focus:ring-2 focus:ring-dm-gold disabled:opacity-60"
        >
          {requestLink.isPending ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
    </main>
  );
}
