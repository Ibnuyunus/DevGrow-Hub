import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectWithProfile = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchProjectsWithProfiles(opts?: {
  limit?: number;
  userId?: string;
}): Promise<ProjectWithProfile[]> {
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (opts?.userId) query = query.eq("user_id", opts.userId);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data: projects, error } = await query;
  if (error) throw error;
  if (!projects || projects.length === 0) return [];

  const userIds = Array.from(new Set(projects.map((p) => p.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", userIds);

  const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return projects.map((p) => ({
    ...p,
    profiles: map.get(p.user_id)
      ? {
          username: map.get(p.user_id)!.username,
          display_name: map.get(p.user_id)!.display_name,
          avatar_url: map.get(p.user_id)!.avatar_url,
        }
      : null,
  }));
}
