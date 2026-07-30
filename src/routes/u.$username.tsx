import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateSessionToken } from "@/lib/auth";
import defaultBg from "@/assets/pews-bg.jpg";

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
import { useLanyard, discordAvatarUrl, STATUS_COLORS } from "@/lib/lanyard";
const CRYPTO_PLATFORMS = new Set(["bitcoin", "ethereum", "litecoin", "monero", "wallet"]);

function Particles({ color }: { color: string }) {
  const items = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 15,
      duration: 14 + Math.random() * 20, size: 1.5 + Math.random() * 2.5,
      drift: (Math.random() - 0.5) * 160,
    })), []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {items.map((p) => (
        <span key={p.id} className="absolute rounded-full animate-float"
          style={{
            left: `${p.left}%`, bottom: "-10px", width: p.size, height: p.size,
            background: `radial-gradient(circle, oklch(1 0 0 / 90%), ${color} 70%, transparent)`,
            boxShadow: `0 0 8px oklch(1 0 0 / 40%)`,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          } as React.CSSProperties} />
      ))}
    </div>
  );
}

function DiscordCard({ discordId, boxStyle, blurPx, textColor }: { discordId: string; boxStyle: { background: string; borderColor: string }; blurPx: number; textColor: string }) {
  const { presence, loading } = useLanyard(discordId);
  if (loading) return null;
  if (!presence?.found || !presence.discord_user) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-left" style={{ ...boxStyle, backdropFilter: `blur(${blurPx}px)` }}>
        <span className="text-lg">❌</span>
        <div>
          <div className="text-sm font-medium" style={{ color: textColor }}>User Not found</div>
          <div className="text-xs" style={{ color: `${textColor}99` }}>
            Please <a href="https://discord.com/invite/lanyard" target="_blank" rel="noreferrer" className="underline hover:opacity-80">connect</a> your Discord account
          </div>
        </div>
      </div>
    );
  }
  const u = presence.discord_user;
  const status = presence.discord_status ?? "offline";
  const activity = presence.activities?.find((a) => a.type !== 4 && a.name !== "Custom Status");
  const subtitle = presence.listening_to_spotify && presence.spotify
    ? `Listening to ${presence.spotify.song} — ${presence.spotify.artist}`
    : activity ? `${["Playing", "Streaming", "Listening to", "Watching"][activity.type] ?? "Playing"} ${activity.name}` : status[0].toUpperCase() + status.slice(1);
  return (
    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-left" style={{ ...boxStyle, backdropFilter: `blur(${blurPx}px)` }}>
      <div className="relative flex-shrink-0">
        <img src={discordAvatarUrl(u)} alt="" className="h-9 w-9 rounded-full" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background" style={{ background: STATUS_COLORS[status] }} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium" style={{ color: textColor }}>{u.global_name || u.username}</div>
        <div className="truncate text-xs" style={{ color: `${textColor}99` }}>{subtitle}</div>
      </div>
    </div>
  );
}

