import { ArrowUpRight, ArrowDownLeft, Send, CreditCard, Repeat, Globe, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { useTransfersForWallet } from "@/hooks/use-backend.ts";

export interface WalletSummary {
  id: string | null;
  code: string;
  flag: string;
  balance: string;
}

// Credit vs. debit is inferred from `type` now, rather than the presence of
// a Convex `credited` field — `transfers` (supabase/migrations/0005) doesn't
// carry a separate debited/credited/commission/fxMargin breakdown per row
// the way Convex's `transactions` did; that detail still exists (in
// `quotes` and `partner_mock.ledger_entries`), just not joined into this
// history view in this pass — a reasonable simplification, not a silent
// data loss, but flagged here since a future pass may want to join it back.
const CREDIT_TYPES = new Set(["deposit", "convert_in"]);

export default function WalletHistorySheet({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: WalletSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const history = useTransfersForWallet(wallet?.id ?? undefined);

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
            const isCredit = CREDIT_TYPES.has(tx.type);
            const icons = { transfer: Send, payment: CreditCard, remittance: Globe, deposit: Plus, convert_out: Repeat, convert_in: Repeat } as const;
            const Icon = icons[tx.type as keyof typeof icons] ?? CreditCard;
            const labels: Record<string, string> = {
              transfer: "Transfer", payment: "Payment", remittance: "Remittance",
              deposit: "Deposit", convert_out: "Conversion out", convert_in: "Conversion in",
            };
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-foreground">
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{labels[tx.type] ?? tx.type} · {tx.reference}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {new Date(tx.createdAt).toLocaleString()} · {tx.state}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {isCredit ? (
                    <div className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                      <ArrowDownLeft size={12} /> +{tx.currency} {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-destructive flex items-center gap-1 justify-end">
                      <ArrowUpRight size={12} /> -{tx.currency} {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
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
