// Static mid-market reference rates (per 1 USD) — this is a demo app with no
// live market-data feed, so rates are fixed rather than fetched, but kept
// consistent with the fictional figures already shown elsewhere (admin
// dashboard, p2p page).
export const RATES_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  XAF: 601,
  XOF: 601,
  CDF: 2870,
  AOA: 830,
  AED: 3.67,
  CNY: 7.2,
  NGN: 1550,
  GHS: 15.3,
  RWF: 1300,
  ZAR: 18.4,
  ETB: 118,
  GBP: 0.78,
  CAD: 1.36,
  KES: 129,
};

/** Applied whenever a transaction converts between two different currencies. */
export const FX_MARGIN_RATE = 0.1;

/** Charged on every transfer/payment, in the transaction's own currency. */
export const COMMISSION_RATE = 0.035;

function rateFor(currency: string): number {
  return RATES_PER_USD[currency] ?? 1;
}

/** Mid-market conversion, no margin — the reference rate before PayRus's cut. */
export function midMarketConvert(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  return (amount / rateFor(from)) * rateFor(to);
}

/**
 * Customer-facing conversion: applies the FX margin whenever the two
 * currencies differ ("multicurrency transaction"). Same-currency transfers
 * pay no FX margin at all, only the flat commission.
 */
export function convertWithMargin(amount: number, from: string, to: string): { converted: number; fxMargin: number } {
  if (from === to) return { converted: amount, fxMargin: 0 };
  const midMarket = midMarketConvert(amount, from, to);
  const converted = midMarket * (1 - FX_MARGIN_RATE);
  return { converted, fxMargin: midMarket - converted };
}

export function commissionFor(amount: number): number {
  return amount * COMMISSION_RATE;
}

/** Cosmetic-turned-real fee rates per top-up method, mirrored from the
 * method list already shown in src/pages/wallet/page.tsx so the UI and the
 * mutation that actually moves money agree on the same numbers. */
export const DEPOSIT_FEE_RATES: Record<string, number> = {
  bank: 0,
  agent: 0.01,
  crypto: 0.005,
  card: 0.025,
  mobile: 0.015,
  apple_pay: 0.01,
  google_pay: 0.01,
};

export function depositFeeFor(method: string | undefined, amount: number): number {
  return amount * (DEPOSIT_FEE_RATES[method ?? "bank"] ?? 0);
}
