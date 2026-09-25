import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionAppUser } from "@/lib/backend.ts";
import { supabase } from "@/lib/supabase-client.ts";
import { clearLocalUserId, setLocalUserId } from "@/lib/local-user.ts";

/**
 * Resolves "who is signed in" from the live Supabase session — the `users`
 * row whose auth_user_id is the session's user. This is the same identity the
 * database authorises money RPCs against (auth.uid()), so the wallet that is
 * debited can never differ from the account that is logged in. The
 * localStorage id is only kept in sync for the few legacy readers.
 */
export function useCurrentAppUserState() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["sessionAppUser"] });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const { data, isFetched } = useQuery({
    queryKey: ["sessionAppUser"],
    queryFn: getSessionAppUser,
  });

  useEffect(() => {
    if (!isFetched) return;
    if (data) setLocalUserId(data.id);
    else clearLocalUserId();
  }, [data, isFetched]);

  return { user: data ?? undefined, isFetched };
}

export function useCurrentAppUser() {
  return useCurrentAppUserState().user;
}
