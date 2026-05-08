import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProjectCard } from "@/components/ProjectCard";
import { fetchProjectsWithProfiles } from "@/lib/projects";

export const Route = createFileRoute("/gallery")({
  component: Gallery,
  head: () => ({
    meta: [
      { title: "Project Gallery — DevGrow Hub" },
      { name: "description", content: "Browse projects shared by the DevGrow Hub community." },
      { property: "og:title", content: "Project Gallery — DevGrow Hub" },
      { property: "og:description", content: "Browse projects shared by the DevGrow Hub community." },
    ],
  }),
});

function Gallery() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["all-projects"],
    queryFn: () => fetchProjectsWithProfiles(),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Project Gallery</h1>
        <p className="mt-2 text-muted-foreground">Discover what the community is building.</p>
      </header>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading projects…</div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
          No projects yet — be the first!
        </div>
      )}
    </main>
  );
}
