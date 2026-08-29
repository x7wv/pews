import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/pews/Header";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "updates — pews" },
      { name: "description", content: "what's new on pews." },
      { property: "og:title", content: "updates — pews" },
      { property: "og:description", content: "what's new on pews." },
    ],
  }),
  component: Updates,
});

type Entry = { date: string; items: string[] };

const LOG: Entry[] = [
  {
    date: "August 29, 2026",
    items: [
      "guided setup wizard for new accounts — pick a starting template, add your name and bio",
      "template gallery — restyle your page anytime with a few preset looks",
      "demo profile — see what pews looks like before signing up",
      "import your links straight from Linktree or Beacons",
      "report button on every profile, feeding a real admin review queue",
      "seasonal site-wide themes (snow, hearts, confetti) staff can toggle on/off",
      "public status page with live health checks and incident history",
      "shared/organization profiles — invite collaborators to co-manage a page",
      "login streak counter",
      "content warning gate for sensitive profiles",
      "premium: crossfade between up to 3 background tracks instead of just one song",
    ],
  },
  {
    date: "August 27, 2026",
    items: [
      "light/dark mode toggle (dark by default)",
      "preview mode — see exactly what visitors see, separate from the editor",
      "undo — revert to your previous save if something goes wrong",
      "clone your style as a template for another account",
      "top-views leaderboard",
      "cleaned up leftover emoji icons across the site",
    ],
  },
  {
    date: "August 2, 2026",
    items: [
      "fixed the volume slider — dragging it now actually fades the volume up and down instead of jumping straight to muted",
      "email links now properly open your mail app instead of doing nothing",
      "old avatar/background/video/cursor/song files get cleaned up automatically now when you replace them",
      "redesigned the dashboard with a sidebar and a live preview for icon colors",
      "added a verified checkmark badge",
      "swapped in real logos for apple music, bitcoin, fansly, onlyfans, paypal, playstation, reddit, snapchat, soundcloud, threads, venmo, and xbox",
      "removed the showcase photo field",
      "premium: custom links (up to 5), badge, hide branding, custom fonts/favicon, typewriter and gradient text, parallax tilt, video avatars, password-protected pages, and live visitor counts",
    ],
  },
  {
    date: "August 1, 2026",
    items: [
      "fixed email verification codes",
      "set up proper email delivery for signup verification",
    ],
  },
  {
    date: "July 30–31, 2026",
    items: [
      "custom cursor upload",
      "12 fonts for your display name and bio",
      "themes — save and re-apply color and background combos",
      "analytics dashboard with click tracking and a UTM campaign link builder",
      "custom domain support (DNS setup UI — full auto-provisioning still in progress)",
      "admin tools for banning/unbanning accounts",
      "usernames are now properly unique (case-insensitive)",
    ],
  },
  {
    date: "July 28–29, 2026",
    items: [
      "pews is live — profile pages, social links, a custom link, Discord presence, background music/video, and sign in with email or Google",
    ],
  },
];

function Updates() {
  return (
    <main className="relative min-h-screen overflow-x-hidden font-sans pb-20">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />
      <Header />
      <section className="mx-auto max-w-2xl px-4 pt-24">
        <h1 className="font-display text-3xl font-bold">updates</h1>
        <div className="mt-1 text-sm text-muted-foreground">what's new on pews</div>

        <div className="mt-8 space-y-8">
          {LOG.map((entry) => (
            <div key={entry.date} className="hud-corners rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5">
              <div className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">{entry.date}</div>
              <ul className="space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Link to="/" className="mt-8 inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
          ← back home
        </Link>
      </section>
    </main>
  );
}
