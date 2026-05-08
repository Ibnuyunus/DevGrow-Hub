import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [u, p, c, l] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("likes").select("*", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, projects: p.count ?? 0, comments: c.count ?? 0, likes: l.count ?? 0 };
    },
  });

  const { data: projects, refetch } = useQuery({
    queryKey: ["admin-projects"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      refetch();
    }
  };

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to view this page.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Admin</span> dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">Moderate content and view platform stats.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", value: stats?.users },
          { label: "Projects", value: stats?.projects },
          { label: "Comments", value: stats?.comments },
          { label: "Likes", value: stats?.likes },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gradient">{s.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-xl font-semibold">Recent projects</h2>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects?.map((p) => (
              <tr key={p.id} className="border-b border-border/40 last:border-0">
                <td className="p-3">
                  <Link to="/p/$id" params={{ id: p.id }} className="hover:text-primary">{p.title}</Link>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {projects?.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
