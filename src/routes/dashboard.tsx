import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectsWithProfiles } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: projects, refetch } = useQuery({
    queryKey: ["my-projects", user?.id],
    enabled: !!user,
    queryFn: () => fetchProjectsWithProfiles({ userId: user!.id }),
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Project deleted");
      refetch();
    }
  };

  if (loading || !user) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{profile?.display_name ?? profile?.username ?? "dev"}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {profile && (
              <Link to="/u/$username" params={{ username: profile.username }} className="text-accent hover:underline">
                View public profile →
              </Link>
            )}
          </p>
        </div>
        <Button asChild className="bg-hero-gradient text-primary-foreground">
          <Link to="/upload"><Plus className="mr-1 h-4 w-4" /> New project</Link>
        </Button>
      </header>

      <h2 className="mb-4 text-xl font-semibold">Your projects</h2>
      {projects && projects.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              <ProjectCard project={p} />
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-destructive opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <p className="text-muted-foreground">No projects yet. Share your first one!</p>
          <Button asChild className="mt-4 bg-hero-gradient text-primary-foreground">
            <Link to="/upload">Upload a project</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
