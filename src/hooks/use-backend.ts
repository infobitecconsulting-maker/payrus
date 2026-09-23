// React Query wrappers around src/lib/backend.ts, designed so each call
// site's migration off `convex/react` is a small, mechanical diff:
//   - useQuery(api.x.y, args | "skip")   ->  useXxx(args | undefined)  (same
//     "undefined while loading/disabled" return shape)
//   - useMutation(api.x.y)               ->  useXxxMutation()  (also returns
//     a directly-callable async function, not react-query's {mutate,...}
//     object, so `const fn = useXxxMutation(); await fn(args)` still reads
//     the same as the Convex version did)
import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from "@tanstack/react-query";
import * as backend from "@/lib/backend.ts";

// ---------------------------------------------------------------------------
// Identity / roles / addresses
// ---------------------------------------------------------------------------

export function useAppUserById(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["appUser", userId],
    queryFn: () => backend.getUserById(userId!),
    enabled: !!userId,
  }).data;
}

export function useAddressesForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["addresses", userId],
    queryFn: () => backend.listAddressesForUser(userId!),
    enabled: !!userId,
  }).data;
}

export function useUserRolesForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["userRoles", userId],
    queryFn: () => backend.listUserRolesForUser(userId!),
    enabled: !!userId,
  }).data;
}

export function useUpsertUserRoleMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.upsertUserRole,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["userRoles", variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ["walletViews", variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ["cards", variables.userId] });
    },
  });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Wallets / transfers
// ---------------------------------------------------------------------------

export function useWalletViewsForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["walletViews", userId],
    queryFn: () => backend.listWalletViewsForUser(userId!),
    enabled: !!userId,
  }).data;
}

export function useRecentTransfersForUser(userId: string | undefined, limit = 10) {
  return useReactQuery({
    queryKey: ["recentTransfers", userId, limit],
    queryFn: () => backend.listRecentTransfersForUser(userId!, limit),
    enabled: !!userId,
  }).data;
}

export function useTransfersForWallet(walletViewId: string | undefined) {
  return useReactQuery({
    queryKey: ["transfersForWallet", walletViewId],
    queryFn: () => backend.listTransfersForWallet(walletViewId!),
    enabled: !!walletViewId,
  }).data;
}

function useInvalidateWalletQueries() {
  const queryClient = useQueryClient();
  return (userId: string) => {
    void queryClient.invalidateQueries({ queryKey: ["walletViews", userId] });
    void queryClient.invalidateQueries({ queryKey: ["recentTransfers", userId] });
  };
}

export function useDepositMutation() {
  const invalidate = useInvalidateWalletQueries();
  const mutation = useReactMutation({
    mutationFn: backend.depositToWallet,
    onSuccess: (_data, variables) => invalidate(variables.userId),
  });
  return mutation.mutateAsync;
}

export function useApplyWalletTransferMutation() {
  const invalidate = useInvalidateWalletQueries();
  const mutation = useReactMutation({
    mutationFn: backend.applyWalletTransfer,
    onSuccess: (_data, variables) => invalidate(variables.userId),
  });
  return mutation.mutateAsync;
}

export function useConvertBetweenWalletsMutation() {
  const invalidate = useInvalidateWalletQueries();
  const mutation = useReactMutation({
    mutationFn: backend.convertBetweenWallets,
    onSuccess: (_data, variables) => invalidate(variables.userId),
  });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export function useCardsForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["cards", userId],
    queryFn: () => backend.listCardsForUser(userId!),
    enabled: !!userId,
  }).data;
}

// ---------------------------------------------------------------------------
// Linked payment methods
// ---------------------------------------------------------------------------

export function useLinkedPaymentMethods(ownerKey: string | undefined) {
  return useReactQuery({
    queryKey: ["linkedPaymentMethods", ownerKey],
    queryFn: () => backend.listLinkedPaymentMethods(ownerKey!),
    enabled: !!ownerKey,
  }).data;
}

export function useAddLinkedPaymentMethodMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.addLinkedPaymentMethod,
    onSuccess: (_data, variables) => void queryClient.invalidateQueries({ queryKey: ["linkedPaymentMethods", variables.ownerKey] }),
  });
  return mutation.mutateAsync;
}

