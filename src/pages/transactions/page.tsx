import { useState } from "react";
import { motion } from "motion/react";
import { Search, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/page-header.tsx";

const allTransactions = [
  { id: 1, name: "Orange Money Transfer", type: "debit", amount: -45000, currency: "CDF", date: "Aug 11, 14:32", category: "Transfer", ref: "TXN-20240811001" },
  { id: 2, name: "Salary Credit", type: "credit", amount: 850000, currency: "CDF", date: "Aug 11, 09:00", category: "Income", ref: "TXN-20240811002" },
  { id: 3, name: "Visa Card Payment", type: "debit", amount: -12500, currency: "CDF", date: "Aug 10, 18:22", category: "Payment", ref: "TXN-20240810003" },
  { id: 4, name: "CADECO Savings", type: "debit", amount: -100000, currency: "CDF", date: "Aug 9, 10:00", category: "Savings", ref: "TXN-20240809001" },
  { id: 5, name: "USD → CDF Remittance", type: "credit", amount: 280000, currency: "CDF", date: "Aug 9, 08:15", category: "Remittance", ref: "REF-20240809002" },
  { id: 6, name: "Airtel Money Topup", type: "debit", amount: -5000, currency: "CDF", date: "Aug 8, 16:00", category: "Topup", ref: "TXN-20240808001" },
  { id: 7, name: "Mastercard Refund", type: "credit", amount: 8750, currency: "CDF", date: "Aug 7, 11:30", category: "Refund", ref: "TXN-20240807001" },
  { id: 8, name: "QR Payment - Market", type: "debit", amount: -3200, currency: "CDF", date: "Aug 6, 13:45", category: "Payment", ref: "TXN-20240806001" },
];

export default function Transactions() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = [
    { key: "All", label: t("filter.all") },
    { key: "Credit", label: t("filter.credit") },
    { key: "Debit", label: t("filter.debit") },
    { key: "Transfer", label: t("filter.transfer") },
    { key: "Payment", label: t("filter.payment") },
    { key: "Remittance", label: t("filter.remittance") },
  ];

  const filtered = allTransactions.filter(tx => {
    const matchSearch = tx.name.toLowerCase().includes(search.toLowerCase()) || tx.ref.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "All" ||
      (activeFilter === "Credit" && tx.type === "credit") ||
      (activeFilter === "Debit" && tx.type === "debit") ||
      tx.category === activeFilter;
    return matchSearch && matchFilter;
  });

  const totalIn = allTransactions.filter(tx => tx.type === "credit").reduce((s, tx) => s + tx.amount, 0);
  const totalOut = allTransactions.filter(tx => tx.type === "debit").reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader title={t("transactions.title")} subtitle={t("transactions.subtitle")} className="mb-4 md:mb-6" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={15} className="text-primary" />
            <span className="text-xs text-muted-foreground">{t("transactions.totalIn")}</span>
          </div>
          <div className="text-lg font-bold font-mono text-primary">+{totalIn.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">CDF</div>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={15} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("transactions.totalOut")}</span>
          </div>
          <div className="text-lg font-bold font-mono text-foreground">{totalOut.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">CDF</div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("transactions.searchPlaceholder")} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)} className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
              activeFilter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}>
              {f.label}
            </button>
          ))}
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-card border border-border text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer">
            <Filter size={12} /> {t("transactions.filter")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">{t("transactions.noResults")}</div>
        )}
        {filtered.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              tx.type === "credit" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {tx.type === "credit" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{tx.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{tx.date}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-secondary text-xs">{tx.category}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={cn("text-sm font-bold font-mono", tx.amount > 0 ? "text-primary" : "text-foreground")}>
                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{tx.currency}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
