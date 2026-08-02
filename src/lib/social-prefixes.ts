export const SOCIAL_URL_PREFIX: Record<string, string> = {
  twitter: "https://x.com/",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  twitch: "https://twitch.tv/",
  facebook: "https://facebook.com/",
  linkedin: "https://linkedin.com/in/",
  telegram: "https://t.me/",
  reddit: "https://reddit.com/user/",
  snapchat: "https://snapchat.com/add/",
  threads: "https://threads.net/@",
  bluesky: "https://bsky.app/profile/",
  soundcloud: "https://soundcloud.com/",
  paypal: "https://paypal.me/",
  cashapp: "https://cash.app/$",
  venmo: "https://venmo.com/u/",
  vk: "https://vk.com/",
  pinterest: "https://pinterest.com/",
  lastfm: "https://last.fm/user/",
  patreon: "https://patreon.com/",
  gitlab: "https://gitlab.com/",
  github: "https://github.com/",
  kofi: "https://ko-fi.com/",
  spotify: "https://open.spotify.com/user/",
  xbox: "https://account.xbox.com/en-us/profile?gamertag=",
  playstation: "https://psnprofiles.com/",
  applemusic: "https://music.apple.com/profile/",
  email: "mailto:",
};

/** Platforms intentionally left out: discord (invite links vary), website (arbitrary url),
 *  email (mailto: handled separately), playstation/xbox/applemusic (no stable public profile prefix),
 *  bitcoin/ethereum/litecoin/monero/wallet (these are addresses, not urls). */

export function stripPrefix(platform: string, url: string): string {
  const prefix = SOCIAL_URL_PREFIX[platform];
  if (!prefix) return url;
  return url.startsWith(prefix) ? url.slice(prefix.length) : url;
}

export function applyPrefix(platform: string, handle: string): string {
  const prefix = SOCIAL_URL_PREFIX[platform];
  if (!prefix) return handle;
  const clean = handle.replace(/^@/, "").trim();
  return clean ? prefix + clean : "";
}
