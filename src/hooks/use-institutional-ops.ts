import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ops from "@/lib/institutional-ops.ts";

const useInst = <T,>(key: unknown[], fn: () => Promise<T>, enabled: boolean) => useQuery({ queryKey: ["inst", ...key], queryFn: fn, enabled, retry: false });

export const useBankLines = (u?: string) => useInst(["bankLines", u], () => ops.listBankLines(u!), !!u);
export const useSuggestions = (u?: string) => useInst(["suggestions", u], () => ops.suggestMatches(u!), !!u);
export const useAgeing = (u?: string) => useInst(["ageing", u], () => ops.ageing(u!), !!u);
export const useFollowups = (u?: string) => useInst(["followups", u], () => ops.overdueFollowups(u!), !!u);
export const useBudgets = (u?: string) => useInst(["budgets", u], () => ops.budgetStatus(u!), !!u);
export const usePolicies = (u?: string) => useInst(["policies", u], () => ops.listPolicies(u!), !!u);
export const useApproverLimits = (u?: string) => useInst(["limits", u], () => ops.listApproverLimits(u!), !!u);
export const useApprovalProgress = (actor: string | undefined, recordId: string | undefined, on: boolean) =>
  useInst(["progress", recordId, actor], () => ops.approvalProgress({ actorId: actor!, recordId: recordId! }), on && !!actor && !!recordId);

function useOpsMutation<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inst"] });
      void qc.invalidateQueries({ queryKey: ["walletViews"] });
    },
  });
}
export const useImportStatement = () => useOpsMutation(ops.importStatement);
export const useReconcileLine = () => useOpsMutation(ops.reconcileLine);
export const useIgnoreLine = () => useOpsMutation(ops.ignoreLine);
export const useSendFollowup = () => useOpsMutation(ops.sendFollowup);
export const useSetBudget = () => useOpsMutation(ops.setBudget);
export const useDeleteBudget = () => useOpsMutation(ops.deleteBudget);
export const useSetPolicy = () => useOpsMutation(ops.setPolicy);
export const useDeletePolicy = () => useOpsMutation(ops.deletePolicy);
export const useSetApproverLimit = () => useOpsMutation(ops.setApproverLimit);
