import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type UseIsAdminOptions = {
  userId?: string;
  authLoading?: boolean;
};

export function useIsAdmin(options?: UseIsAdminOptions) {
  const auth = useAuth();
  const userId = options?.userId ?? auth.user?.id;
  const authLoading = options?.authLoading ?? auth.loading;

  const query = useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId && !authLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    },
    retry: 1,
  });

  return {
    isAdmin: !!query.data,
    isLoading: authLoading || (!!userId && query.isPending),
    error: query.error,
  };
}
