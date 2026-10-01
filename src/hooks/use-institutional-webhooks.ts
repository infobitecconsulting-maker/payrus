import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as wh from "@/lib/institutional-webhooks.ts";

export const useWebhooks = (userId?: string) =>
  useQuery({ queryKey: ["inst", "webhooks", userId], queryFn: () => wh.listWebhooks(userId!), enabled: !!userId, retry: false });
// Deliveries are worked by a once-a-minute cron, so poll while the log is open.
export const useWebhookDeliveries = (userId?: string, webhookId?: string, enabled = true) =>
  useQuery({ queryKey: ["inst", "webhookDeliveries", userId, webhookId ?? "all"], queryFn: () => wh.listWebhookDeliveries(userId!, webhookId), enabled: enabled && !!userId, retry: false, refetchInterval: 15_000 });

function useWebhookMutation<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["inst", "webhooks"] }); void qc.invalidateQueries({ queryKey: ["inst", "webhookDeliveries"] }); } });
}
export const useCreateWebhook = () => useWebhookMutation(wh.createWebhook);
export const useSetWebhookActive = () => useWebhookMutation(wh.setWebhookActive);
export const useDeleteWebhook = () => useWebhookMutation(wh.deleteWebhook);
export const useRotateWebhookSecret = () => useWebhookMutation(wh.rotateWebhookSecret);
export const useTestWebhook = () => useWebhookMutation(wh.testWebhook);
export const useRetryWebhookDelivery = () => useWebhookMutation(wh.retryWebhookDelivery);
