import type { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Github } from "lucide-react";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
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
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{project.title}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
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
        <div className="mt-3 flex items-center gap-3 text-xs">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Live
            </a>
          )}
          {project.source_url && (
            <a
              href={project.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Github className="h-3 w-3" /> Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
