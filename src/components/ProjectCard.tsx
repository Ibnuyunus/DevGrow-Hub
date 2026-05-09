import type { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function ProjectCard({ project }: { project: Project }) {
  const { data: counts } = useQuery({
    queryKey: ["project-counts", project.id],
    queryFn: async () => {
      const [{ count: likes }, { count: comments }] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", project.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", project.id),
      ]);
      return { likes: likes ?? 0, comments: comments ?? 0 };
    },
  });

  return (
    <article className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <Link to="/p/$id" params={{ id: project.id }} className="block">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {project.preview_image_url ? (
            <img
              src={project.preview_image_url}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-hero-gradient opacity-30">
              <span className="text-4xl">⚡</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to="/p/$id" params={{ id: project.id }}>
          <h3 className="line-clamp-1 font-semibold text-foreground hover:text-primary">{project.title}</h3>
        </Link>
        {(project as any).category && (
          <span className="mt-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            {(project as any).category}
          </span>
        )}
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}
        {project.profiles && (
          <Link
            to="/u/$username"
            params={{ username: project.profiles.username }}
            className="mt-3 inline-block text-xs text-accent hover:underline"
          >
            @{project.profiles.username}
          </Link>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {counts?.likes ?? 0}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {counts?.comments ?? 0}</span>
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Live
            </a>
          )}
          {project.source_url && (
            <a href={project.source_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-foreground">
              <Github className="h-3 w-3" /> Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
