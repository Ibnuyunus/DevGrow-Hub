import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { fetchProjectsWithProfiles } from "@/lib/projects";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

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

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesCat = category === "All" || (p as any).category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.profiles?.username.toLowerCase().includes(q) ?? false)
      );
    });
  }, [projects, query, category]);

  const chips = ["All", ...CATEGORIES];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Project Gallery</h1>
        <p className="mt-2 text-muted-foreground">Discover what the community is building.</p>
      </header>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, descriptions, or creators…"
            className="pl-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === c
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading projects…</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
          {projects && projects.length > 0 ? "No projects match your filters." : "No projects yet — be the first!"}
        </div>
      )}
    </main>
  );
}
