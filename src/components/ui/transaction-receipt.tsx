import { useTranslation } from "react-i18next";
import { Printer, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";

type TransactionReceiptProps = {
  type: "payment" | "transfer" | "remittance" | "pos" | "bill" | "deposit" | "convert";
  amount: string;
  currency: string;
  convertedAmount?: string;
  convertedCurrency?: string;
  recipient?: string;
  method?: string;
  fee?: string;
  reference: string;
  date: string;
  onClose: () => void;
  onNewTransaction: () => void;
};

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-3", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

function handlePrint(receiptElement: HTMLElement | null, reference: string) {
  if (!receiptElement) return;

  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;

  const content = receiptElement.innerHTML;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 32px;
            color: #1a1a1a;
            max-width: 400px;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px dashed #e5e5e5;
          }
          .success-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            color: #16a34a;
          }
          .amount {
            font-size: 28px;
            font-weight: 700;
            margin-top: 8px;
          }
          .converted {
            font-size: 14px;
            color: #6b7280;
            margin-top: 4px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label {
            font-size: 13px;
            color: #6b7280;
          }
          .detail-value {
            font-size: 13px;
            font-weight: 500;
            text-align: right;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            background: #dcfce7;
            color: #16a34a;
            font-size: 12px;
            font-weight: 500;
          }
          .disclaimer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px dashed #e5e5e5;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${content}
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

export default function TransactionReceipt({
  type,
  amount,
  currency,
  convertedAmount,
  convertedCurrency,
  recipient,
  method,
  fee,
  reference,
  date,
  onClose,
  onNewTransaction,
}: TransactionReceiptProps) {
  const { t } = useTranslation("common");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-background shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label={t("receipt.close", "Close")}
        >
          <X className="size-5" />
        </button>

        <div className="p-6">
          {/* Success header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
              <CheckCircle2 className="size-9 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {t("receipt.success", "Transaction Successful")}
            </p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {amount} {currency}
            </p>
            {convertedAmount && convertedCurrency && (
              <p className="text-sm text-muted-foreground mt-1">
                ≈ {convertedAmount} {convertedCurrency}
              </p>
            )}
          </div>

          {/* Receipt details card */}
          <div
            id="receipt-print-area"
            className="rounded-xl border bg-card p-4"
          >
            {/* Printable header (hidden on screen, shown in print) */}
            <div className="hidden receipt-header">
              <div className="success-icon">✓</div>
              <p className="amount">
                {amount} {currency}
              </p>
              {convertedAmount && convertedCurrency && (
                <p className="converted">
                  ≈ {convertedAmount} {convertedCurrency}
                </p>
              )}
            </div>

            <DetailRow
              label={t("receipt.type", "Type")}
              value={t(`receipt.type_${type}`, type)}
            />
            <DetailRow
              label={t("receipt.reference", "Reference")}
              value={reference}
              className="border-b border-border"
            />
            <DetailRow
              label={t("receipt.date", "Date")}
              value={date}
            />
            {recipient && (
              <DetailRow
                label={t("receipt.recipient", "Recipient")}
                value={recipient}
              />
            )}
            {method && (
              <DetailRow
                label={t("receipt.method", "Method")}
                value={method}
              />
            )}
            {fee && (
              <DetailRow
                label={t("receipt.fee", "Fee")}
                value={fee}
                className="border-b border-border"
              />
            )}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">
                {t("receipt.status", "Status")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                <span className="size-1.5 rounded-full bg-green-500" />
                {t("receipt.completed", "Completed")}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
            {t(
              "receipt.disclaimer",
              "This receipt serves as proof of transaction. Please save it for your records."
            )}
          </p>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full cursor-pointer"
              onClick={() => {
                const el = document.getElementById("receipt-print-area");
                handlePrint(el, reference);
              }}
            >
              <Printer className="size-4" />
              {t("receipt.print", "Print Receipt")}
            </Button>
            <Button
              variant="secondary"
              className="w-full cursor-pointer"
              onClick={onNewTransaction}
            >
              {t("receipt.new_transaction", "New Transaction")}
            </Button>
            <Button
              variant="ghost"
              className="w-full cursor-pointer"
              onClick={onClose}
            >
              {t("receipt.done", "Done")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
