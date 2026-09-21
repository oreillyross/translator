import { trpc } from "./trpc.js";

export function App() {
  const ping = trpc.health.ping.useQuery({});

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dm-ink p-8 text-dm-cream">
      <h1 className="text-3xl font-semibold text-dm-blush">Translator</h1>
      <p className="rounded-md border border-dm-plum bg-dm-shadow px-4 py-2 text-sm">
        {ping.isLoading && "Checking server..."}
        {ping.isError && <span className="text-dm-magenta">Server unreachable</span>}
        {ping.data && (
          <span>
            Server says <span className="text-dm-leaf">{ping.data.status}</span> at{" "}
            {ping.data.timestamp}
          </span>
        )}
      </p>
    </main>
  );
}
