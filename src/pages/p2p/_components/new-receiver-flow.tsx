import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Smartphone, Landmark, Banknote, BadgeCheck, Wallet, Copy } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { COUNTRY_OPTIONS, callingCodeForCountry, currencyForCountry } from "@/convex/geo.ts";
import { commissionFor } from "@/convex/fx.ts";
import { requireStepUp } from "@/lib/mfa.ts";
import { resolveUserByIdentifier, type PayoutMethod, type PayoutReceipt, type PayoutRow, type Receiver, type ResolvedRecipient } from "@/lib/backend.ts";
import { useMyPayouts, useMyReceivers, useRemittanceQuote, useSendToReceiverMutation } from "@/hooks/use-backend.ts";

const METHODS: { id: PayoutMethod; icon: typeof Smartphone; eta: string }[] = [
  { id: "mobile_money", icon: Smartphone, eta: "p2p.new.eta.mobile_money" },
  { id: "bank", icon: Landmark, eta: "p2p.new.eta.bank" },
  { id: "cash_pickup", icon: Banknote, eta: "p2p.new.eta.cash_pickup" },
];
const MOBILE_PROVIDERS = ["M-Pesa", "Orange Money", "MTN MoMo", "Airtel Money", "Wave", "Moov Money"];
const ID_TYPES = ["passport", "national_id", "driving_licence", "residence_permit"];
const STATUS_STYLE: Record<PayoutRow["status"], string> = {
  processing: "bg-amber-100 text-amber-700", ready_for_pickup: "bg-accent/15 text-accent", paid_out: "bg-primary/10 text-primary",
  blocked: "bg-destructive/10 text-destructive", cancelled: "bg-secondary text-muted-foreground",
};
const field = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/50";
const label = "block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1";
const errText = (e: unknown) => (e instanceof Error ? e.message.replace(/^[A-Za-z_]+: /, "") : "");

type Step = "form" | "amount" | "confirm" | "success";

