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
      .ilike("username", params.username)
      .limit(1)
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
import { PLATFORM_BRAND_COLORS } from "@/lib/platform-colors";
import { PLATFORM_IMAGES } from "@/lib/social-images";
import { songEmbedUrl, videoEmbedUrl, fetchTrackTitle, formatTime } from "@/lib/media-embed";
import { useLanyard, discordAvatarUrl, STATUS_COLORS } from "@/lib/lanyard";
const CRYPTO_PLATFORMS = new Set(["bitcoin", "ethereum", "litecoin", "monero", "wallet", "discorduser"]);

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
  const [progress, setProgress] = useState(0);
  const lastProgressUpdate = useRef(0);
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const t = e.currentTarget.currentTime;
    if (Math.abs(t - lastProgressUpdate.current) >= 1) {
      lastProgressUpdate.current = t;
      setProgress(t);
    }
  };
  const [duration, setDuration] = useState(0);
  const [bgFailed, setBgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [nameHovered, setNameHovered] = useState(false);
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const bgRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const accent = profile.no_glow ? "#9ca3af" : (profile.accent_color || "#3b82f6");
  const bgImage = profile.photo_url || profile.background_url || defaultBg;
  const hasCustomBg = !!(profile.photo_url || profile.background_url);
  const displayName = profile.display_name || profile.username;
  const songEmbed = useMemo(() => (profile.song_url ? songEmbedUrl(profile.song_url) : null), [profile.song_url]);
  const videoEmbed = useMemo(() => (profile.video_url ? videoEmbedUrl(profile.video_url) : null), [profile.video_url]);
  const textColor = profile.text_color || "#ffffff";
  const iconColor = profile.monochrome_icons ? (profile.icon_color || "#ffffff") : undefined;
  const opacity = (profile.profile_opacity ?? 60) / 100;
  const blurPx = profile.profile_blur ?? 20;
  const boxStyle = profile.swap_box_colors
    ? { background: `${accent}26`, borderColor: `${accent}80` }
    : { background: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.1)" };

  const mp3Available = songEmbed?.type === "audio";
  const mp3Active = mp3Available && (profile.audio_source !== "video" || !videoEmbed);

  useEffect(() => {
    if (!profile.song_url) return;
    let cancelled = false;
    fetchTrackTitle(profile.song_url).then((t) => { if (!cancelled) setTrackTitle(t); });
    return () => { cancelled = true; };
  }, [profile.song_url]);

  useEffect(() => {
    if (mp3Active) {
      const el = audioRef.current;
      if (!el) return;
      el.volume = 0.5;
      el.muted = true;
      el.play().then(() => setPlaying(true)).catch(() => {});
      return;
    }
    if (videoEmbed) {
      setPlaying(true);
      if (videoRef.current) { videoRef.current.volume = 0.5; setVolume(0.5); }
    }
  }, [mp3Active, songEmbed?.src, videoEmbed]);

  // Belt-and-suspenders: mp3 always wins. If mp3 audio is present, the background
  // video's own audio track must never be audible, no matter what else changes.
  useEffect(() => {
    if (mp3Active && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [mp3Active, playing, muted]);

  function enterSite() {
    setEntered(true);
    const el = mp3Active ? audioRef.current : videoEmbed ? videoRef.current : null;
    if (el) {
      el.muted = false;
      el.volume = el.volume || 0.5;
      setMuted(false);
      setVolume(el.volume);
      if (el.paused) el.play().catch(() => {});
      setPlaying(true);
    }
  }

  function toggleAudio() {
    if (mp3Active && audioRef.current && !playbackFailed) {
      const el = audioRef.current;
      if (el.muted) { el.muted = false; el.volume = el.volume || 0.5; setMuted(false); setVolume(el.volume); if (el.paused) el.play().catch(() => {}); setPlaying(true); }
      else if (el.paused) { el.play().catch(() => {}); setPlaying(true); }
      else { el.pause(); setPlaying(false); }
      return;
    }
    if (videoEmbed && videoRef.current) {
      const el = videoRef.current;
      if (el.muted) { el.volume = el.volume || 0.5; el.muted = false; setMuted(false); setVolume(el.volume); if (el.paused) el.play().catch(() => {}); setPlaying(true); }
      else if (el.paused) { el.play().catch(() => {}); setPlaying(true); }
      else { el.pause(); setPlaying(false); }
      return;
    }
    if (profile.song_url) window.open(profile.song_url, "_blank", "noreferrer");
  }

  function seekAudio(e: React.MouseEvent<HTMLDivElement>) {
    const el = mp3Active ? audioRef.current : videoRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * duration;
    el.currentTime = t;
    lastProgressUpdate.current = t;
    setProgress(t);
  }

  function changeVolume(v: number) {
    const el = mp3Active ? audioRef.current : videoRef.current;
    if (!el) return;
    el.volume = v;
    el.muted = v === 0;
    setMuted(v === 0);
    setVolume(v);
    if (v > 0 && el.paused) { el.play().catch(() => {}); setPlaying(true); }
  }

  if (profile.is_banned) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-8 text-center">
          <div className="mx-auto mb-4 flex h-10 items-end justify-center gap-0.5">
            <div className="w-1 h-8 rounded-full bg-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            This user has been banned from <span className="text-primary">pews.lol</span>
          </h1>
          <div className="mt-2 text-sm text-white/40">Reason: {profile.ban_reason || "/"}</div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">Go Home</a>
            <a href="https://discord.gg/WrnpSzg7" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">Contact Support</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pews-profile relative isolate min-h-screen w-full overflow-hidden font-sans" style={{ color: textColor }}>
      {profile.cursor_url && (
        <style dangerouslySetInnerHTML={{ __html: `.pews-profile, .pews-profile * { cursor: url(${JSON.stringify(profile.cursor_url).slice(1, -1)}) 16 16, auto !important; }` }} />
      )}
      {!entered && (mp3Active || videoEmbed) && (
        <button onClick={enterSite}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm text-center">
          <div className="text-lg font-medium text-white" style={{ fontFamily: profile.entry_font || "Space Grotesk" }}>
            {profile.entry_message?.trim() || `enter ${displayName}'s profile`}
          </div>
        </button>
      )}
      <div className="fixed inset-0 -z-20 overflow-hidden" style={{ background: hasCustomBg || videoEmbed ? "#000" : (profile.background_color || "#080808") }}>
        <div ref={bgRef} className="h-full w-full transition-transform duration-300 ease-out will-change-transform">
          {videoEmbed ? (
            <video ref={videoRef} src={videoEmbed.src} autoPlay loop muted playsInline
              onTimeUpdate={mp3Active ? undefined : handleTimeUpdate}
              onLoadedMetadata={mp3Active ? undefined : (e) => setDuration(e.currentTarget.duration)}
              className="h-full w-full object-cover" />
          ) : hasCustomBg ? (
            <img src={bgFailed ? defaultBg : bgImage} onError={() => setBgFailed(true)} alt="" className="h-full w-full object-cover" style={{ opacity, filter: `saturate(1.1) contrast(1.05)${blurPx > 0 ? ` blur(${blurPx}px)` : ""}`, transform: blurPx > 0 ? "scale(1.1)" : undefined }} />
          ) : null}
        </div>
        {!videoEmbed && !hasCustomBg && (
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, transparent 0%, oklch(0.03 0.005 300 / 0.75) 60%, oklch(0.02 0.005 300 / 0.97) 100%)" }} />
        )}
        {!videoEmbed && !hasCustomBg && <div className="absolute inset-0 grid-overlay opacity-30" />}
      </div>
      <Particles color={`${accent}66`} />


      {mp3Active && (
        <audio ref={audioRef} src={songEmbed.src} loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() => setPlaybackFailed(true)}
          onEnded={() => setPlaying(false)} className="hidden" />
      )}

      {profile.show_volume_control && (mp3Active || videoEmbed) && !playbackFailed && (
        <div className="fixed top-5 left-5 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2"
          style={{ backdropFilter: `blur(${blurPx}px)` }}>
          <button onClick={toggleAudio} aria-label="toggle volume" className="flex-shrink-0 text-white/90 transition hover:text-white">
            {muted ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.45 2.45c.03-.2.05-.43.05-.65zM19 12c0 .94-.2 1.82-.54 2.63l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L18.73 21 20 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="h-1 w-20 accent-current" style={{ color: accent }} />
        </div>
      )}

      <div className="fixed bottom-5 left-5 z-30 flex items-center gap-1.5 text-xs text-white/50 font-mono">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
        {views.toLocaleString()}
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="relative mx-auto h-20 w-20">
            {!profile.no_glow && <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 30px ${accent}80, 0 0 60px ${accent}30` }} />}
            <img
              src={avatarFailed ? defaultAvatar : (profile.avatar_url || defaultAvatar)}
              onError={() => setAvatarFailed(true)}
              alt={displayName}
              className="relative h-20 w-20 rounded-full border-2 object-cover"
              style={{ borderColor: `${accent}99` }}
            />
          </div>
        </div>

        <div className="relative mt-4 inline-block animate-fade-up" style={{ animationDelay: "60ms" }}
          onMouseEnter={() => setNameHovered(true)} onMouseLeave={() => setNameHovered(false)}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: textColor, fontFamily: profile.font || "Space Grotesk" }}>
            {displayName}
          </h1>
          {profile.uid != null && (
            <div className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/80 px-2.5 py-1 text-[10px] font-mono text-white/70 transition-opacity duration-150 ${nameHovered ? "opacity-100" : "opacity-0"}`}>
              UID {profile.uid.toLocaleString()}
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="mt-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <p className="max-w-sm text-sm italic transition-opacity duration-150" style={{ color: textColor, opacity: nameHovered ? 0 : 0.65, fontFamily: profile.font || "Space Grotesk" }}>
              {profile.bio}
            </p>
          </div>
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
              const baseColor = profile.no_glow
                ? `${textColor}99`
                : profile.monochrome_icons
                ? (iconColor ?? `${textColor}99`)
                : (PLATFORM_BRAND_COLORS[s.platform] ?? `${textColor}99`);
              const handlers = profile.no_glow ? {} : profile.monochrome_icons ? {
                onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = accent; if (!profile.no_glow) e.currentTarget.style.filter = `drop-shadow(0 0 6px ${accent}) drop-shadow(0 0 16px ${accent}b3)`; },
                onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = baseColor; e.currentTarget.style.filter = ""; },
              } : {};
              const img = PLATFORM_IMAGES[s.platform];
              if (isCrypto) {
                return (
                  <button key={s.id} type="button" aria-label={`copy ${s.platform} address`}
                    title={copiedId === s.id ? "copied!" : `copy ${s.platform} address`}
                    onClick={() => { navigator.clipboard.writeText(s.url); setCopiedId(s.id); setTimeout(() => setCopiedId((c) => (c === s.id ? null : c)), 1500); }}
                    className={`${shared} flex h-10 w-10 flex-shrink-0 items-center justify-center ${img ? "rounded-xl" : "overflow-hidden rounded-full"}`} style={img ? {} : { color: baseColor, filter: profile.monochrome_icons && !profile.no_glow ? `drop-shadow(0 0 5px ${baseColor}99)` : undefined }} {...(img ? {} : handlers)}>
                    {copiedId === s.id ? <span className="text-xs font-mono">✓</span> : img ? <img src={img} alt={s.platform} className="h-full w-full max-h-10 max-w-10 rounded-lg object-contain" /> : (PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website)}
                  </button>
                );
              }
              return (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener" aria-label={s.platform}
                  className={`${shared} flex h-10 w-10 flex-shrink-0 items-center justify-center ${img ? "rounded-xl" : "overflow-hidden rounded-full"}`} style={img ? {} : { color: baseColor, filter: profile.monochrome_icons && !profile.no_glow ? `drop-shadow(0 0 5px ${baseColor}99)` : undefined }} {...(img ? {} : handlers)}>
                  {img ? <img src={img} alt={s.platform} className="h-full w-full max-h-10 max-w-10 rounded-lg object-contain" /> : (PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website)}
                </a>
              );
            })}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-8 w-full space-y-2 animate-fade-up" style={{ animationDelay: "360ms" }}>
            {links.map((l: { id: string; title: string; url: string; image_url?: string | null }) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                onClick={() => handleLinkClick(l.id)}
                className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 transition"
                style={{ ...boxStyle, backdropFilter: `blur(${blurPx}px)` }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}99`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = boxStyle.borderColor; }}>
                <div className="flex min-w-0 items-center gap-3">
                  {l.image_url && <img src={l.image_url} alt="" className="h-7 w-7 flex-shrink-0 rounded-lg object-cover" />}
                  <div className="truncate font-medium text-sm" style={{ color: textColor }}>{l.title}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 transition group-hover:translate-x-1" style={{ color: `${textColor}80` }}><path d="M7 17L17 7M8 7h9v9"/></svg>
              </a>
            ))}
          </div>
        )}

        {mp3Active && profile.show_song_bar && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2.5 pr-4 animate-fade-up"
              style={{ backdropFilter: `blur(${blurPx}px)`, animationDelay: "420ms" }}>
              <img
                src={profile.song_art_url || (avatarFailed ? defaultAvatar : (profile.avatar_url || defaultAvatar))}
                alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-left">
                <div className="max-w-[200px] truncate text-xs font-semibold text-white/90">
                  {profile.song_title || trackTitle || "now playing"}
                </div>
                {playbackFailed ? (
                  <div className="mt-0.5 text-[10px] text-white/50">can't play inline — tap to open</div>
                ) : muted && playing ? (
                  <div className="mt-0.5 text-[10px] text-white/50">tap to unmute</div>
                ) : duration > 0 ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="whitespace-nowrap text-[10px] font-mono text-white/50">{formatTime(progress)}</span>
                    <div onClick={seekAudio} className="h-1 w-28 cursor-pointer rounded-full bg-white/15">
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(100, (progress / duration) * 100)}%`, background: accent }} />
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-mono text-white/50">{formatTime(duration)}</span>
                  </div>
                ) : (
                  <div className="mt-0.5 text-[10px] text-white/50">loading…</div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                {!playbackFailed && (
                  <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }} aria-label="restart"
                    className="text-white/60 transition hover:text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M6 6h2v12H6zM20 6v12l-9-6z"/></svg>
                  </button>
                )}
                <button onClick={toggleAudio} aria-label="toggle audio" className="text-white/90 transition hover:text-white">
                  {muted && playing ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.45 2.45c.03-.2.05-.43.05-.65zM19 12c0 .94-.2 1.82-.54 2.63l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L18.73 21 20 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18z"/></svg>
                  ) : playing ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
              </div>
            </div>
        )}

        <a href="/" className="mt-6 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition">
          made with ♥ on pews · claim yours
        </a>
      </section>
    </main>
  );
}
