import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import defaultAvatar from "@/assets/pews-avatar.jpg";

export const Route = createFileRoute("/leaderboard")({
  loader: async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, view_count, is_verified, is_premium")
      .eq("is_banned", false)
      .order("view_count", { ascending: false })
      .limit(25);
    return { rows: data ?? [] };
  },
  head: () => ({
    meta: [
      { title: "leaderboard — pews" },
      { name: "description", content: "the most-viewed pews.lol profiles." },
      { property: "og:title", content: "leaderboard — pews" },
      { property: "og:description", content: "the most-viewed pews.lol profiles." },
    ],
  }),
  component: Leaderboard,
});

import { Header } from "@/components/pews/Header";

function Leaderboard() {
  const { rows } = Route.useLoaderData();

  return (
    <main className="relative min-h-screen overflow-x-hidden font-sans pb-20">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />
      <Header />
      <section className="mx-auto max-w-lg px-4 pt-24">
        <h1 className="font-display text-3xl font-bold">leaderboard</h1>
        <div className="mt-1 text-sm text-muted-foreground">the most-viewed pews.lol profiles</div>

        <div className="mt-8 space-y-2">
          {rows.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              nobody's picked up any views yet — could be you!
            </div>
          )}
          {rows.map((r, i) => (
            <Link key={r.username} to="/u/$username" params={{ username: r.username }}
              className="hud-corners flex items-center gap-3 rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4 transition duration-300 hover:border-primary/40 hover:-translate-y-0.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background/50 font-mono text-sm font-bold text-muted-foreground">
                {i + 1}
              </div>
              <img src={r.avatar_url || defaultAvatar} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {r.display_name || r.username}
                  {r.is_verified && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 flex-shrink-0 text-primary"><path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5L12 2z"/></svg>
                  )}
                  {r.is_premium && (
                    <svg viewBox="0 0 24 24" fill="#FFD700" className="h-3.5 w-3.5 flex-shrink-0"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">@{r.username}</div>
              </div>
              <div className="flex-shrink-0 font-mono text-sm text-muted-foreground">{r.view_count.toLocaleString()} views</div>
            </Link>
          ))}
        </div>

        <Link to="/" className="mt-8 inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
          ← back home
        </Link>
      </section>
    </main>
  );
}
