import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Code2, Upload, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { fetchProjectsWithProfiles } from "@/lib/projects";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: projects } = useQuery({
    queryKey: ["recent-projects"],
    queryFn: () => fetchProjectsWithProfiles({ limit: 6 }),
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" />
              For beginner developers
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Build, share, and grow
              <span className="block text-gradient">with DevGrow Hub</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              A friendly community for beginner developers to showcase their HTML, CSS & JavaScript
              projects, get feedback, and learn together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-hero-gradient text-primary-foreground shadow-glow hover:opacity-90">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Join the community <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/gallery">Browse projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Upload, title: "Showcase your work", desc: "Upload projects with title, description and a preview image." },
            { icon: Users, title: "Build your profile", desc: "Each member gets a personal profile to share their journey." },
            { icon: Code2, title: "Discover & learn", desc: "Browse projects from other beginners and get inspired." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hero-gradient">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent projects */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Latest projects</h2>
          <Link to="/gallery" className="text-sm text-accent hover:underline">View all →</Link>
        </div>
        {projects && projects.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">No projects yet. Be the first to share!</p>
            <Button asChild className="mt-4 bg-hero-gradient text-primary-foreground">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
