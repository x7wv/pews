import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/pews/Header";

export const Route = createFileRoute("/status")({
  loader: async () => {
    const { data } = await supabase.from("site_incidents").select("*").order("created_at", { ascending: false }).limit(20);
    return { incidents: data ?? [] };
  },
  head: () => ({
    meta: [
      { title: "status — pews" },
      { name: "description", content: "pews.lol system status and incident history." },
    ],
  }),
  component: Status,
});

const STATUS_LABEL: Record<string, string> = {
  investigating: "investigating",
  identified: "identified",
  monitoring: "monitoring",
  resolved: "resolved",
};
const STATUS_COLOR: Record<string, string> = {
  investigating: "text-red-400 bg-red-500/10 border-red-500/30",
  identified: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  monitoring: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

function Status() {
  const { incidents } = Route.useLoaderData();
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from("site_settings").select("id").limit(1).then(({ error }) => setDbOk(!error));
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const allOperational = dbOk && activeIncidents.length === 0;

  return (
    <main className="relative min-h-screen overflow-x-hidden font-sans pb-20">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />
      <Header />
      <section className="mx-auto max-w-2xl px-4 pt-24">
        <h1 className="font-display text-3xl font-bold">status</h1>

        <div className={`mt-6 flex items-center gap-3 rounded-2xl border p-5 ${allOperational ? "border-emerald-500/30 bg-emerald-500/5" : dbOk === null ? "border-border bg-card/40" : "border-amber-500/30 bg-amber-500/5"}`}>
          <span className={`h-3 w-3 flex-shrink-0 rounded-full ${dbOk === null ? "bg-muted-foreground" : allOperational ? "bg-emerald-400" : "bg-amber-400"} ${dbOk !== null ? "animate-pulse" : ""}`} />
          <div>
            <div className="text-sm font-semibold">
              {dbOk === null ? "checking systems…" : allOperational ? "all systems operational" : "some systems may be affected"}
            </div>
            <div className="text-xs text-muted-foreground">database connectivity: {dbOk === null ? "checking…" : dbOk ? "reachable" : "unreachable"}</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">incident history</div>
          {incidents.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              no incidents reported.
            </div>
          )}
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{inc.title}</div>
                  <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_COLOR[inc.status]}`}>
                    {STATUS_LABEL[inc.status]}
                  </span>
                </div>
                {inc.description && <div className="mt-1 text-xs text-muted-foreground">{inc.description}</div>}
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(inc.created_at).toLocaleString()}
                  {inc.resolved_at && ` · resolved ${new Date(inc.resolved_at).toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link to="/" className="mt-8 inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
          ← back home
        </Link>
      </section>
    </main>
  );
}
