import { useCallback, useMemo, useState } from "react";
import { useCurrentAppUser } from "@/hooks/use-current-app-user.ts";
import { useWorkspaces } from "@/hooks/use-institutional-team.ts";
import type { Workspace } from "@/lib/institutional-team.ts";

const KEY = "payrus_workspace";
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

// The workspace is the account whose books are being worked on: your own, or one you were added to as a team member.
// Data calls use ownerId; the person acting (approvals, created_by) is always the signed-in user.
export function useWorkspace() {
  const user = useCurrentAppUser();
  const list = useWorkspaces(user?.id).data;
  const [chosen, setChosen] = useState<string | null>(read);
  const workspaces: Workspace[] = useMemo(() => list ?? [], [list]);
  const current = useMemo(() => workspaces.find((w) => w.ownerId === chosen) ?? workspaces.find((w) => w.isSelf) ?? null, [workspaces, chosen]);
  const select = useCallback((ownerId: string) => { setChosen(ownerId); try { localStorage.setItem(KEY, ownerId); } catch { /* storage unavailable */ } }, []);
  const can = useCallback((perm: string) => !!current && (current.isSelf || current.permissions.includes(perm)), [current]);
  return { user, workspaces, current, ownerId: current?.ownerId ?? user?.id ?? "", isSelf: current?.isSelf ?? true, select, can };
}