function PublicProfile() {
  const { profile, socials, links } = Route.useLoaderData();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [views, setViews] = useState(profile.view_count);
  const [playing, setPlaying] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const token = getOrCreateSessionToken();
    supabase.from("profile_views")
      .insert({ profile_id: profile.id, session_token: token })
      .then(({ error }) => {
        if (!error) setViews((v: number) => v + 1);
      });
  }, [profile.id]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = bgRef.current;
      if (!el) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.transform = `scale(1.08) translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  async function handleLinkClick(id: string) {
    await supabase.rpc("bump_link_click", { link_id: id });
  }

  const accent = profile.accent_color || "#3b82f6";
  const bgImage = profile.photo_url || profile.background_url || defaultBg;
  const displayName = profile.display_name || profile.username;
  const songEmbed = profile.song_url ? songEmbedUrl(profile.song_url) : null;
  const videoEmbed = profile.video_url ? videoEmbedUrl(profile.video_url) : null;
  const textColor = profile.text_color || "#ffffff";
  const iconColor = profile.monochrome_icons ? (profile.icon_color || "#ffffff") : undefined;
  const opacity = (profile.profile_opacity ?? 60) / 100;
  const blurPx = profile.profile_blur ?? 20;
  const boxStyle = profile.swap_box_colors
    ? { background: `${accent}26`, borderColor: `${accent}80` }
    : { background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.1)" };

  function toggleAudio() {
    if (songEmbed?.type === "audio" && audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setPlaying(!playing);
    } else if (profile.song_url) {
      window.open(profile.song_url, "_blank", "noreferrer");
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans" style={{ background: profile.background_color || "#080808", color: textColor, cursor: profile.cursor_url ? `url(${profile.cursor_url}), auto` : undefined }}>
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <div ref={bgRef} className="h-full w-full transition-transform duration-300 ease-out will-change-transform">
          <img src={bgImage} alt="" className="h-full w-full object-cover" style={{ opacity }} />
        </div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, transparent 0%, oklch(0.03 0.005 300 / 0.75) 60%, oklch(0.02 0.005 300 / 0.97) 100%)" }} />
        <div className="absolute inset-0 grid-overlay opacity-30" />
      </div>
      <Particles color={`${accent}66`} />

      {profile.song_url && (
        <button onClick={toggleAudio} aria-label="toggle audio"
          className="fixed top-5 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 transition hover:border-white/30 hover:text-white"
          style={{ backdropFilter: `blur(${blurPx}px)` }}>
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      )}
      {songEmbed?.type === "audio" && (
        <audio ref={audioRef} src={songEmbed.src} loop onEnded={() => setPlaying(false)} className="hidden" />
      )}

      <div className="fixed bottom-5 left-5 z-30 flex items-center gap-1.5 text-xs text-white/50 font-mono">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
        {views.toLocaleString()}
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="mx-auto h-8 w-8 opacity-90">
            <path d="M12 2l2.5 7H22l-6 4.5 2.5 7L12 16l-6.5 4.5L8 13.5 2 9h7.5z" />
          </svg>
        </div>

        <h1 className="mt-4 animate-fade-up font-display text-4xl md:text-5xl font-bold tracking-tight" style={{ animationDelay: "60ms", color: textColor }}>
          {displayName}
        </h1>

        {profile.bio && (
          <p className="mt-2 animate-fade-up max-w-sm text-sm italic" style={{ animationDelay: "120ms", color: textColor, opacity: 0.65 }}>
            {profile.bio}
          </p>
        )}

        {profile.discord_id && (
          <div className="mt-6 w-full max-w-xs animate-fade-up" style={{ animationDelay: "180ms" }}>
            <DiscordCard discordId={profile.discord_id} boxStyle={boxStyle} blurPx={blurPx} textColor={textColor} />
          </div>
        )}

        {socials.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "240ms" }}>
            {socials.map((s: { id: string; platform: string; url: string }) => {
              const isCrypto = CRYPTO_PLATFORMS.has(s.platform);
              const shared = "transition-all duration-200 hover:-translate-y-0.5 hover:scale-110";
              const baseColor = iconColor ?? `${textColor}99`;
              const handlers = profile.monochrome_icons ? {} : {
                onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = accent; e.currentTarget.style.filter = `drop-shadow(0 0 8px ${accent}99)`; },
                onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = baseColor; e.currentTarget.style.filter = ""; },
              };
              if (isCrypto) {
                return (
                  <button key={s.id} type="button" aria-label={`copy ${s.platform} address`}
                    title={copiedId === s.id ? "copied!" : `copy ${s.platform} address`}
                    onClick={() => { navigator.clipboard.writeText(s.url); setCopiedId(s.id); setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1500); }}
                    className={shared} style={{ color: baseColor }} {...handlers}>
                    {copiedId === s.id ? <span className="text-xs font-mono">✓</span> : (PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website)}
                  </button>
                );
              }
              return (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener" aria-label={s.platform}
                  className={shared} style={{ color: baseColor }} {...handlers}>
                  {PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website}
                </a>
              );
            })}
          </div>
        )}

        {videoEmbed && (
          <div className="mt-8 w-full animate-fade-up aspect-video overflow-hidden rounded-2xl border" style={{ animationDelay: "300ms", ...boxStyle, backdropFilter: `blur(${blurPx}px)` }}>
            {videoEmbed.type === "iframe" ? (
              <iframe src={videoEmbed.src} className="h-full w-full" style={{ border: 0 }} loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title="video" />
            ) : (
              <video src={videoEmbed.src} controls className="h-full w-full object-cover" />
            )}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-8 w-full space-y-2 animate-fade-up" style={{ animationDelay: "360ms" }}>
            {links.map((l: { id: string; title: string; url: string }) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                onClick={() => handleLinkClick(l.id)}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-3 transition"
                style={{ ...boxStyle, backdropFilter: `blur(${blurPx}px)` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}99`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = boxStyle.borderColor; }}>
                <div className="font-medium text-sm" style={{ color: textColor }}>{l.title}</div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 transition group-hover:translate-x-1" style={{ color: `${textColor}80` }}><path d="M7 17L17 7M8 7h9v9"/></svg>
              </a>
            ))}
          </div>
        )}

        <a href="/" className="mt-10 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition">
          made with ♥ on pews · claim yours
        </a>
      </section>
    </main>
  );
}
