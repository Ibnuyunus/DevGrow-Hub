import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

const schema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional(),
  live_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  source_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        setFile(null);
        return;
      }
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ title, description, live_url: liveUrl, source_url: sourceUrl });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      let preview_image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("project-previews")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("project-previews").getPublicUrl(path);
        preview_image_url = data.publicUrl;
      }

      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        live_url: parsed.data.live_url || null,
        source_url: parsed.data.source_url || null,
        preview_image_url,
        category: category || null,
      });
      if (error) throw error;
      toast.success("Project uploaded!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Upload a project</h1>
      <p className="mt-2 text-muted-foreground">Share your latest creation with the community.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you build? Tech used? What did you learn?"
            maxLength={500}
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="live">Live URL</Label>
            <Input id="live" type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="source">Source URL</Label>
            <Input id="source" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://github.com/..." />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Preview image</Label>
          <label
            htmlFor="image"
            className="mt-1 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:border-primary"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImagePlus className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Click to upload (max 5MB)</p>
              </div>
            )}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-hero-gradient text-primary-foreground hover:opacity-90"
        >
          {submitting ? "Uploading…" : "Publish project"}
        </Button>
      </form>
    </main>
  );
}
