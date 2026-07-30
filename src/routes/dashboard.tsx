import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { Header } from "@/components/pews/Header";
import { QRCodeCard } from "@/components/pews/QRCode";
import { PLATFORM_ICONS } from "@/lib/platform-icons";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "dashboard — pews" },
      { name: "description", content: "edit your pews page, links, socials, analytics, themes, domains." },
      { property: "og:title", content: "dashboard — pews" },
      { property: "og:description", content: "edit your pews page." },
    ],
  }),
  component: Dashboard,
});

type Profile = {
  id: string; username: string; display_name: string | null; bio: string | null;
  avatar_url: string | null; background_url: string | null; accent_color: string;
  song_url: string | null; video_url: string | null; photo_url: string | null; discord_id: string | null;
  view_count: number; created_at: string;
};
type SocialLink = { id: string; platform: string; url: string; position: number };
type CustomLink = { id: string; title: string; url: string; position: number; click_count: number };
type Theme = { id: string; name: string; accent_color: string; background_url: string | null; particle_color: string | null; is_active: boolean };
type Domain = { id: string; domain: string; verification_token: string; status: string };
type ClickRow = { link_id: string; created_at: string };

const PLATFORMS = [
  "discord", "twitter", "instagram", "github", "spotify", "youtube", "tiktok", "twitch", "website",
  "facebook", "linkedin", "telegram", "reddit", "snapchat", "threads", "bluesky",
  "bitcoin", "ethereum", "wallet",
];
const CRYPTO_PLATFORMS = new Set(["bitcoin", "ethereum", "wallet"]);
const TABS = ["profile", "links", "analytics", "themes", "domain", "share"] as const;
type Tab = typeof TABS[number];

const MAX_LINKS_PER_ACCOUNT = 1;

const PRESET_THEMES = [
  { name: "crimson", accent: "#ef4444", particle: "#ef444488" },
  { name: "violet", accent: "#a855f7", particle: "#a855f788" },
  { name: "cyan", accent: "#06b6d4", particle: "#06b6d488" },
  { name: "emerald", accent: "#10b981", particle: "#10b98188" },
  { name: "amber", accent: "#f59e0b", particle: "#f59e0b88" },
  { name: "rose", accent: "#f43f5e", particle: "#f43f5e88" },
];

