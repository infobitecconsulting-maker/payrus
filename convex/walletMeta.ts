// Currency -> wallet branding lookup, shared by convex/financialData.ts
// (starter wallet provisioning) and convex/wallets.ts (deposit/convert
// creating a wallet in a currency a user doesn't hold yet) so both paths
// pick branding through the same table instead of duplicating it.

export const WALLET_TEMPLATES = [
  { provider: "Orange Money", currency: "XAF", flag: "🍊", colorClass: "bg-orange-50 border-orange-200 text-orange-700" },
  { provider: "MTN MoMo", currency: "XAF", flag: "🟡", colorClass: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  { provider: "Unitel Money", currency: "AOA", flag: "🇦🇴", colorClass: "bg-red-50 border-red-200 text-red-700" },
  { provider: "Wave", currency: "XOF", flag: "🌊", colorClass: "bg-blue-50 border-blue-200 text-blue-700" },
  { provider: "Airtel Money", currency: "CDF", flag: "🔴", colorClass: "bg-rose-50 border-rose-200 text-rose-700" },
];

// Fallback branding for currencies fx.ts knows about but WALLET_TEMPLATES
// doesn't already cover.
const CURRENCY_META: Record<string, { provider: string; flag: string; colorClass: string }> = {
  USD: { provider: "PayRus USD Wallet", flag: "🇺🇸", colorClass: "bg-slate-50 border-slate-200 text-slate-700" },
  EUR: { provider: "PayRus EUR Wallet", flag: "🇪🇺", colorClass: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  GBP: { provider: "PayRus GBP Wallet", flag: "🇬🇧", colorClass: "bg-blue-50 border-blue-200 text-blue-700" },
  CNY: { provider: "PayRus CNY Wallet", flag: "🇨🇳", colorClass: "bg-red-50 border-red-200 text-red-700" },
  AED: { provider: "PayRus AED Wallet", flag: "🇦🇪", colorClass: "bg-amber-50 border-amber-200 text-amber-700" },
  NGN: { provider: "PayRus NGN Wallet", flag: "🇳🇬", colorClass: "bg-green-50 border-green-200 text-green-700" },
  GHS: { provider: "PayRus GHS Wallet", flag: "🇬🇭", colorClass: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  RWF: { provider: "PayRus RWF Wallet", flag: "🇷🇼", colorClass: "bg-blue-50 border-blue-200 text-blue-700" },
  ZAR: { provider: "PayRus ZAR Wallet", flag: "🇿🇦", colorClass: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  ETB: { provider: "PayRus ETB Wallet", flag: "🇪🇹", colorClass: "bg-lime-50 border-lime-200 text-lime-700" },
  CAD: { provider: "PayRus CAD Wallet", flag: "🇨🇦", colorClass: "bg-red-50 border-red-200 text-red-700" },
  KES: { provider: "PayRus KES Wallet", flag: "🇰🇪", colorClass: "bg-green-50 border-green-200 text-green-700" },
};

const GENERIC_FALLBACK = { provider: "PayRus Wallet", flag: "💱", colorClass: "bg-gray-50 border-gray-200 text-gray-700" };

export function metadataForCurrency(currency: string): { provider: string; flag: string; colorClass: string } {
  const template = WALLET_TEMPLATES.find((w) => w.currency === currency);
  if (template) return { provider: template.provider, flag: template.flag, colorClass: template.colorClass };
  return CURRENCY_META[currency] ?? GENERIC_FALLBACK;
}
