import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Header } from "@/components/pews/Header";

const ADMIN_USERNAME = "x7wv";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "admin — pews" }, { name: "robots", content: "noindex" }] }),
  component: AdminPanel,
});

type Row = {
  id: string;
  username: string;
  display_name: string | null;
  view_count: number;
  created_at: string;
};

function AdminPanel() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState({ users: 0, views: 0, clicks: 0, links: 0 });
  const [q, setQ] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("username").eq("id", session.user.id).maybeSingle();
      const allowed = data?.username === ADMIN_USERNAME;
      setOk(allowed);
      if (!allowed) return;
      const [{ data: profiles }, { data: clicks }, { data: links }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name, view_count, created_at").order("view_count", { ascending: false }),
        supabase.from("custom_links").select("click_count"),
        supabase.from("custom_links").select("id"),
      ]);
      setRows((profiles ?? []) as Row[]);
      setTotals({
        users: profiles?.length ?? 0,
        views: (profiles ?? []).reduce((a, b) => a + (b.view_count ?? 0), 0),
        clicks: (clicks ?? []).reduce((a, b: { click_count: number }) => a + (b.click_count ?? 0), 0),
        links: links?.length ?? 0,
      });
    })();
  }, [loading, session, navigate]);

  if (loading || ok === null) {
    return <main className="min-h-screen"><Header /><div className="pt-32 text-center text-sm text-muted-foreground">loading…</div></main>;
  }
  if (!ok) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="font-display text-2xl font-bold">access denied</div>
          <div className="mt-2 text-sm text-muted-foreground">this area is restricted to @{ADMIN_USERNAME}.</div>
          <Link to="/dashboard" className="mt-6 inline-block text-primary hover:underline text-sm">← back to dashboard</Link>
        </div>
      </main>
    );
  }

  const filtered = rows.filter((r) => r.username.includes(q) || (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <main className="min-h-screen font-sans pb-20">
      <Header />
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">owner panel</div>
            <h1 className="mt-2 font-display text-3xl font-bold">admin · @{ADMIN_USERNAME}</h1>
          </div>
          <div className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">god mode</div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "users", v: totals.users },
            { l: "total views", v: totals.views },
            { l: "total clicks", v: totals.clicks },
            { l: "total links", v: totals.links },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4 text-center">
              <div className="font-display text-2xl font-bold text-gradient">{s.v.toLocaleString()}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">all users</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search…"
              className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-xs outline-none focus:border-primary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left py-2">user</th>
                  <th className="text-right py-2">views</th>
                  <th className="text-right py-2">joined</th>
                  <th className="text-right py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-background/30">
                    <td className="py-2">
                      <div className="font-medium">{r.display_name || r.username}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">@{r.username}</div>
                    </td>
                    <td className="py-2 text-right font-mono">{r.view_count.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2 text-right">
                      <Link to="/u/$username" params={{ username: r.username }} className="text-primary text-xs hover:underline">view →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">no users match</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
