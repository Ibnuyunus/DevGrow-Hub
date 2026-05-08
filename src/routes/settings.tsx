import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile, refetch } = useQuery({
    queryKey: ["my-profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      if (error) throw error;
      setAvatarUrl(data.publicUrl);
      toast.success("Avatar updated");
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      refetch();
    }
  };

  if (loading || !user || !profile) {
    return <div className="p-12 text-center text-muted-foreground">Loading…</div>;
  }

  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your profile</p>

      <form onSubmit={handleSave} className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-hero-gradient text-xl font-bold text-primary-foreground shadow-glow">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <label
              htmlFor="avatar"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
          </div>
          <div>
            <p className="font-semibold">@{profile.username}</p>
            <p className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Click camera to change avatar (max 2MB)"}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} />
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-hero-gradient text-primary-foreground">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </main>
  );
}
