import { useQuery } from "convex/react";
import { ArrowUpRight, ArrowDownLeft, Send, CreditCard, Repeat, Globe, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

export interface WalletSummary {
  id: Id<"wallets"> | null;
  code: string;
  flag: string;
  balance: string;
}

export default function WalletHistorySheet({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const history = useQuery(
    api.transactions.listForWallet,
    wallet?.id ? { walletId: wallet.id } : "skip",
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{wallet?.flag}</span>
            <span>{wallet?.code}</span>
            <span className="text-muted-foreground font-normal text-sm">· {wallet?.balance}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-2">
          {!wallet?.id && (
            <p className="text-xs text-muted-foreground py-6 text-center">
              This is a demo wallet preview — transaction history is only tracked for real, signed-in wallets.
            </p>
          )}
          {wallet?.id && history === undefined && (
            <p className="text-xs text-muted-foreground py-6 text-center">Loading transaction history...</p>
          )}
          {wallet?.id && history && history.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">No transactions on this wallet yet.</p>
          )}
          {history?.map((tx) => {
            const isCredit = tx.credited != null;
            const icons = { transfer: Send, payment: CreditCard, remittance: Globe, deposit: Plus, convert_out: Repeat, convert_in: Repeat } as const;
            const Icon = icons[tx.type as keyof typeof icons] ?? CreditCard;
            const labels: Record<string, string> = {
              transfer: "Transfer", payment: "Payment", remittance: "Remittance",
              deposit: "Deposit", convert_out: "Conversion out", convert_in: "Conversion in",
            };
            return (
              <div key={tx._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-foreground">
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{labels[tx.type] ?? tx.type} · {tx.reference}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {new Date(tx.createdAt).toLocaleString()}
                    {tx.fxMargin > 0 && ` · FX margin ${tx.walletCurrency} ${tx.fxMargin.toFixed(2)}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {isCredit ? (
                    <>
                      <div className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                        <ArrowDownLeft size={12} /> +{tx.walletCurrency} {tx.credited!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      {tx.commission > 0 && (
                        <div className="text-[10px] text-muted-foreground">fee {tx.currency} {tx.commission.toFixed(2)}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-destructive flex items-center gap-1 justify-end">
                        <ArrowUpRight size={12} /> -{tx.walletCurrency} {tx.debited.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      {tx.commission > 0 && (
                        <div className="text-[10px] text-muted-foreground">commission {tx.currency} {tx.commission.toFixed(2)}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
