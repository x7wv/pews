import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/pews-logo.png";

const ADMIN_USERNAMES = new Set(["x7wv", "knyfe"]);

export function Header() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data?.username && ADMIN_USERNAMES.has(data.username)));
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/40 border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold text-gradient">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/30 blur-md opacity-0 transition duration-300 group-hover:opacity-100" />
            <img src={logo} alt="" className="relative h-7 w-7 rounded-md object-cover transition duration-300 group-hover:scale-110 group-hover:rotate-3" />
          </span>
          pews
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/updates" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition text-xs font-medium">updates</Link>
          <Link to="/donate" className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition text-xs font-medium">donate</Link>
          <a href="https://discord.gg/zmfZZNsZh8" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.673-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.418 0-1.334.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.333-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.334.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </a>
          {loading ? null : user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition font-mono text-xs">admin</Link>
              )}
              <Link to="/dashboard" className="px-3 py-1.5 rounded-lg hover:bg-card/60 transition">dashboard</Link>
              <button onClick={signOut} className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition">sign out</button>
            </>
          ) : (
            <>
              <Link to="/auth" className="px-3 py-1.5 rounded-lg hover:bg-card/60 transition">sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium">get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
