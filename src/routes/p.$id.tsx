import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, ExternalLink, Github, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/p/$id")({
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();
      return { ...data, profile };
    },
  });

  const { data: likes, refetch: refetchLikes } = useQuery({
    queryKey: ["likes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("user_id").eq("project_id", id);
      if (error) throw error;
      return data;
    },
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data: cs, error } = await supabase
        .from("comments")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!cs?.length) return [];
      const ids = Array.from(new Set(cs.map((c) => c.user_id)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return cs.map((c) => ({ ...c, profile: map.get(c.user_id) ?? null }));
    },
  });

  const liked = !!likes?.find((l) => l.user_id === user?.id);
  const likeCount = likes?.length ?? 0;

  const toggleLike = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (liked) {
      await supabase.from("likes").delete().eq("project_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ project_id: id, user_id: user.id });
    }
    refetchLikes();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    const trimmed = comment.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) {
      toast.error("Comment must be 1–1000 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      project_id: id,
      user_id: user.id,
      content: trimmed,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      setComment("");
      refetchComments();
    }
  };

  const deleteComment = async (cid: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", cid);
    if (error) toast.error(error.message);
    else refetchComments();
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  if (!project) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/gallery" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to gallery
      </Link>

      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        {project.preview_image_url && (
          <img src={project.preview_image_url} alt={project.title} className="aspect-video w-full object-cover" />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold">{project.title}</h1>
          {project.profile && (
            <Link
              to="/u/$username"
              params={{ username: project.profile.username }}
              className="mt-2 inline-block text-sm text-accent hover:underline"
            >
              @{project.profile.username}
            </Link>
          )}
          {project.description && <p className="mt-4 text-muted-foreground">{project.description}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={toggleLike} variant={liked ? "default" : "outline"} size="sm" className={liked ? "bg-hero-gradient text-primary-foreground" : ""}>
              <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </Button>
            {project.live_url && (
              <Button asChild variant="outline" size="sm">
                <a href={project.live_url} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="mr-1 h-4 w-4" /> Live
                </a>
              </Button>
            )}
            {project.source_url && (
              <Button asChild variant="outline" size="sm">
                <a href={project.source_url} target="_blank" rel="noreferrer noopener">
                  <Github className="mr-1 h-4 w-4" /> Code
                </a>
              </Button>
            )}
          </div>
        </div>
      </article>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Comments ({comments?.length ?? 0})</h2>

        {user ? (
          <form onSubmit={submitComment} className="mb-6 rounded-xl border border-border/60 bg-card p-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts…"
              maxLength={1000}
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" disabled={submitting} size="sm" className="bg-hero-gradient text-primary-foreground">
                {submitting ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            <Link to="/auth" search={{ mode: "login" }} className="text-accent hover:underline">Sign in</Link> to leave a comment.
          </div>
        )}

        <div className="space-y-3">
          {comments?.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-hero-gradient text-xs font-bold text-primary-foreground">
                    {c.profile?.avatar_url ? (
                      <img src={c.profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (c.profile?.username ?? "??").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    {c.profile && (
                      <Link to="/u/$username" params={{ username: c.profile.username }} className="text-sm font-medium hover:underline">
                        @{c.profile.username}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
            </div>
          ))}
          {comments && comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No comments yet. Be the first!</p>
          )}
        </div>
      </section>
    </main>
  );
}