function Dashboard() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [saving, setSaving] = useState(false);
  const [draftTheme, setDraftTheme] = useState<{ name: string; accent: string; background: string; particle: string } | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const uid = session.user.id;
      const [p, s, l, t, d] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("social_links").select("*").eq("user_id", uid).order("position"),
        supabase.from("custom_links").select("*").eq("user_id", uid).order("position"),
        supabase.from("profile_themes").select("*").eq("user_id", uid).order("created_at"),
        supabase.from("custom_domains").select("*").eq("user_id", uid).maybeSingle(),
      ]);
      if (p.data) {
        const pr = p.data as Profile;
        setProfile(pr);
        setDraftTheme({ name: "", accent: pr.accent_color, background: pr.background_url ?? "", particle: pr.accent_color + "88" });
      }
      if (s.data) setSocials(s.data as SocialLink[]);
      if (l.data) setLinks(l.data as CustomLink[]);
      if (t.data) setThemes(t.data as Theme[]);
      if (d.data) setDomain(d.data as Domain);
    })();
  }, [session]);

  useEffect(() => {
    if (!session || tab !== "analytics" || links.length === 0) return;
    (async () => {
      const linkIds = links.map((l) => l.id);
      const since = range === "all" ? new Date(0)
        : new Date(Date.now() - ({ "24h": 1, "7d": 7, "30d": 30 }[range]) * 86400000);
      const { data } = await supabase
        .from("link_clicks")
        .select("link_id, created_at")
        .in("link_id", linkIds)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      setClicks((data ?? []) as ClickRow[]);
    })();
  }, [tab, range, links, session]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: profile.username, display_name: profile.display_name, bio: profile.bio,
      avatar_url: profile.avatar_url, background_url: profile.background_url, accent_color: profile.accent_color,
      song_url: profile.song_url, video_url: profile.video_url, photo_url: profile.photo_url,
      discord_id: profile.discord_id,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("saved!");
  }

  async function addSocial() {
    if (!session) return;
    const { data, error } = await supabase.from("social_links").insert({
      user_id: session.user.id, platform: "twitter", url: "", position: socials.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setSocials([...socials, data as SocialLink]);
  }
  async function updateSocial(id: string, patch: Partial<SocialLink>) {
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await supabase.from("social_links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function deleteSocial(id: string) {
    setSocials((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("social_links").delete().eq("id", id);
  }
  async function addLink() {
    if (!session) return;
    if (links.length >= MAX_LINKS_PER_ACCOUNT) {
      return toast.error(`each account gets ${MAX_LINKS_PER_ACCOUNT} link — delete your existing one to add a different link`);
    }
    const { data, error } = await supabase.from("custom_links").insert({
      user_id: session.user.id, title: "new link", url: "https://", position: links.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setLinks([...links, data as CustomLink]);
  }
  async function updateLink(id: string, patch: Partial<CustomLink>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const { error } = await supabase.from("custom_links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function deleteLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("custom_links").delete().eq("id", id);
  }
  async function moveLink(id: string, dir: -1 | 1) {
    const idx = links.findIndex((l) => l.id === id);
    const j = idx + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[idx], next[j]] = [next[j], next[idx]];
    const withPos = next.map((l, i) => ({ ...l, position: i }));
    setLinks(withPos);
    await Promise.all(withPos.map((l) => supabase.from("custom_links").update({ position: l.position }).eq("id", l.id)));
  }

  async function saveTheme(name: string, accent: string, background: string | null, particle: string | null) {
    if (!session) return;
    const { data, error } = await supabase.from("profile_themes").insert({
      user_id: session.user.id, name, accent_color: accent, background_url: background, particle_color: particle,
    }).select().single();
    if (error) return toast.error(error.message);
    setThemes([...themes, data as Theme]);
    toast.success(`theme "${name}" saved`);
  }
  async function applyTheme(t: Theme) {
    if (!profile) return;
    setProfile({ ...profile, accent_color: t.accent_color, background_url: t.background_url ?? profile.background_url });
    await supabase.from("profiles").update({ accent_color: t.accent_color, background_url: t.background_url }).eq("id", profile.id);
    await supabase.from("profile_themes").update({ is_active: false }).eq("user_id", profile.id);
    await supabase.from("profile_themes").update({ is_active: true }).eq("id", t.id);
    setThemes((prev) => prev.map((x) => ({ ...x, is_active: x.id === t.id })));
    toast.success(`applied "${t.name}"`);
  }
  async function deleteTheme(id: string) {
    setThemes((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("profile_themes").delete().eq("id", id);
  }

  async function connectDomain(d: string) {
    if (!session) return;
    const clean = d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
      return toast.error("enter a valid domain (e.g. mysite.com)");
    }
    if (domain) {
      await supabase.from("custom_domains").delete().eq("id", domain.id);
    }
    const { data, error } = await supabase.from("custom_domains").insert({
      user_id: session.user.id, domain: clean,
    }).select().single();
    if (error) return toast.error(error.message);
    setDomain(data as Domain);
    toast.success("domain added — configure DNS to verify");
  }
  async function removeDomain() {
    if (!domain) return;
    await supabase.from("custom_domains").delete().eq("id", domain.id);
    setDomain(null);
    toast.success("domain removed");
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">loading…</div>
      </main>
    );
  }

  const totalClicks = links.reduce((a, b) => a + b.click_count, 0);
  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : "https://pews.lol"}/u/${profile.username}`;

  return (
    <main className="relative min-h-screen font-sans pb-20">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />
      <Header />
      <section className="mx-auto max-w-4xl px-4 pt-24">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">your page</h1>
            <div className="text-sm text-muted-foreground mt-1">
              live at{" "}
              <Link to="/u/$username" params={{ username: profile.username }} className="text-primary hover:underline font-mono">
                pews.lol/u/{profile.username}
              </Link>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
            {saving ? "saving…" : "save"}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="views" value={profile.view_count.toLocaleString()} />
          <Stat label="clicks" value={totalClicks.toLocaleString()} />
          <Stat label="since" value={new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" })} />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${tab === t ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_var(--color-primary)] scale-105" : "text-muted-foreground hover:text-foreground hover:bg-background/40"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <Card title="profile">
            <Field label="username">
              <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="input" />
            </Field>
            <Field label="display name">
              <input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="input" />
            </Field>
            <Field label="bio">
              <textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="input resize-none" />
            </Field>
            <Field label="avatar url">
              <input value={profile.avatar_url ?? ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} className="input" placeholder="https://..." />
            </Field>
            <Field label="background image url">
              <input value={profile.background_url ?? ""} onChange={(e) => setProfile({ ...profile, background_url: e.target.value })} className="input" placeholder="https://..." />
            </Field>
            <Field label="showcase photo url">
              <input value={profile.photo_url ?? ""} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} className="input" placeholder="https://..." />
              <div className="mt-1 text-[11px] text-muted-foreground">an extra photo shown on your page, separate from your avatar</div>
            </Field>
            <Field label="song">
              <input value={profile.song_url ?? ""} onChange={(e) => setProfile({ ...profile, song_url: e.target.value })} className="input" placeholder="spotify, soundcloud, apple music, or a direct .mp3 link" />
              <div className="mt-1 text-[11px] text-muted-foreground">paste a spotify/soundcloud/apple music track link, or a direct audio file url</div>
            </Field>
            <Field label="video">
              <input value={profile.video_url ?? ""} onChange={(e) => setProfile({ ...profile, video_url: e.target.value })} className="input" placeholder="youtube, vimeo, or a direct .mp4 link" />
              <div className="mt-1 text-[11px] text-muted-foreground">paste a youtube/vimeo link, or a direct video file url</div>
            </Field>
            <Field label="discord presence">
              <input value={profile.discord_id ?? ""} onChange={(e) => setProfile({ ...profile, discord_id: e.target.value })} className="input" placeholder="your discord user id" />
              <div className="mt-1 text-[11px] text-muted-foreground">
                shows your live discord status on your page. get your ID: discord settings → advanced → enable developer mode, then right-click your profile → copy user ID.
                you also need to <a href="https://discord.com/invite/lanyard" target="_blank" rel="noreferrer" className="underline text-primary">join this server</a> once so your presence can be tracked — it's a free public service, no bot setup needed.
              </div>
            </Field>
            <Field label="accent color">
              <div className="flex items-center gap-2">
                <input type="color" value={profile.accent_color} onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })} className="h-9 w-14 rounded-lg border border-border bg-transparent" />
                <input value={profile.accent_color} onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })} className="input flex-1" />
              </div>
            </Field>
          </Card>
        )}

        {tab === "links" && (
          <>
            <Card title="socials" action={<button onClick={addSocial} className="btn-sm">+ add</button>}>
              {socials.length === 0 && <Empty>no socials yet.</Empty>}
              {socials.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background/30 px-2">
                    <span className="text-muted-foreground flex-shrink-0">{PLATFORM_ICONS[s.platform] ?? PLATFORM_ICONS.website}</span>
                    <select
                      value={s.platform}
                      onChange={(e) => updateSocial(s.id, { platform: e.target.value })}
                      className="w-32 bg-transparent py-2 text-sm outline-none appearance-none">
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p} className="bg-background text-foreground">{p}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={s.url}
                    onChange={(e) => updateSocial(s.id, { url: e.target.value })}
                    placeholder={CRYPTO_PLATFORMS.has(s.platform) ? "wallet address" : "https://..."}
                    className="input flex-1" />
                  <button onClick={() => deleteSocial(s.id)} className="btn-sm-ghost">×</button>
                </div>
              ))}
            </Card>
            <Card title="links" action={
              <button onClick={addLink} disabled={links.length >= MAX_LINKS_PER_ACCOUNT}
                className="btn-sm disabled:opacity-30 disabled:pointer-events-none">+ add</button>
            }>
              {links.length === 0 && <Empty>no links yet.</Empty>}
              {links.length >= MAX_LINKS_PER_ACCOUNT && (
                <div className="text-[11px] text-muted-foreground">each account gets {MAX_LINKS_PER_ACCOUNT} link. delete it to add a different one.</div>
              )}
              {links.map((l, i) => (
                <div key={l.id} className="rounded-xl border border-border bg-background/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={l.title} onChange={(e) => updateLink(l.id, { title: e.target.value })} placeholder="title" className="input flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{l.click_count} clicks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} placeholder="https://..." className="input flex-1" />
                    <button onClick={() => moveLink(l.id, -1)} disabled={i === 0} className="btn-sm-ghost disabled:opacity-30">↑</button>
                    <button onClick={() => moveLink(l.id, 1)} disabled={i === links.length - 1} className="btn-sm-ghost disabled:opacity-30">↓</button>
                    <button onClick={() => deleteLink(l.id)} className="btn-sm-ghost">×</button>
                  </div>
                  <UtmBuilder link={l} />
                </div>
              ))}
            </Card>
          </>
        )}

        {tab === "analytics" && (
          <Analytics links={links} clicks={clicks} range={range} setRange={setRange} views={profile.view_count} />
        )}

        {tab === "themes" && draftTheme && (
          <ThemeEditor
            draft={draftTheme}
            setDraft={setDraftTheme}
            themes={themes}
            onSaveDraft={() => {
              if (!draftTheme.name.trim()) return toast.error("give this variation a name first");
              saveTheme(draftTheme.name.trim(), draftTheme.accent, draftTheme.background || null, draftTheme.particle);
              setDraftTheme({ ...draftTheme, name: "" });
            }}
            onPickPreset={(p) => setDraftTheme({ name: p.name, accent: p.accent, background: draftTheme.background, particle: p.particle })}
            onApply={applyTheme}
            onDelete={deleteTheme}
          />
        )}

        {tab === "domain" && (
          <DomainPanel domain={domain} onConnect={connectDomain} onRemove={removeDomain} />
        )}

        {tab === "share" && (
          <Card title="share your page">
            <QRCodeCard url={profileUrl} accent={profile.accent_color} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => { navigator.clipboard.writeText(profileUrl); toast.success("link copied"); }}
                className="rounded-xl border border-border bg-background/40 p-3 text-sm hover:border-primary">📋 copy link</button>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`check out my pews page: ${profileUrl}`)}`} target="_blank" rel="noreferrer"
                className="rounded-xl border border-border bg-background/40 p-3 text-sm hover:border-primary text-center">🐦 share on X</a>
            </div>
          </Card>
        )}
      </section>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: oklch(1 0 0 / 0.03); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; color: var(--color-foreground); }
        .input:focus { border-color: var(--color-primary); }
        .btn-sm { border-radius: 0.5rem; background: oklch(0.65 0.28 15 / 0.15); border: 1px solid oklch(0.65 0.28 15 / 0.3); color: var(--color-primary); padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 500; }
        .btn-sm:hover { background: oklch(0.65 0.28 15 / 0.25); }
        .btn-sm-ghost { border-radius: 0.5rem; border: 1px solid var(--color-border); padding: 0.25rem 0.6rem; font-size: 0.75rem; color: var(--color-muted-foreground); }
        .btn-sm-ghost:hover { color: var(--color-foreground); }
      `}</style>
    </main>
  );
}

function Analytics({ links, clicks, range, setRange, views }: {
  links: CustomLink[]; clicks: ClickRow[]; range: "24h" | "7d" | "30d" | "all"; setRange: (r: "24h" | "7d" | "30d" | "all") => void; views: number;
}) {
  const perLink = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clicks) map.set(c.link_id, (map.get(c.link_id) ?? 0) + 1);
    return links.map((l) => ({ ...l, range_clicks: map.get(l.id) ?? 0 }))
      .sort((a, b) => b.range_clicks - a.range_clicks);
  }, [links, clicks]);
  const total = clicks.length;
  const ctr = views > 0 ? ((total / views) * 100).toFixed(1) : "0.0";
  const buckets = useMemo(() => {
    const n = range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : 30;
    const unit = range === "24h" ? 3600000 : 86400000;
    const now = Date.now();
    const arr = Array.from({ length: n }, () => 0);
    for (const c of clicks) {
      const t = new Date(c.created_at).getTime();
      const idx = n - 1 - Math.floor((now - t) / unit);
      if (idx >= 0 && idx < n) arr[idx]++;
    }
    return arr;
  }, [clicks, range]);
  const max = Math.max(1, ...buckets);

  return (
    <>
      <div className="mt-6 flex gap-1 rounded-xl border border-border bg-card/40 p-1 w-fit">
        {(["24h", "7d", "30d", "all"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label={`clicks · ${range}`} value={total.toLocaleString()} />
        <Stat label="ctr" value={`${ctr}%`} />
        <Stat label="unique links" value={new Set(clicks.map((c) => c.link_id)).size.toString()} />
      </div>

      <Card title={`clicks over time · ${range}`}>
        <div className="flex items-end gap-1 h-32">
          {buckets.map((v, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition"
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? "4px" : "1px" }}
              title={`${v} clicks`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>{range === "24h" ? "24h ago" : range === "7d" ? "7d ago" : range === "30d" ? "30d ago" : "start"}</span>
          <span>now</span>
        </div>
      </Card>

      <Card title="per-link performance">
        {perLink.length === 0 && <Empty>no links yet.</Empty>}
        {perLink.map((l) => {
          const rate = views > 0 ? ((l.range_clicks / views) * 100).toFixed(1) : "0.0";
          const pct = (l.range_clicks / Math.max(1, perLink[0].range_clicks)) * 100;
          return (
            <div key={l.id} className="rounded-xl border border-border bg-background/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm truncate flex-1">{l.title}</div>
                <div className="text-[10px] font-mono text-muted-foreground ml-3 whitespace-nowrap">
                  {l.range_clicks} clicks · {rate}% ctr · {l.click_count} all-time
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}

function DomainPanel({ domain, onConnect, onRemove }: { domain: Domain | null; onConnect: (d: string) => void; onRemove: () => void }) {
  const [input, setInput] = useState("");
  return (
    <Card title="custom domain">
      {!domain ? (
        <>
          <div className="text-sm text-muted-foreground">
            point your own domain at your pews page. e.g. <span className="font-mono text-foreground">mysite.com</span>
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="mysite.com" className="input flex-1" />
            <button onClick={() => { onConnect(input); setInput(""); }} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">connect</button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-lg">{domain.domain}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-widest">
                status: <span className={domain.status === "verified" ? "text-emerald-400" : "text-amber-400"}>{domain.status}</span>
              </div>
            </div>
            <button onClick={onRemove} className="btn-sm-ghost">remove</button>
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">dns setup</div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">1. add this TXT record to verify ownership:</div>
              <div className="rounded-lg bg-background p-3 font-mono text-xs space-y-1">
                <div><span className="text-muted-foreground">host:</span> _pews-verify.{domain.domain}</div>
                <div><span className="text-muted-foreground">value:</span> {domain.verification_token}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">2. add these A / CNAME records to route traffic:</div>
              <div className="rounded-lg bg-background p-3 font-mono text-xs space-y-1">
                <div><span className="text-muted-foreground">type:</span> CNAME</div>
                <div><span className="text-muted-foreground">host:</span> @ (or www)</div>
                <div><span className="text-muted-foreground">value:</span> pews.lol</div>
              </div>
            </div>
            <div className="text-[11px] text-amber-400/90 border-l-2 border-amber-400/60 pl-3">
              heads up · full end-to-end DNS + SSL provisioning for arbitrary user domains isn't automated on this deployment yet. your domain is stored and DNS instructions are ready — final activation requires the pews platform to add your domain to its hosting cert pool. this UI works today; the plumbing to auto-serve your domain is a hosting-side task.
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="hud-corners mt-6 animate-fade-up rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5 transition duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_var(--color-primary)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          {title}
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4 text-center">
      <div className="font-display text-2xl font-bold text-gradient">{value}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
type DraftTheme = { name: string; accent: string; background: string; particle: string };

function ThemeEditor({ draft, setDraft, themes, onSaveDraft, onPickPreset, onApply, onDelete }: {
  draft: DraftTheme;
  setDraft: (d: DraftTheme) => void;
  themes: Theme[];
  onSaveDraft: () => void;
  onPickPreset: (p: { name: string; accent: string; particle: string }) => void;
  onApply: (t: Theme) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Card title="theme editor">
        <Field label="variation name">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. midnight launch" className="input" />
        </Field>
        <Field label="accent color">
          <div className="flex items-center gap-2">
            <input type="color" value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
              className="h-9 w-14 rounded-lg border border-border bg-transparent" />
            <input value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} className="input flex-1" />
          </div>
        </Field>
        <Field label="particle color">
          <div className="flex items-center gap-2">
            <input type="color" value={draft.particle.slice(0, 7)} onChange={(e) => setDraft({ ...draft, particle: e.target.value + "88" })}
              className="h-9 w-14 rounded-lg border border-border bg-transparent" />
            <input value={draft.particle} onChange={(e) => setDraft({ ...draft, particle: e.target.value })} className="input flex-1" placeholder="#rrggbbaa" />
          </div>
        </Field>
        <Field label="background image url">
          <input value={draft.background} onChange={(e) => setDraft({ ...draft, background: e.target.value })}
            placeholder="https://..." className="input" />
        </Field>

        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">quick presets</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {PRESET_THEMES.map((p) => (
              <button key={p.name} onClick={() => onPickPreset(p)}
                className="rounded-xl border border-border p-3 hover:border-primary text-xs font-mono transition flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full" style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onSaveDraft} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition w-full">
          save as new variation
        </button>
      </Card>

      <div className="space-y-4">
        <Card title="live preview">
          <ThemePreview accent={draft.accent} particle={draft.particle} background={draft.background} />
        </Card>

        <Card title="saved variations">
          {themes.length === 0 && <Empty>no saved variations yet — tune the editor and save one above.</Empty>}
          <div className="space-y-2">
            {themes.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl border p-3 ${t.is_active ? "border-primary bg-primary/5" : "border-border bg-background/30"}`}>
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: t.accent_color, boxShadow: `0 0 12px ${t.accent_color}` }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{t.name} {t.is_active && <span className="text-primary text-[10px]">· active</span>}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{t.accent_color}{t.background_url ? " · custom bg" : ""}</div>
                </div>
                {!t.is_active && <button onClick={() => onApply(t)} className="btn-sm">apply</button>}
                <button onClick={() => onDelete(t.id)} className="btn-sm-ghost">×</button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ThemePreview({ accent, particle, background }: { accent: string; particle: string; background: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 6,
      duration: 5 + Math.random() * 6, size: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 60,
    })), []);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border">
      <div className="absolute inset-0">
        {background ? (
          <img src={background} alt="" className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="h-full w-full bg-background" />
        )}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, oklch(0.08 0.01 300 / 0.85) 70%, oklch(0.05 0.01 300) 100%)" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span key={p.id} className="absolute rounded-full animate-float"
            style={{
              left: `${p.left}%`, bottom: "-10px", width: p.size, height: p.size,
              background: particle, boxShadow: `0 0 6px ${particle}`,
              animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
              ["--drift" as string]: `${p.drift}px`,
            } as React.CSSProperties} />
        ))}
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-16 h-16 rounded-full border-2" style={{ borderColor: `${accent}99`, boxShadow: `0 0 30px ${accent}80` }} />
        <div className="font-display text-lg font-bold" style={{ color: accent }}>@yourname</div>
        <div className="w-full max-w-[200px] rounded-xl border border-border bg-background/40 px-3 py-2 text-xs" style={{ borderColor: `${accent}66` }}>
          sample link
        </div>
      </div>
    </div>
  );
}

