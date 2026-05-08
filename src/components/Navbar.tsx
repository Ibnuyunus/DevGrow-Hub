import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Code2, LogOut, Upload, LayoutDashboard, Image as ImageIcon, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const NavLink = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`text-sm transition-colors hover:text-foreground ${
        path === to ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero-gradient shadow-glow">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-gradient">DevGrow Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink to="/gallery" label="Gallery" />
          {user && <NavLink to="/dashboard" label="Dashboard" />}
          {user && <NavLink to="/upload" label="Upload" />}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && !user && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-hero-gradient text-primary-foreground hover:opacity-90">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
          {!loading && user && (
            <>
              <Button asChild size="sm" variant="ghost" className="sm:hidden">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="sm:hidden">
                <Link to="/upload"><Upload className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="sm:hidden">
                <Link to="/gallery"><ImageIcon className="h-4 w-4" /></Link>
              </Button>
              <Button onClick={handleLogout} size="sm" variant="ghost">
                <LogOut className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
