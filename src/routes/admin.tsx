import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Header } from "@/components/pews/Header";

const ADMIN_USERNAMES = new Set(["x7wv", "knyfe"]);

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
  is_banned: boolean;
  ban_reason: string | null;
  is_verified: boolean;
  is_premium: boolean;
};

function AdminPanel() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [reports, setReports] = useState<{ id: string; profile_id: string; reason: string; details: string | null; status: string; created_at: string }[]>([]);
  const [totals, setTotals] = useState({ users: 0, views: 0, clicks: 0, links: 0 });
  const [q, setQ] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [eventTheme, setEventTheme] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<{ id: string; title: string; description: string | null; status: string; created_at: string; resolved_at: string | null }[]>([]);
  const [newIncidentTitle, setNewIncidentTitle] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("username").eq("id", session.user.id).maybeSingle();
      const allowed = !!data?.username && ADMIN_USERNAMES.has(data.username);
      setOk(allowed);
      setMyUsername(data?.username ?? "");
      if (!allowed) return;
      const [{ data: profiles }, { data: clicks }, { data: links }, { data: reportsData }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name, view_count, created_at, is_banned, ban_reason, is_verified, is_premium").order("view_count", { ascending: false }),
        supabase.from("custom_links").select("click_count"),
        supabase.from("custom_links").select("id"),
        supabase.from("profile_reports").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      ]);
      const { data: settings } = await supabase.from("site_settings").select("event_theme").eq("id", true).maybeSingle();
      setEventTheme(settings?.event_theme ?? null);
      const { data: incidentsData } = await supabase.from("site_incidents").select("*").order("created_at", { ascending: false }).limit(10);
      setIncidents(incidentsData ?? []);
      setRows((profiles ?? []) as Row[]);
      setReports(reportsData ?? []);
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 h-14 w-14 text-muted-foreground"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          <div className="font-display text-2xl font-bold">access denied</div>
          <div className="mt-2 text-sm text-muted-foreground">this area is restricted to admins.</div>
          <Link to="/dashboard" className="mt-6 inline-block text-primary hover:underline text-sm">← back to dashboard</Link>
        </div>
      </main>
    );
  }

  async function banUser(id: string) {
    const reason = window.prompt("reason for ban (shown to the user, optional):", "") ?? "";
    const { error } = await supabase.from("profiles").update({ is_banned: true, ban_reason: reason || null }).eq("id", id);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_banned: true, ban_reason: reason || null } : r)));
  }

  async function unbanUser(id: string) {
    const { error } = await supabase.from("profiles").update({ is_banned: false, ban_reason: null }).eq("id", id);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_banned: false, ban_reason: null } : r)));
  }

  async function toggleVerified(id: string, current: boolean) {
    const { error } = await supabase.from("profiles").update({ is_verified: !current }).eq("id", id);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_verified: !current } : r)));
  }

  async function postIncident() {
    if (!newIncidentTitle.trim()) return;
    const { data, error } = await supabase.from("site_incidents").insert({ title: newIncidentTitle.trim(), status: "investigating" }).select().single();
    if (error) return alert(error.message);
    setIncidents((prev) => [data, ...prev]);
    setNewIncidentTitle("");
  }

  async function updateIncidentStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("site_incidents").update(patch as never).eq("id", id);
    if (error) return alert(error.message);
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } as typeof i : i)));
  }

  async function updateEventTheme(theme: string | null) {
    const { error } = await supabase.from("site_settings").update({ event_theme: theme, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) return alert(error.message);
    setEventTheme(theme);
  }

  async function resolveReport(id: string, status: "dismissed" | "actioned") {
    const { error } = await supabase.from("profile_reports").update({ status }).eq("id", id);
    if (error) return alert(error.message);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function togglePremium(id: string, current: boolean) {
    const { error } = await supabase.from("profiles").update({ is_premium: !current }).eq("id", id);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_premium: !current } : r)));
  }

  const filtered = rows.filter((r) => r.username.includes(q) || (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <main className="min-h-screen font-sans pb-20">
      <Header />
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">owner panel</div>
            <h1 className="mt-2 font-display text-3xl font-bold">admin · @{myUsername}</h1>
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
          <div className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">site-wide event theme</div>
          <div className="mt-1 text-[11px] text-muted-foreground">pushes a temporary visual effect to every public profile on the site. pick "none" to turn it off.</div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: null, label: "none" },
              { id: "snow", label: "❄ snow" },
              { id: "hearts", label: "♥ hearts" },
              { id: "confetti", label: "🎉 confetti" },
            ].map((t) => (
              <button key={t.label} onClick={() => updateEventTheme(t.id)}
                className={`rounded-xl border p-3 text-sm transition ${eventTheme === t.id ? "border-primary bg-primary/10" : "border-border bg-background/30 hover:border-primary/40"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5">
          <div className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">status page incidents</div>
          <div className="mt-3 flex gap-2">
            <input value={newIncidentTitle} onChange={(e) => setNewIncidentTitle(e.target.value)} placeholder="e.g. elevated login errors"
              className="flex-1 rounded-lg border border-border bg-background/30 px-3 py-2 text-sm outline-none focus:border-primary" />
            <button onClick={postIncident} className="btn-sm">post incident</button>
          </div>
          <div className="mt-3 space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/30 p-3">
                <div className="text-sm">{inc.title}</div>
                <select value={inc.status} onChange={(e) => updateIncidentStatus(inc.id, e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none">
                  <option value="investigating">investigating</option>
                  <option value="identified">identified</option>
                  <option value="monitoring">monitoring</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {reports.length > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl p-5">
            <div className="font-display text-sm font-semibold uppercase tracking-widest text-amber-400">pending reports ({reports.length})</div>
            <div className="mt-3 space-y-2">
              {reports.map((r) => {
                const reportedUser = rows.find((u) => u.id === r.profile_id);
                return (
                  <div key={r.id} className="rounded-xl border border-border bg-background/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-medium">@{reportedUser?.username || r.profile_id}</span> — {r.reason}
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <button onClick={() => resolveReport(r.id, "dismissed")} className="text-xs text-muted-foreground hover:underline">dismiss</button>
                        <button onClick={() => resolveReport(r.id, "actioned")} className="text-xs text-red-400 hover:underline">mark actioned</button>
                      </div>
                    </div>
                    {r.details && <div className="mt-1 text-xs text-muted-foreground">{r.details}</div>}
                    <div className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                      <div className="font-medium flex items-center gap-2">
                        {r.display_name || r.username}
                        {r.is_banned && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-mono text-red-400">banned</span>}
                        {r.is_premium && <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-mono text-yellow-400">premium</span>}
                        {r.is_verified && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-mono text-blue-400">verified</span>}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">@{r.username}</div>
                    </td>
                    <td className="py-2 text-right font-mono">{r.view_count.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link to="/u/$username" params={{ username: r.username }} className="text-primary text-xs hover:underline">view →</Link>
                        <button onClick={() => togglePremium(r.id, r.is_premium)} className={`text-xs hover:underline ${r.is_premium ? "text-muted-foreground" : "text-yellow-400"}`}>
                          {r.is_premium ? "unpremium" : "make premium"}
                        </button>
                        <button onClick={() => toggleVerified(r.id, r.is_verified)} className={`text-xs hover:underline ${r.is_verified ? "text-muted-foreground" : "text-blue-400"}`}>
                          {r.is_verified ? "unverify" : "verify"}
                        </button>
                        {r.is_banned ? (
                          <button onClick={() => unbanUser(r.id)} className="text-xs text-emerald-400 hover:underline">unban</button>
                        ) : (
                          <button onClick={() => banUser(r.id)} className="text-xs text-red-400 hover:underline">ban</button>
                        )}
                      </div>
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
