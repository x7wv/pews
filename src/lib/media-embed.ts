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

export function videoEmbedUrl(url: string): { type: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      else if (u.searchParams.get("v")) id = u.searchParams.get("v") as string;
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.replace("/embed/", "");
      if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|mov)$/i.test(u.pathname)) {
      return { type: "video", src: url };
    }
    return { type: "video", src: url };
  } catch {
    return null;
  }
}
