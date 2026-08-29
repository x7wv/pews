import { useState } from "react";
import { toast } from "sonner";
import { importLinksFromUrl } from "@/lib/import-links.server";

type Candidate = { title: string; url: string; selected: boolean; platform: string | null };

const DOMAIN_TO_PLATFORM: Record<string, string> = {
  "x.com": "twitter", "twitter.com": "twitter",
  "instagram.com": "instagram", "tiktok.com": "tiktok", "youtube.com": "youtube",
  "twitch.tv": "twitch", "facebook.com": "facebook", "linkedin.com": "linkedin",
  "t.me": "telegram", "reddit.com": "reddit", "snapchat.com": "snapchat",
  "threads.net": "threads", "bsky.app": "bluesky", "soundcloud.com": "soundcloud",
  "paypal.me": "paypal", "cash.app": "cashapp", "venmo.com": "venmo",
  "vk.com": "vk", "pinterest.com": "pinterest", "last.fm": "lastfm",
  "patreon.com": "patreon", "gitlab.com": "gitlab", "github.com": "github",
  "ko-fi.com": "kofi", "open.spotify.com": "spotify", "discord.gg": "discord", "discord.com": "discord",
};

function detectPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return DOMAIN_TO_PLATFORM[host] || null;
  } catch {
    return null;
  }
}

export function LinkImporter({ onImportSocial, onImportCustom, existingSocialPlatforms, canAddCustomLink }: {
  onImportSocial: (platform: string, url: string) => void;
  onImportCustom: (title: string, url: string) => void;
  existingSocialPlatforms: string[];
  canAddCustomLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchLinks() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setCandidates(null);
    const result = await importLinksFromUrl({ data: { url: url.trim() } });
    setLoading(false);
    if ("error" in result) {
      setError(result.error ?? "something went wrong.");
      return;
    }
    setCandidates(result.links.map((l) => ({ ...l, selected: true, platform: detectPlatform(l.url) })));
  }

  function applySelected() {
    if (!candidates) return;
    let customAdded = 0;
    for (const c of candidates) {
      if (!c.selected) continue;
      if (c.platform && !existingSocialPlatforms.includes(c.platform)) {
        onImportSocial(c.platform, c.url);
      } else if (!c.platform && canAddCustomLink && customAdded === 0) {
        onImportCustom(c.title, c.url);
        customAdded++;
      }
    }
    toast.success("imported! double check everything looks right.");
    setCandidates(null);
    setUrl("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-sm-ghost mb-2 inline-flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
        import from Linktree or Beacons
      </button>
    );
  }

  return (
    <div className="hud-corners mt-6 animate-fade-up rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5">
      <div className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
        import links
      </div>
      <div className="space-y-3">
        <div className="text-[11px] text-muted-foreground">
          paste your Linktree or Beacons page URL — we'll try to pull your links out automatically. recognized platforms become socials; anything else fills your one custom link slot.
        </div>
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://linktr.ee/yourname" className="input flex-1" />
          <button onClick={fetchLinks} disabled={loading} className="btn-sm disabled:opacity-50">{loading ? "fetching…" : "fetch"}</button>
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
        {candidates && (
          <>
            <div className="space-y-1.5">
              {candidates.map((c, i) => (
                <label key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background/30 px-3 py-2 text-xs">
                  <input type="checkbox" checked={c.selected} onChange={(e) => setCandidates((prev) => prev!.map((x, xi) => (xi === i ? { ...x, selected: e.target.checked } : x)))} />
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="flex-shrink-0 text-muted-foreground">{c.platform ? `→ ${c.platform}` : "→ custom link"}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCandidates(null); setOpen(false); }} className="btn-sm-ghost flex-1 text-center">cancel</button>
              <button onClick={applySelected} className="btn-sm flex-1 text-center">add selected</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
