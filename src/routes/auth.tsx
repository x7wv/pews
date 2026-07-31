import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { Header } from "@/components/pews/Header";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  u: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "sign in — pews" },
      { name: "description", content: "sign in or create your pews bio page." },
      { property: "og:title", content: "sign in — pews" },
      { property: "og:description", content: "sign in or create your pews bio page." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode, u } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(u ?? "");
  const [usernameCharError, setUsernameCharError] = useState(false);
  const [busy, setBusy] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const cleanUser = username.trim();
        if (!/^[a-zA-Z0-9]{3,20}$/.test(cleanUser)) {
          toast.error("Please use normal letters and numbers");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: cleanUser, full_name: cleanUser },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("account created — welcome!");
        } else {
          toast.success("check your email to confirm your account before signing in");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "auth failed";
      if (/email not confirmed/i.test(msg)) {
        toast.error("your email isn't confirmed yet — check your inbox for the confirmation link");
      } else if (/invalid login credentials/i.test(msg)) {
        toast.error("incorrect email or password");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) { toast.error("google sign-in failed"); setBusy(false); }
    } catch {
      toast.error("google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-40" />
      <Header />
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pt-24 pb-10">
        <div className="hud-corners rounded-3xl border border-border bg-card/60 backdrop-blur-2xl p-8 animate-fade-up">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gradient">
              {mode === "signup" ? "claim your name" : "welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup" ? "your bio page in 30 seconds." : "sign in to your pews account."}
            </p>
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background/40 py-2.5 text-sm font-medium hover:bg-background/70 transition disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#EA4335" d="M12 5.04c1.75 0 3.32.6 4.55 1.78l3.4-3.4C17.95 1.47 15.24.4 12 .4 7.32.4 3.3 3.07 1.35 6.96l3.96 3.07C6.26 7.14 8.87 5.04 12 5.04z"/><path fill="#4285F4" d="M23.6 12.27c0-.86-.08-1.5-.24-2.16H12v3.92h6.63c-.14 1.1-.87 2.75-2.5 3.86l3.86 2.99c2.32-2.14 3.61-5.3 3.61-8.6z"/><path fill="#FBBC05" d="M5.32 14.03c-.24-.7-.38-1.44-.38-2.2s.13-1.5.36-2.2L1.35 6.56C.55 8.11.1 9.87.1 11.83s.45 3.72 1.25 5.27l3.97-3.07z"/><path fill="#34A853" d="M12 23.4c3.24 0 5.95-1.07 7.94-2.9l-3.86-2.99c-1.04.72-2.42 1.22-4.08 1.22-3.13 0-5.74-2.1-6.7-4.98l-3.95 3.06C3.3 20.72 7.32 23.4 12 23.4z"/></svg>
            continue with google
          </button>

          <div className="my-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">username</label>
                <div className="mt-1 flex items-center rounded-xl border border-border bg-background/40 focus-within:border-primary/60">
                  <span className="pl-3 text-xs font-mono text-muted-foreground">pews.lol/u/</span>
                  <input
                    value={username}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
                      setUsernameCharError(cleaned !== raw);
                      setUsername(cleaned);
                    }}
                    required
                    className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
                    placeholder="yourname"
                  />
                </div>
                {usernameCharError && <div className="mt-1 text-[11px] text-red-400">Please use normal letters and numbers</div>}
              </div>
            )}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/60" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
              {busy ? "..." : mode === "signup" ? "create account" : "sign in"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signup" ? (
              <>have an account? <button onClick={() => setMode("signin")} className="text-primary hover:underline">sign in</button></>
            ) : (
              <>no account? <button onClick={() => setMode("signup")} className="text-primary hover:underline">sign up</button></>
            )}
          </div>
        </div>
        <Link to="/" className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">← back home</Link>
      </section>
    </main>
  );
}
