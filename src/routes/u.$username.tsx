import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateSessionToken } from "@/lib/auth";
import defaultBg from "@/assets/pews-bg.jpg";
import defaultAvatar from "@/assets/pews-avatar.jpg";

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .maybeSingle();
    if (error) throw error;
    if (!profile) throw notFound();
    const [{ data: socials }, { data: links }] = await Promise.all([
      supabase.from("social_links").select("*").eq("user_id", profile.id).order("position"),
      supabase.from("custom_links").select("*").eq("user_id", profile.id).order("position"),
    ]);
    return { profile, socials: socials ?? [], links: links ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const title = p ? `${p.display_name || "@" + p.username} — pews` : "pews";
    const desc = p?.bio || `${p?.username ?? "user"}'s pews bio page.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicProfile,
});

const PLATFORM_ICONS: Record<string, React.ReactElement> = {
  discord: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.673-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.418 0-1.334.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.333-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.334.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  github: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 .296a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .296"/></svg>,
  spotify: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.06-.78-.18-.9-.6-.12-.42.18-.78.6-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.24 1.08zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.42.18.6.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.36c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.24z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  twitch: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
  website: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

function Particles({ color }: { color: string }) {
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
            background: color, boxShadow: `0 0 6px ${color}`,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          } as React.CSSProperties} />
      ))}
    </div>
  );
}

function PublicProfile() {
  const { profile, socials, links } = Route.useLoaderData();
  const [entered, setEntered] = useState(false);
  const [now, setNow] = useState(new Date());
  const [views, setViews] = useState(profile.view_count);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const token = getOrCreateSessionToken();
    supabase.from("profile_views")
      .insert({ profile_id: profile.id, session_token: token })
      .then(({ error }) => {
        if (!error) setViews((v: number) => v + 1);
      });
  }, [profile.id]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !entered) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    };
    const onLeave = () => { el.style.transform = "perspective(1000px) rotateY(0) rotateX(0)"; };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [entered]);

  async function handleLinkClick(id: string) {
    await supabase.rpc("bump_link_click", { link_id: id });
  }

  const accent = profile.accent_color || "#3b82f6";
  const bgImage = profile.background_url || defaultBg;
  const avatar = profile.avatar_url || defaultAvatar;
  const displayName = profile.display_name || profile.username;

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden font-sans"
      style={{ ["--pews-accent" as string]: accent }}
    >
      <div className="fixed inset-0 -z-20">
        <img src={bgImage} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, transparent 0%, oklch(0.08 0.01 300 / 0.85) 70%, oklch(0.05 0.01 300) 100%)` }} />
      </div>
      <Particles color={`${accent}b3`} />

      {!entered && (
        <button
          onClick={() => setEntered(true)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 backdrop-blur-xl bg-background/60"
        >
          <div className="text-xs uppercase tracking-[0.5em] text-muted-foreground">welcome to</div>
          <h1 className="font-display font-bold text-7xl md:text-9xl tracking-tight" style={{ color: accent }}>@{profile.username}</h1>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 text-sm font-medium">
            click anywhere to enter →
          </div>
        </button>
      )}

      <section className={`relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 ${entered ? "" : "opacity-0"}`}>
        <div
          ref={cardRef}
          className="w-full rounded-3xl border border-border bg-card/40 backdrop-blur-2xl p-8 shadow-2xl transition-transform duration-200 will-change-transform"
          style={{ boxShadow: `0 30px 80px -20px oklch(0 0 0 / 0.8), 0 0 0 1px oklch(1 0 0 / 0.05), inset 0 1px 0 oklch(1 0 0 / 0.08)` }}
        >
          <div className="flex flex-col items-center animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 40px ${accent}80, 0 0 80px ${accent}40` }} />
              <img src={avatar} alt={displayName} className="relative w-32 h-32 rounded-full object-cover border-2" style={{ borderColor: `${accent}99` }} />
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background" />
            </div>

            <div className="mt-5 flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">{displayName}</h2>
            </div>
            <div className="text-xs font-mono text-muted-foreground">@{profile.username}</div>

            {profile.bio && <p className="mt-4 text-center text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-2 animate-fade-up">
            {[
              { label: "views", value: views.toLocaleString() },
              { label: "links", value: links.length.toString() },
              { label: "since", value: new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" }) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-background/40 px-2 py-3 text-center">
                <div className="font-mono text-sm font-semibold">{s.value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Socials */}
          {socials.length > 0 && (
            <div className="mt-6 grid gap-2 animate-fade-up" style={{ gridTemplateColumns: `repeat(${Math.min(socials.length, 6)}, minmax(0, 1fr))` }}>
              {socials.map((s: { id: string; platform: string; url: string }) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener" aria-label={s.platform}
                  className="group relative flex aspect-square items-center justify-center rounded-xl border border-border bg-background/40 text-foreground/70 transition hover:-translate-y-0.5"
                  style={{ transitionProperty: "transform, color, border-color, background" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}99`; e.currentTarget.style.color = accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
                  {PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website}
                </a>
              ))}
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="mt-4 space-y-2 animate-fade-up">
              {links.map((l: { id: string; title: string; url: string }) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                  onClick={() => handleLinkClick(l.id)}
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-border bg-background/40 px-4 py-3 transition"
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}99`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}>
                  <div className="font-medium text-sm">{l.title}</div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-muted-foreground transition group-hover:translate-x-1"><path d="M7 17L17 7M8 7h9v9"/></svg>
                </a>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span style={{ color: accent }} className="font-semibold">pews.lol</span>
            <span>online</span>
          </div>
        </div>

        <a href="/" className="mt-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 hover:text-foreground">
          made with ♥ on pews · claim yours
        </a>
      </section>
    </main>
  );
}
