import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Printer, CheckCircle2, Clock, XCircle, X, FileDown } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { downloadReceiptPdf, printReceiptPdf, type ReceiptPdfData } from "@/lib/receipt-pdf.ts";

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
  // The receipt is proof of a finished transaction: PDF and print are available once it is completed.
  // The success screens that already show a receipt right after paying keep the default.
  status?: "completed" | "pending" | "failed";
  extraRows?: [label: string, value: string][];
  newTransactionLabel?: string;
  // Start the PDF download as soon as the receipt opens (the "Download PDF" button of the transaction detail page).
  autoDownload?: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
};

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between py-3", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export default function TransactionReceipt({
  type, amount, currency, convertedAmount, convertedCurrency, recipient, method, fee, reference, date,
  status = "completed", extraRows, newTransactionLabel, autoDownload, onClose, onNewTransaction,
}: TransactionReceiptProps) {
  const { t } = useTranslation("common");
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);
  const completed = status === "completed";
  const StatusIcon = completed ? CheckCircle2 : status === "failed" ? XCircle : Clock;
  const statusText = t(`receipt.${completed ? "completed" : status}`, completed ? "Completed" : status === "failed" ? "Failed" : "Pending");
  const typeText = t(`receipt.type_${type}`, type);

  const rows: [string, string][] = [
    [t("receipt.type", "Type"), typeText],
    [t("receipt.reference", "Reference"), reference],
    [t("receipt.date", "Date"), date],
    ...(recipient ? [[t("receipt.recipient", "Recipient"), recipient] as [string, string]] : []),
    ...(method ? [[t("receipt.method", "Method"), method] as [string, string]] : []),
    ...(extraRows ?? []),
    ...(fee ? [[t("receipt.fee", "Fee"), fee] as [string, string]] : []),
  ];
  const pdfData: ReceiptPdfData = {
    title: t("receipt.title", "Transaction Receipt"),
    brandLine: date,
    amount, currency,
    converted: convertedAmount && convertedCurrency ? `${convertedAmount} ${convertedCurrency}` : undefined,
    rows: [...rows, [t("receipt.status", "Status"), statusText]],
    statusLabel: statusText,
    disclaimer: t("receipt.disclaimer", "This receipt serves as proof of transaction. Please save it for your records."),
    reference,
  };

  const run = async (kind: "pdf" | "print") => {
    if (!completed) return;
    setBusy(kind);
    try {
      if (kind === "pdf") { downloadReceiptPdf(pdfData); toast.success(t("receipt.pdfSaved", "Receipt saved as PDF")); }
      else await printReceiptPdf(pdfData);
    } catch {
      toast.error(kind === "pdf" ? t("receipt.pdfFailed", "Could not create the PDF") : t("receipt.printFailed", "Could not open the print dialog. Download the PDF instead."));
    } finally {
      setBusy(null);
    }
  };

  const started = useRef(false);
  useEffect(() => {
    if (autoDownload && completed && !started.current) { started.current = true; void run("pdf"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t("receipt.title", "Transaction Receipt")}>
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-background shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label={t("receipt.close", "Close")}
        >
          <X className="size-5" />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className={cn("flex items-center justify-center size-16 rounded-full mb-3",
              completed ? "bg-green-100 dark:bg-green-900/30" : status === "failed" ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30")}>
              <StatusIcon className={cn("size-9", completed ? "text-green-600 dark:text-green-400" : status === "failed" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")} />
            </div>
            <p className={cn("text-sm font-medium", completed ? "text-green-600 dark:text-green-400" : status === "failed" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
              {completed ? t("receipt.success", "Transaction Successful") : statusText}
            </p>
            <p className="text-3xl font-bold text-foreground mt-2">{amount} {currency}</p>
            {convertedAmount && convertedCurrency && (
              <p className="text-sm text-muted-foreground mt-1">≈ {convertedAmount} {convertedCurrency}</p>
            )}
          </div>

          <div id="receipt-print-area" className="rounded-xl border bg-card p-4">
            {rows.map(([label, value], i) => (
              <DetailRow key={label + i} label={label} value={value} className={i === 1 || i === rows.length - 1 ? "border-b border-border" : undefined} />
            ))}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">{t("receipt.status", "Status")}</span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                completed ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : status === "failed" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400")}>
                <span className={cn("size-1.5 rounded-full", completed ? "bg-green-500" : status === "failed" ? "bg-red-500" : "bg-amber-500")} />
                {statusText}
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
            {completed
              ? t("receipt.disclaimer", "This receipt serves as proof of transaction. Please save it for your records.")
              : t("receipt.notCompleted", "The PDF and print options are available once the transaction is completed.")}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button className="w-full cursor-pointer" disabled={!completed || busy !== null} onClick={() => void run("pdf")}>
              <FileDown className="size-4" />
              {busy === "pdf" ? t("receipt.generating", "Preparing…") : t("receipt.download", "Download PDF")}
            </Button>
            <Button variant="outline" className="w-full cursor-pointer" disabled={!completed || busy !== null} onClick={() => void run("print")}>
              <Printer className="size-4" />
              {t("receipt.print", "Print Receipt")}
            </Button>
            <Button variant="secondary" className="w-full cursor-pointer" onClick={onNewTransaction}>
              {newTransactionLabel ?? t("receipt.new_transaction", "New Transaction")}
            </Button>
            <Button variant="ghost" className="w-full cursor-pointer" onClick={onClose}>
              {t("receipt.done", "Done")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