export default function NewReceiverFlow({ senderId, wallets, defaultCurrency, onExit, onSendToMember }: {
  senderId: string;
  wallets: { currency: string; balance: number }[];
  defaultCurrency: string | null;
  onExit: () => void;
  onSendToMember: (m: ResolvedRecipient) => void;
}) {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<Step>("form");
  const receivers = useMyReceivers(true).data ?? [];
  const payouts = useMyPayouts(true).data ?? [];
  const send = useSendToReceiverMutation();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PayoutMethod>("mobile_money");
  const [provider, setProvider] = useState("");
  const [account, setAccount] = useState("");
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState("");
  const [member, setMember] = useState<ResolvedRecipient | null>(null);

  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState(defaultCurrency ?? wallets[0]?.currency ?? "USD");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<PayoutReceipt | null>(null);

  const toCurrency = country ? currencyForCountry(country) : "";
  const numAmt = parseFloat(amount) || 0;
  const cross = !!toCurrency && toCurrency !== from;
  const quote = useRemittanceQuote(from, toCurrency, numAmt, cross && step !== "form").data;
  const fee = cross ? (quote?.fee ?? 0) : commissionFor(numAmt);
  const receives = cross ? (quote?.receiveAmount ?? 0) : numAmt;
  const total = numAmt + fee;
  const wallet = wallets.find((w) => w.currency === from);
  const short = !!wallet && total > wallet.balance;
  const blocked = cross && quote && !quote.ok ? quote.blockedReason : null;
  const currencies = Array.from(new Set([...wallets.map((w) => w.currency), ...(defaultCurrency ? [defaultCurrency] : []), from]));

  // Suggest the member route when the phone or email already belongs to a PayRus account.
  useEffect(() => {
    const ids = [phone.trim().length >= 7 ? phone.trim() : "", email.includes("@") ? email.trim() : ""].filter(Boolean);
    if (ids.length === 0) { setMember(null); return; }
    let live = true;
    const id = setTimeout(async () => {
      for (const i of ids) {
        try { const found = await resolveUserByIdentifier(i); if (live && found && found.id !== senderId) { setMember(found); return; } } catch { /* ignore */ }
      }
      if (live) setMember(null);
    }, 400);
    return () => { live = false; clearTimeout(id); };
  }, [phone, email, senderId]);

  const pickReceiver = (r: Receiver) => {
    setFullName(r.fullName); setCountry(r.country ?? ""); setCity(r.city ?? ""); setPhone(r.phone ?? "");
    setMethod(r.deliveryMethod); setProvider(r.provider ?? ""); setAccount(r.deliveryMethod === "bank" ? r.account : "");
    setIdType(r.idType ?? ID_TYPES[0]); setIdNumber(r.idNumber ?? "");
  };

  const formOk = fullName.trim().length >= 2 && !!country && (
    method === "mobile_money" ? !!provider && (account || phone).trim().length >= 7
    : method === "bank" ? !!provider.trim() && account.replace(/\s/g, "").length >= 8
    : phone.trim().length >= 7 && idNumber.trim().length >= 4
  );

  const confirm = async () => {
    if (!(await requireStepUp())) { toast.error(t("mfa.codeInvalid")); return; }
    setBusy(true);
    try {
      const r = await send({
        senderId, amount: numAmt, from, note: note.trim() || undefined,
        fullName: fullName.trim(), country, currency: toCurrency, deliveryMethod: method,
        provider: method === "cash_pickup" ? undefined : provider.trim(), account: method === "bank" ? account.trim() : method === "mobile_money" ? (account || phone).trim() : undefined,
        phone: phone.trim() || undefined, idType: method === "cash_pickup" ? idType : undefined, idNumber: method === "cash_pickup" ? idNumber.trim() : undefined, city: city.trim() || undefined,
      });
      setReceipt(r); setStep("success");
    } catch (e) {
      const m = /corridor_blocked:(\w+)/.exec(e instanceof Error ? e.message : "");
      toast.error(m ? t(`remittance.blocked.${m[1]}`) : errText(e) || t("p2p.new.failed"));
    } finally { setBusy(false); }
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const back = step === "amount" ? () => setStep("form") : step === "confirm" ? () => setStep("amount") : onExit;
  const idLabel = t(`p2p.new.idType.${idType}`);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        {step !== "success" && (
          <button onClick={back} aria-label={t("p2p.new.back")} className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center hover:bg-primary/10 cursor-pointer">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("p2p.new.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("p2p.new.subtitle")}</p>
        </div>
      </div>

      {step === "form" && (
        <div className="space-y-4">
          {receivers.length > 0 && (
            <div>
              <div className={label}>{t("p2p.new.saved")}</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {receivers.slice(0, 8).map((r) => (
                  <button key={r.id} onClick={() => pickReceiver(r)} className="shrink-0 px-3 py-2 rounded-xl bg-secondary border border-border text-left hover:border-primary/40 cursor-pointer">
                    <div className="text-xs font-semibold">{r.fullName}</div>
                    <div className="text-[10px] text-muted-foreground">{t(`p2p.new.method.${r.deliveryMethod}`)}{r.country ? ` · ${r.country}` : ""}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <label className={label} htmlFor="nr-name">{t("p2p.new.fullName")}</label>
              <input id="nr-name" className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="nr-country">{t("p2p.new.country")}</label>
                <select id="nr-country" className={field} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">—</option>
                  {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="nr-city">{t("p2p.new.city")}</label>
                <input id="nr-city" className={field} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            {toCurrency && <div className="text-[11px] text-muted-foreground">{t("p2p.new.receivesIn", { currency: toCurrency })}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="nr-phone">{t("p2p.new.phone")}</label>
                <input id="nr-phone" className={field} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={country ? `+${callingCodeForCountry(country)} …` : "+…"} />
              </div>
              <div>
                <label className={label} htmlFor="nr-email">{t("p2p.new.email")}</label>
                <input id="nr-email" className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">{t("p2p.new.emailHint")}</div>
          </div>

          {member && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2" role="status">
              <div className="flex items-center gap-1.5 text-sm font-semibold"><BadgeCheck size={14} className="text-accent" />{t("p2p.new.memberFound", { name: member.name })}</div>
              <p className="text-xs text-muted-foreground">{t("p2p.new.memberPerks")}</p>
              <button onClick={() => onSendToMember(member)} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                <Wallet size={12} />{t("p2p.new.sendToWallet")}
              </button>
            </div>
          )}

          <div>
            <div className={label}>{t("p2p.new.method")}</div>
            <div className="grid sm:grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id}
                  className={cn("p-3 rounded-xl border text-left cursor-pointer transition-colors", method === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                  <m.icon size={16} className={method === m.id ? "text-primary" : "text-muted-foreground"} />
                  <div className="text-sm font-semibold mt-1">{t(`p2p.new.method.${m.id}`)}</div>
                  <div className="text-[10px] text-muted-foreground">{t(m.eta)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {method === "mobile_money" && (
              <>
                <div>
                  <label className={label} htmlFor="nr-prov">{t("p2p.new.provider")}</label>
                  <select id="nr-prov" className={field} value={provider} onChange={(e) => setProvider(e.target.value)}>
                    <option value="">—</option>{MOBILE_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="nr-mm">{t("p2p.new.mmNumber")}</label>
                  <input id="nr-mm" className={field} inputMode="tel" value={account} onChange={(e) => setAccount(e.target.value)} placeholder={phone || "+…"} />
                </div>
              </>
            )}
            {method === "bank" && (
              <>
                <div>
                  <label className={label} htmlFor="nr-bank">{t("p2p.new.bankName")}</label>
                  <input id="nr-bank" className={field} value={provider} onChange={(e) => setProvider(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="nr-iban">{t("p2p.new.account")}</label>
                  <input id="nr-iban" className={field} value={account} onChange={(e) => setAccount(e.target.value)} autoComplete="off" />
                </div>
              </>
            )}
            {method === "cash_pickup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label} htmlFor="nr-idt">{t("p2p.new.idTypeLabel")}</label>
                    <select id="nr-idt" className={field} value={idType} onChange={(e) => setIdType(e.target.value)}>
                      {ID_TYPES.map((i) => <option key={i} value={i}>{t(`p2p.new.idType.${i}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="nr-idn">{t("p2p.new.idNumber")}</label>
                    <input id="nr-idn" className={field} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} autoComplete="off" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">{t("p2p.new.idHint")}</div>
              </>
            )}
          </div>

          <button onClick={() => { if (formOk) setStep("amount"); else toast.error(t("p2p.new.requiredFields")); }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">{t("p2p.new.continue")}</button>

          <div>
            <div className={label}>{t("p2p.new.payouts")}</div>
            {payouts.length === 0 && <div className="text-xs text-muted-foreground">{t("p2p.new.noPayouts")}</div>}
            <div className="space-y-2">
              {payouts.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.receiverName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{t(`p2p.new.method.${p.deliveryMethod}`)} · {p.accountMasked} · {new Date(p.createdAt).toLocaleDateString()}</div>
                    {p.pickupCode && <div className="text-[11px] font-mono mt-0.5">{t("p2p.new.pickupCode")}: {p.pickupCode}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono">{fmt(p.receiveAmount)} {p.toCurrency}</div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[p.status])}>{t(`p2p.new.status.${p.status}`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "amount" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="font-semibold">{fullName}</div>
            <div className="text-xs text-muted-foreground">{t(`p2p.new.method.${method}`)}{provider ? ` · ${provider}` : ""} · {country}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className={label} htmlFor="nr-amt">{t("p2p.new.youSend")}</label>
                <input id="nr-amt" className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={label} htmlFor="nr-from">{t("p2p.new.payFrom")}</label>
                <select id="nr-from" className={field} value={from} onChange={(e) => setFrom(e.target.value)}>{currencies.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="nr-note">{t("p2p.new.note")}</label>
              <input id="nr-note" className={field} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("p2p.new.fee")}</span><span>{fmt(fee)} {from}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("p2p.new.theyGet")}</span><span className="font-semibold">{fmt(receives)} {toCurrency || from}</span></div>
              <div className="flex justify-between font-semibold"><span>{t("p2p.new.total")}</span><span>{fmt(total)} {from}</span></div>
              {wallet && <div className="text-[11px] text-muted-foreground">{t("p2p.new.balance")}: {fmt(wallet.balance)} {from}</div>}
              {short && <div className="text-[11px] text-destructive">{t("p2p.new.insufficient")}</div>}
              {blocked && <div className="text-[11px] text-destructive">{t(`remittance.blocked.${blocked}`)}</div>}
            </div>
          </div>
          <button disabled={numAmt <= 0 || short || !!blocked || (cross && !quote)} onClick={() => setStep("confirm")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-50">{t("p2p.new.review")}</button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            {[
              [t("p2p.new.to"), fullName],
              [t("p2p.new.methodLabel"), [t(`p2p.new.method.${method}`), provider].filter(Boolean).join(" · ")],
              [t("p2p.new.countryLabel"), country],
              ...(method === "cash_pickup" ? [[t("p2p.new.idNumber"), `${idLabel} ${idNumber}`]] : []),
              [t("p2p.new.youSend"), `${fmt(numAmt)} ${from}`],
              [t("p2p.new.fee"), `${fmt(fee)} ${from}`],
              [t("p2p.new.theyGet"), `${fmt(receives)} ${toCurrency || from}`],
              [t("p2p.new.total"), `${fmt(total)} ${from}`],
            ].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right">{v}</span></div>)}
          </div>
          <div className="text-[11px] text-muted-foreground">{t("p2p.new.memberNudge")}</div>
          <button disabled={busy} onClick={() => void confirm()} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60">
            {busy ? t("p2p.new.sending") : t("p2p.new.confirm")}
          </button>
        </div>
      )}

      {step === "success" && receipt && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-2 text-center">
            <div className="text-lg font-bold">{t("p2p.new.success")}</div>
            <div className="text-sm">{t("p2p.new.sentTo", { amount: `${fmt(receipt.receiveAmount)} ${receipt.toCurrency}`, name: receipt.receiverName })}</div>
            <span className={cn("inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_STYLE[receipt.payoutStatus])}>{t(`p2p.new.status.${receipt.payoutStatus}`)}</span>
            <div className="text-[11px] text-muted-foreground font-mono">{receipt.reference}</div>
          </div>
          {receipt.pickupCode && (
            <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
              <div className={label}>{t("p2p.new.pickupCode")}</div>
              <div className="text-3xl font-mono font-bold tracking-widest">{receipt.pickupCode}</div>
              <button onClick={() => { void navigator.clipboard?.writeText(receipt.pickupCode ?? ""); toast.success(t("p2p.new.copied")); }} className="text-[11px] text-primary font-semibold cursor-pointer inline-flex items-center gap-1"><Copy size={11} />{t("p2p.new.copy")}</button>
              <p className="text-xs text-muted-foreground">{t("p2p.new.pickupHelp", { name: receipt.receiverName, idType: idLabel, idNumber })}</p>
            </div>
          )}
          <button onClick={onExit} className="w-full py-3 rounded-xl bg-secondary border border-border text-sm font-semibold cursor-pointer">{t("p2p.new.another")}</button>
        </div>
      )}
    </div>
  );
}
