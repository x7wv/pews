import { createFileRoute } from "@tanstack/react-router";
import { PublicProfile } from "@/routes/u.$username";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "demo — pews" },
      { name: "description", content: "see what a pews.lol profile looks like." },
    ],
  }),
  component: Demo,
});

const DEMO_PROFILE = {
  id: "demo",
  username: "yourname",
  display_name: "your name here",
  bio: "this is what your bio looks like — short, punchy, all yours.",
  avatar_url: null,
  background_url: null,
  video_url: null,
  accent_color: "#8b5cf6",
  background_color: "#0a0a0f",
  text_color: "#ffffff",
  icon_color: "#ffffff",
  profile_opacity: 60,
  profile_blur: 20,
  monochrome_icons: false,
  swap_box_colors: false,
  cursor_url: null,
  font: "Space Grotesk",
  entry_message: null,
  entry_font: "Space Grotesk",
  no_glow: false,
  audio_source: "mp3",
  song_url: null,
  song_title: null,
  song_art_url: null,
  show_volume_control: true,
  show_song_bar: true,
  view_count: 1284,
  created_at: new Date().toISOString(),
  uid: 1,
  discord_id: null,
  is_banned: false,
  is_verified: true,
  is_premium: true,
  premium_badge_enabled: true,
  hide_branding: false,
  custom_font_url: null,
  custom_favicon_url: null,
  typewriter_name: false,
  typewriter_bio: false,
  parallax_tilt: true,
  layout_style: "default",
  gradient_name: true,
  avatar_video_url: null,
  cursor_trail: true,
  password_protected: false,
  content_warning: false,
  content_warning_text: null,
  song_urls: [],
};

const DEMO_SOCIALS = [
  { id: "1", platform: "discord", url: "https://discord.gg/example", position: 0 },
  { id: "2", platform: "twitter", url: "https://twitter.com/example", position: 1 },
  { id: "3", platform: "instagram", url: "https://instagram.com/example", position: 2 },
  { id: "4", platform: "spotify", url: "https://open.spotify.com/user/example", position: 3 },
];

const DEMO_LINKS = [
  { id: "1", title: "my other projects", url: "https://example.com", position: 0, click_count: 42, image_url: null },
];

function Demo() {
  return <PublicProfile profile={DEMO_PROFILE} socials={DEMO_SOCIALS} links={DEMO_LINKS} previewMode />;
}
