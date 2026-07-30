import { useEffect, useState } from "react";

export type LanyardPresence = {
  found: boolean;
  discord_user?: { id: string; username: string; global_name: string | null; avatar: string | null; discriminator: string };
  discord_status?: "online" | "idle" | "dnd" | "offline";
  activities?: { type: number; name: string; details?: string; state?: string }[];
  listening_to_spotify?: boolean;
  spotify?: { song: string; artist: string; album_art_url: string } | null;
};

export function useLanyard(discordId: string | null | undefined) {
  const [presence, setPresence] = useState<LanyardPresence | null>(null);
  const [loading, setLoading] = useState(!!discordId);

  useEffect(() => {
    if (!discordId) { setPresence(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    async function fetchPresence() {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setPresence({
            found: true,
            discord_user: json.data.discord_user,
            discord_status: json.data.discord_status,
            activities: json.data.activities,
            listening_to_spotify: json.data.listening_to_spotify,
            spotify: json.data.spotify,
          });
        } else {
          setPresence({ found: false });
        }
      } catch {
        if (!cancelled) setPresence({ found: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPresence();
    const interval = setInterval(fetchPresence, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [discordId]);

  return { presence, loading };
}

export function discordAvatarUrl(user: { id: string; avatar: string | null }, size = 128) {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) % 5n)}.png`;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
}

export const STATUS_COLORS: Record<string, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f42",
  offline: "#80848e",
};