function UtmBuilder({ link }: { link: CustomLink }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");

  const shareUrl = useMemo(() => {
    if (!link.url || link.url === "https://") return "";
    let base: URL;
    try { base = new URL(link.url); } catch { return ""; }
    if (source) base.searchParams.set("utm_source", source);
    if (medium) base.searchParams.set("utm_medium", medium);
    if (campaign) base.searchParams.set("utm_campaign", campaign);
    return base.toString();
  }, [link.url, source, medium, campaign]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-sm-ghost w-full text-center">
        🔗 generate campaign share link
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">utm parameters</div>
      <div className="grid grid-cols-3 gap-2">
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="source (e.g. instagram)" className="input text-xs" />
        <input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="medium (e.g. bio)" className="input text-xs" />
        <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campaign (e.g. launch)" className="input text-xs" />
      </div>
      {shareUrl ? (
        <div className="flex items-center gap-2">
          <input readOnly value={shareUrl} className="input flex-1 text-xs" onFocus={(e) => e.target.select()} />
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("campaign link copied"); }}
            className="btn-sm whitespace-nowrap">copy</button>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">set a valid link url above to generate a share link.</div>
      )}
      <button onClick={() => setOpen(false)} className="btn-sm-ghost">close</button>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground text-center py-4">{children}</div>;
}