export function useSeedDefaultLinkedPaymentMethodsMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.seedDefaultLinkedPaymentMethods,
    onSuccess: (_data, ownerKey) => void queryClient.invalidateQueries({ queryKey: ["linkedPaymentMethods", ownerKey] }),
  });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Marketplace / shop
// ---------------------------------------------------------------------------

export function useMarketplacePartners() {
  return useReactQuery({ queryKey: ["marketplacePartners"], queryFn: backend.listMarketplacePartners }).data;
}

export function useCreateShopOrderMutation() {
  const mutation = useReactMutation({ mutationFn: backend.createShopOrder });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function useAdminListUsers() {
  return useReactQuery({ queryKey: ["adminUsers"], queryFn: backend.adminListUsers }).data;
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
}

export function useAdminUpdateUserRoleMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.adminUpdateUserRole, onSuccess: invalidate });
  return mutation.mutateAsync;
}

export function useAdminCreateUserMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.adminCreateUser, onSuccess: invalidate });
  return mutation.mutateAsync;
}

export function useAdminGrantAdminRoleMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.adminGrantAdminRole, onSuccess: invalidate });
  return mutation.mutateAsync;
}

export function useCurrenciesByCode(codes: string[]) {
  return useReactQuery({
    queryKey: ["currencies", ...codes],
    queryFn: () => backend.listCurrenciesByCode(codes),
  }).data;
}

export function useCurrentFxMarginConfig() {
  return useReactQuery({
    queryKey: ["fxMarginConfig"],
    queryFn: backend.getCurrentFxMarginConfig,
  }).data;
}

export function useUpdateFxMarginConfigMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.updateFxMarginConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fxMarginConfig"] }),
  });
  return mutation.mutateAsync;
}

export function useAdminBlockedTransfers() {
  return useReactQuery({ queryKey: ["adminBlockedTransfers"], queryFn: backend.adminListBlockedTransfers }).data;
}

export function useAdminResolveTransferMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.adminResolveTransfer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminBlockedTransfers"] }),
  });
  return mutation.mutateAsync;
}

export function useAdminPendingProfiles() {
  return useReactQuery({ queryKey: ["adminPendingProfiles"], queryFn: backend.adminListPendingProfiles }).data;
}

export function useTestUsersCleanupMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.testUsersCleanup, onSuccess: invalidate });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Roles & Access
// ---------------------------------------------------------------------------

export function useAdminReassignUserRoleMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.adminReassignUserRole, onSuccess: invalidate });
  return mutation.mutateAsync;
}

export function useAdminRemoveUserRoleMutation() {
  const invalidate = useInvalidateAdmin();
  const mutation = useReactMutation({ mutationFn: backend.adminRemoveUserRole, onSuccess: invalidate });
  return mutation.mutateAsync;
}

export function useProfileFeatures(profileType: string | undefined) {
  return useReactQuery({
    queryKey: ["profileFeatures", profileType],
    queryFn: () => backend.getProfileFeatures(profileType!),
    enabled: !!profileType,
  }).data;
}

export function useAdminSetProfileFeaturesMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.adminSetProfileFeatures,
    onSuccess: (_data, variables) => void queryClient.invalidateQueries({ queryKey: ["profileFeatures", variables.profileType] }),
  });
  return mutation.mutateAsync;
}

export function useAdminSetConsoleRoleTabsMutation() {
  const mutation = useReactMutation({ mutationFn: backend.adminSetConsoleRoleTabs });
  return mutation.mutateAsync;
}

// ---------------------------------------------------------------------------
// Notifications / payment links
// ---------------------------------------------------------------------------

export function useNotificationsForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["notifications", userId],
    queryFn: () => backend.listNotificationsForUser(userId!),
    enabled: !!userId,
  }).data;
}

export function useMarkNotificationReadMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
  return mutation.mutateAsync;
}

export function usePaymentLinksForUser(userId: string | undefined) {
  return useReactQuery({
    queryKey: ["paymentLinks", userId],
    queryFn: () => backend.listPaymentLinksForUser(userId!),
    enabled: !!userId,
  }).data;
}

export function useCreatePaymentLinkMutation() {
  const queryClient = useQueryClient();
  const mutation = useReactMutation({
    mutationFn: backend.createPaymentLink,
    onSuccess: (_data, variables) => void queryClient.invalidateQueries({ queryKey: ["paymentLinks", variables.userId] }),
  });
  return mutation.mutateAsync;
}
