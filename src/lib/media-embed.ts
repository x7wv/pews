export function songEmbedUrl(url: string): { type: "iframe" | "audio"; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("open.spotify.com")) {
      const path = u.pathname.replace(/^\/(intl-[a-z]+\/)?/, "/");
      return { type: "iframe", src: `https://open.spotify.com/embed${path}` };
    }
    if (u.hostname.includes("soundcloud.com")) {
      return { type: "iframe", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%233b82f6&auto_play=false&show_teaser=false` };
    }
    if (u.hostname.includes("music.apple.com")) {
      return { type: "iframe", src: url.replace("music.apple.com", "embed.music.apple.com") };
    }
    if (/\.(mp3|wav|ogg|m4a)$/i.test(u.pathname)) {
      return { type: "audio", src: url };
    }
    return { type: "audio", src: url };
  } catch {
    return null;
  }
}

export function videoEmbedUrl(url: string): { src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/\.mp4$/i.test(u.pathname)) return { src: url };
    return null;
  } catch {
    return null;
  }
}

export async function fetchTrackTitle(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (u.hostname.includes("open.spotify.com")) {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.title ?? null;
    }
    if (u.hostname.includes("soundcloud.com")) {
      const res = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.title ?? null;
    }
    if (/\.(mp3|wav|ogg|m4a)$/i.test(u.pathname)) {
      const name = u.pathname.split("/").pop() ?? "";
      return decodeURIComponent(name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")) || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
