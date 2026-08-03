import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/pews/Header";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "donate — pews" },
      { name: "description", content: "support pews with a donation." },
      { property: "og:title", content: "donate — pews" },
      { property: "og:description", content: "support pews with a donation." },
    ],
  }),
  component: Donate,
});

const PAYPAL_USERNAME = "OwenKilgore";
const PRESET_AMOUNTS = [1, 5, 10, 20];

function Donate() {
  const [custom, setCustom] = useState("");

  function paypalUrl(amount: number | string) {
    return `https://paypal.me/${PAYPAL_USERNAME}/${amount}`;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden font-sans pb-20">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />
      <Header />
      <section className="mx-auto max-w-lg px-4 pt-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">support pews</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          pews is free to use. if you'd like to help keep it running, any amount helps a lot.
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((amt) => (
            <a key={amt} href={paypalUrl(amt)} target="_blank" rel="noreferrer noopener"
              className="hud-corners rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5 transition duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--color-primary)]">
              <div className="font-display text-2xl font-bold text-gradient">${amt}</div>
            </a>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-5">
          <div className="mb-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">or choose your own amount</div>
          <div className="flex gap-2">
            <div className="input flex flex-1 items-center gap-1 pl-3">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={1}
                step={1}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="amount"
                className="w-full flex-1 bg-transparent py-2 pl-1 text-sm outline-none"
              />
            </div>
            <a
              href={custom && Number(custom) > 0 ? paypalUrl(custom) : undefined}
              target="_blank" rel="noreferrer noopener"
              aria-disabled={!custom || Number(custom) <= 0}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${custom && Number(custom) > 0 ? "bg-primary text-primary-foreground hover:bg-primary/90" : "pointer-events-none bg-primary/30 text-primary-foreground/50"}`}
            >
              donate
            </a>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          you'll be taken to PayPal to complete your donation.
        </div>

        <Link to="/" className="mt-8 inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
          ← back home
        </Link>
      </section>
    </main>
  );
}
