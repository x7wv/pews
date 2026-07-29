import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import bg from "@/assets/pews-bg.jpg";
import { Header } from "@/components/pews/Header";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "pews — your links, your vibe" },
      { name: "description", content: "pews · claim your username, drop your links, socials, music, and personality on one peak bio page." },
      { property: "og:title", content: "pews — your links, your vibe" },
      { property: "og:description", content: "claim your bio page. links, socials, stats, real-time views. built different." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  component: Landing,
});

function Particles() {
  const items = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 15,
      duration: 12 + Math.random() * 18, size: 1 + Math.random() * 2.5,
      drift: (Math.random() - 0.5) * 200,
    })), []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {items.map((p) => (
        <span key={p.id} className="absolute rounded-full animate-float"
          style={{
            left: `${p.left}%`, bottom: "-10px", width: p.size, height: p.size,
            background: "oklch(0.62 0.19 250 / 0.7)",
            boxShadow: "0 0 6px oklch(0.62 0.19 250 / 0.8)",
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          } as React.CSSProperties} />
      ))}
    </div>
  );
}

function Landing() {
  const { user } = useSession();
  const [handle, setHandle] = useState("");

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans">
      <div className="fixed inset-0 -z-20">
        <img src={bg} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, oklch(0.08 0.01 300 / 0.9) 70%, oklch(0.05 0.01 300) 100%)" }} />
      </div>
      <Particles />
      <Header />

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 rounded-full border border-border bg-card/40 px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground animate-fade-up">
          <span className="text-primary">●</span> now in beta · claim your name
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight text-gradient animate-fade-up" style={{ animationDelay: "0.05s" }}>
          one link. all you.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "0.1s" }}>
          pews is your personal bio page. links, socials, music, stats, real vibes — customizable, tracked, yours.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const u = handle.trim().replace(/[^a-zA-Z0-9_]/g, "");
            window.location.href = `/auth?mode=signup&u=${encodeURIComponent(u)}`;
          }}
          className="mt-10 flex w-full max-w-md items-center gap-2 rounded-2xl border border-border bg-card/60 p-2 backdrop-blur-xl animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="pl-3 text-sm font-mono text-muted-foreground">pews.lol/u/</div>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname"
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
            claim →
          </button>
        </form>

        <div className="mt-4 text-[11px] font-mono text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {user ? (
            <Link to="/dashboard" className="underline hover:text-foreground">go to your dashboard →</Link>
          ) : (
            <>free forever · google + email sign-in</>
          )}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">features</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-gradient">everything you need</h2>
          <p className="mt-3 text-muted-foreground">and nothing you don't.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "customizable", d: "avatar, bio, background, accent color, particles — your page, your rules.", i: "🎨" },
            { t: "real analytics", d: "profile views, per-link clicks, click-through-rate over 24h/7d/30d.", i: "📊" },
            { t: "socials + links", d: "icon grid, custom buttons, reorderable, unlimited.", i: "🔗" },
            { t: "qr codes", d: "instant QR for your profile — download, print, share IRL.", i: "▩" },
            { t: "themes", d: "save multiple visual themes. swap your vibe in one click.", i: "✨" },
            { t: "custom domains", d: "point your own domain at your pews page. yourname.com.", i: "🌐" },
          ].map((f) => (
            <div key={f.t} className="group rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 hover:-translate-y-1 transition">
              <div className="text-3xl mb-3">{f.i}</div>
              <div className="text-sm font-semibold text-gradient">{f.t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">how it works</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-gradient">three steps. that's it.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "claim your name", d: "sign up with google or email. pick your @handle." },
            { n: "02", t: "customize", d: "upload avatar, drop bio, pick a theme, add links + socials." },
            { n: "03", t: "share", d: "one link. QR code. or your own domain. all yours." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6">
              <div className="font-mono text-primary text-xs">{s.n}</div>
              <div className="mt-2 font-display text-xl font-bold">{s.t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "∞", l: "links" },
            { v: "0¢", l: "cost" },
            { v: "<1s", l: "load time" },
            { v: "24/7", l: "uptime" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 text-center">
              <div className="font-display text-4xl font-bold text-gradient">{s.v}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <div className="text-center mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">faq</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-gradient">questions?</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: "is it free?", a: "yes. pews is free forever for the core features." },
            { q: "can i use my own domain?", a: "yes — connect any domain in the dashboard. DNS instructions provided." },
            { q: "do you track visitors?", a: "we count views (deduplicated per browser session) and link clicks. no third-party tracking." },
            { q: "can i change my username?", a: "yep. edit it anytime from your dashboard." },
          ].map((f) => (
            <details key={f.q} className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-5 group">
              <summary className="cursor-pointer font-medium text-sm flex items-center justify-between">
                {f.q}
                <span className="text-primary group-open:rotate-45 transition">+</span>
              </summary>
              <div className="mt-3 text-sm text-muted-foreground">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-10">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient">ready to peak?</h2>
          <p className="mt-3 text-muted-foreground">grab your name before someone else does.</p>
          <Link to="/auth" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            get started — free
          </Link>
        </div>
        <div className="mt-16 mb-10 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          made with ♥ · pews.lol
        </div>
      </section>
    </main>
  );
}
