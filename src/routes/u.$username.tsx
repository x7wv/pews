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

import { PLATFORM_ICONS } from "@/lib/platform-icons";
import { songEmbedUrl, videoEmbedUrl } from "@/lib/media-embed";
const CRYPTO_PLATFORMS = new Set(["bitcoin", "ethereum", "wallet"]);

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
          <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "0ms" }}>
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
          <div className="mt-6 grid grid-cols-3 gap-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
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
            <div className="mt-6 grid gap-2 animate-fade-up" style={{ gridTemplateColumns: `repeat(${Math.min(socials.length, 6)}, minmax(0, 1fr))`, animationDelay: "160ms" }}>
              {socials.map((s: { id: string; platform: string; url: string }) => {
                const isCrypto = CRYPTO_PLATFORMS.has(s.platform);
                const shared = "group relative flex aspect-square items-center justify-center rounded-xl border border-border bg-background/40 text-foreground/70 transition hover:-translate-y-0.5";
                const handlers = {
                  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = `${accent}99`; e.currentTarget.style.color = accent; },
                  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; },
                };
                if (isCrypto) {
                  return (
                    <button key={s.id} type="button" aria-label={`copy ${s.platform} address`}
                      title={copiedId === s.id ? "copied!" : `copy ${s.platform} address`}
                      onClick={() => { navigator.clipboard.writeText(s.url); setCopiedId(s.id); setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1500); }}
                      className={shared} style={{ transitionProperty: "transform, color, border-color, background" }} {...handlers}>
                      {copiedId === s.id ? <span className="text-[10px] font-mono">✓</span> : (PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website)}
                    </button>
                  );
                }
                return (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener" aria-label={s.platform}
                    className={shared} style={{ transitionProperty: "transform, color, border-color, background" }} {...handlers}>
                    {PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website}
                  </a>
                );
              })}
            </div>
          )}

          {/* Showcase photo */}
          {profile.photo_url && (
            <div className="mt-6 animate-fade-up overflow-hidden rounded-2xl border border-border" style={{ animationDelay: "220ms" }}>
              <img src={profile.photo_url} alt="" className="w-full object-cover transition duration-500 hover:scale-105" />
            </div>
          )}

          {/* Song */}
          {profile.song_url && (() => {
            const embed = songEmbedUrl(profile.song_url);
            if (!embed) return null;
            return (
              <div className="mt-6 animate-fade-up overflow-hidden rounded-2xl border border-border bg-background/40" style={{ animationDelay: "280ms" }}>
                {embed.type === "iframe" ? (
                  <iframe src={embed.src} className="h-24 w-full" style={{ border: 0 }} loading="lazy"
                    allow="autoplay; encrypted-media; clipboard-write" title="song" />
                ) : (
                  <audio src={embed.src} controls className="w-full p-3" style={{ accentColor: accent }} />
                )}
              </div>
            );
          })()}

          {/* Video */}
          {profile.video_url && (() => {
            const embed = videoEmbedUrl(profile.video_url);
            if (!embed) return null;
            return (
              <div className="mt-6 animate-fade-up aspect-video overflow-hidden rounded-2xl border border-border bg-background/40" style={{ animationDelay: "340ms" }}>
                {embed.type === "iframe" ? (
                  <iframe src={embed.src} className="h-full w-full" style={{ border: 0 }} loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title="video" />
                ) : (
                  <video src={embed.src} controls className="h-full w-full object-cover" />
                )}
              </div>
            );
          })()}

          {/* Links */}
          {links.length > 0 && (
            <div className="mt-4 space-y-2 animate-fade-up" style={{ animationDelay: "400ms" }}>
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
