import { trpc } from "./trpc.js";
import { Landing } from "./pages/Landing.js";

export function App() {
  const utils = trpc.useUtils();
  const session = trpc.auth.session.useQuery();
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => utils.auth.session.invalidate(),
  });

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dm-ink p-8 text-dm-cream">
      <div className="flex w-full max-w-lg items-center justify-between">
        <h1 className="text-3xl font-semibold text-dm-blush">Translator</h1>
        <button
          onClick={() => signOut.mutate()}
          className="rounded-md border border-dm-plum px-3 py-1.5 text-sm text-dm-cream/80 transition hover:text-dm-cream focus:outline-none focus:ring-2 focus:ring-dm-gold"
        >
          Sign out
        </button>
      </div>
      <p className="rounded-md border border-dm-plum bg-dm-shadow px-4 py-2 text-sm">
        Signed in as <span className="text-dm-leaf">{session.data.email}</span>. The composer
        arrives in Phase 4.
      </p>
    </main>
  );
}
