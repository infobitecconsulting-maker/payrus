import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inst from "@/lib/institutional.ts";

// Static-ish registries (sub-profiles, modules, record kinds) change only via migrations.
export function useSubProfiles() {
  return useQuery({ queryKey: ["inst", "subProfiles"], queryFn: inst.listSubProfiles, staleTime: 300_000, retry: false });
}
export function useRecordKinds() {
  return useQuery({ queryKey: ["inst", "kinds"], queryFn: inst.listKinds, staleTime: 300_000, retry: false });
}
export function useMyModules(userId: string | undefined, role: string | undefined) {
  return useQuery({
    queryKey: ["inst", "myModules", userId, role], queryFn: () => inst.myModules(userId!, role!),
    enabled: !!userId && !!role, staleTime: 60_000, retry: false,
  });
}
export function useInstRecords(userId: string | undefined, module?: string) {
  return useQuery({
    queryKey: ["inst", "records", userId, module ?? "all"], queryFn: () => inst.listRecords(userId!, module),
    enabled: !!userId, retry: false,
  });
}
export function usePendingApprovals(actorId: string | undefined) {
  return useQuery({
    queryKey: ["inst", "approvals", actorId], queryFn: () => inst.pendingApprovals(actorId!),
    enabled: !!actorId, staleTime: 30_000, retry: false,
  });
}
export function useAmortization(principal: number, rate: number, months: number, enabled: boolean) {
  return useQuery({
    queryKey: ["inst", "amortization", principal, rate, months], queryFn: () => inst.amortization(principal, rate, months),
    enabled: enabled && principal > 0 && months > 0, staleTime: Infinity, retry: false,
  });
}

// Every mutation can move money, so wallets and transaction history refresh with the records.
function useInstMutation<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inst"] });
      void qc.invalidateQueries({ queryKey: ["walletViews"] });
      void qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}
export const useCreateInstRecord = () => useInstMutation(inst.createRecord);
export const useTransitionInstRecord = () => useInstMutation(inst.transitionRecord);
export const useSetTally = () => useInstMutation(inst.setTally);
export const useRunPayroll = () => useInstMutation(inst.runPayroll);
export const useSetRecurrence = () => useInstMutation(inst.setRecurrence);
export const useRunRecurring = () => useInstMutation(inst.runRecurring);
export const useSetMySubProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inst.setMySubProfile,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["inst", "myModules"] }); void qc.invalidateQueries({ queryKey: ["userRoles"] }); },
  });
};
