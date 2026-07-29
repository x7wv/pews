import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/pews-logo.png";

export function Header() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.username === "x7wv"));
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
