import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as team from "@/lib/institutional-team.ts";

export const useWorkspaces = (actorId?: string) =>
  useQuery({ queryKey: ["inst", "workspaces", actorId], queryFn: () => team.listWorkspaces(actorId!), enabled: !!actorId, staleTime: 60_000, retry: false });
export const useTeamRoles = (ownerId?: string, enabled = true) =>
  useQuery({ queryKey: ["inst", "teamRoles", ownerId], queryFn: () => team.listTeamRoles(ownerId!), enabled: enabled && !!ownerId, retry: false });
export const useTeam = (ownerId?: string, enabled = true) =>
  useQuery({ queryKey: ["inst", "team", ownerId], queryFn: () => team.listTeam(ownerId!), enabled: enabled && !!ownerId, retry: false });
export const usePlans = () => useQuery({ queryKey: ["plans"], queryFn: team.listPlans, staleTime: 300_000, retry: false });
export const useMyPlans = (userId?: string) =>
  useQuery({ queryKey: ["plans", "mine", userId], queryFn: () => team.listMyPlans(userId!), enabled: !!userId, retry: false });

function useTeamMutation<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["inst"] }); void qc.invalidateQueries({ queryKey: ["plans"] }); } });
}
export const useAddTeamMember = () => useTeamMutation(team.addTeamMember);
export const useSetTeamMemberStatus = () => useTeamMutation(team.setTeamMemberStatus);
export const useRemoveTeamMember = () => useTeamMutation(team.removeTeamMember);
export const useSaveTeamRole = () => useTeamMutation(team.saveTeamRole);
export const useDeleteTeamRole = () => useTeamMutation(team.deleteTeamRole);
export const useSetMyPlan = () => useTeamMutation(team.setMyPlan);
