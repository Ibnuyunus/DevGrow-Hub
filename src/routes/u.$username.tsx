import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/ProjectCard";
import { fetchProjectsWithProfiles } from "@/lib/projects";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["user-projects", profile?.user_id],
    enabled: !!profile?.user_id,
    queryFn: () => fetchProjectsWithProfiles({ userId: profile!.user_id }),
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="mt-2 text-muted-foreground">No member with that username.</p>
      </main>
    );
  }

  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-hero-gradient text-2xl font-bold text-primary-foreground shadow-glow">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="h-full w-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name ?? profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
        </div>
      </header>

      <h2 className="mb-4 mt-10 text-xl font-semibold">Projects</h2>
      {projects && projects.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
          No projects yet.
        </div>
      )}
    </main>
  );
}
