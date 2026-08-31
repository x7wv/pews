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
    links: [],
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
        <div className="absolute inset-0 grid-overlay opacity-40" />
      </div>
      <Particles />
      <Header />

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="mb-6 animate-fade-up rounded-full border border-border bg-card/40 px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <span className="inline-block animate-pulse-glow rounded-full text-primary">●</span> now in beta · claim your name
        </div>
        <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight text-gradient animate-fade-up" style={{ animationDelay: "0.05s" }}>
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
          className="hud-corners relative mt-10 flex w-full max-w-md items-center gap-1.5 overflow-hidden rounded-2xl border border-border bg-card/60 p-2 backdrop-blur-xl animate-fade-up sm:gap-2"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="pointer-events-none absolute left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.19 250 / 80%), transparent)", animation: "scan-sweep 3s ease-in-out infinite" }} />
          <div className="flex-shrink-0 pl-2 text-xs font-mono text-muted-foreground sm:pl-3 sm:text-sm">
            <span className="hidden sm:inline">pews.lol</span>/u/
          </div>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
          <button type="submit" className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_var(--color-primary)] active:translate-y-0 sm:px-4">
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

      {/* PRICING */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-4">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.4em] text-primary">pricing</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-gradient">free or premium.</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6">
            <div className="font-display text-lg font-bold">free</div>
            <div className="mt-1 text-xs text-muted-foreground">everything you need to get started</div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                "1 custom link",
                "unlimited socials",
                "themes, fonts, custom cursor",
                "analytics + UTM builder",
                "QR code + custom domain support",
                "cursor trail effect",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-muted-foreground"><path d="M20 6 9 17l-5-5"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl border border-primary/40 bg-primary/5 backdrop-blur-xl p-6 shadow-[0_0_40px_-15px_var(--color-primary)]">
            <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary-foreground">premium</div>
            <div className="font-display text-lg font-bold text-gradient">premium</div>
            <div className="mt-1 text-xs text-muted-foreground">everything in free, plus:</div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                "up to 5 custom links",
                "1-character usernames",
                "premium badge + custom favicon",
                "custom fonts + gradient/typewriter text",
                "parallax tilt + video avatars",
                "password-protected pages",
                "live visitor count",
                "music crossfade (up to 3 tracks)",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0 text-primary"><path d="M20 6 9 17l-5-5"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <a href="https://discord.gg/zmfZZNsZh8" target="_blank" rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419z"/></svg>
              join the discord to purchase premium
            </a>
          </div>
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
            { t: "customizable", d: "avatar, bio, background, accent color, particles — your page, your rules.", i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c2.3 0 4.1-1.8 4.1-4.1C21.5 6.1 17.2 2 12 2Z"/><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" stroke="none"/></svg> },
            { t: "real analytics", d: "profile views, per-link clicks, click-through-rate over 24h/7d/30d.", i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12.5" y="8" width="3" height="10"/><rect x="18" y="5" width="3" height="13"/></svg> },
            { t: "socials + links", d: "icon grid, custom buttons, reorderable, unlimited.", i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><path d="M10 14a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/></svg> },
            { t: "qr codes", d: "instant QR for your profile — download, print, share IRL.", i: "▩" },
            { t: "themes", d: "save multiple visual themes. swap your vibe in one click.", i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><path d="m12 2 2.2 6.8H21l-5.6 4.1 2.1 6.8L12 15.8l-5.5 3.9 2.1-6.8L3 8.8h6.8Z"/></svg> },
            { t: "custom domains", d: "point your own domain at your pews page. yourname.com.", i: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg> },
          ].map((f, i) => (
            <div key={f.t}
              className="hud-corners group animate-fade-up rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_var(--color-primary)]"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-3 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">{f.i}</div>
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
          ].map((s, i) => (
            <div key={s.n}
              className="animate-fade-up rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              style={{ animationDelay: `${i * 80}ms` }}>
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
