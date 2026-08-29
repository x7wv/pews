import { useState } from "react";
import { PROFILE_TEMPLATES, type ProfileTemplate } from "@/lib/templates";

export function OnboardingWizard({ username, onComplete }: {
  username: string;
  onComplete: (data: { template: ProfileTemplate | null; display_name: string; bio: string }) => void;
}) {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<ProfileTemplate | null>(PROFILE_TEMPLATES[0]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "radial-gradient(ellipse 800px 500px at 50% -10%, oklch(0.62 0.19 250 / 12%), transparent 70%)" }} />

      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6">
        <div className="mb-6 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 className="font-display text-2xl font-bold">welcome to pews, @{username}</h1>
            <div className="mt-1 text-sm text-muted-foreground">let's set up your page. pick a starting look — you can change everything later.</div>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PROFILE_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t)}
                  className={`rounded-xl border p-3 text-left transition ${template?.id === t.id ? "border-primary bg-primary/10" : "border-border bg-background/30 hover:border-primary/40"}`}>
                  <div className="mb-2 h-10 w-full rounded-lg" style={{ background: t.preview.bg, boxShadow: `inset 0 0 0 2px ${t.preview.accent}55` }}>
                    <div className="h-2 w-2 translate-x-2 translate-y-2 rounded-full" style={{ background: t.preview.accent }} />
                  </div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.description}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
              continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-bold">tell us about you</h1>
            <div className="mt-1 text-sm text-muted-foreground">this shows right on your profile. skip it if you're not sure yet.</div>
            <div className="mt-6 space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">display name</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={username}
                  className="input mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="a short line about you"
                  className="input mt-1 resize-none" />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setStep(0)} className="rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium hover:border-primary transition">back</button>
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">you're all set</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              your page is at <span className="text-foreground">pews.lol/u/{username}</span> — add your links and socials from the dashboard whenever you're ready.
            </div>
            <button onClick={() => onComplete({ template, display_name: displayName, bio })}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
              go to my dashboard
            </button>
          </>
        )}
      </div>
    </main>
  );
}
