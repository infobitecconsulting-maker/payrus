// Copy ported verbatim from project/PayRus Landing.dc.html (renderVals())
// in the Claude Design handoff bundle.

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "How it works", href: "#rails" },
  { label: "Who it is for", href: "#roles" },
  { label: "Corridors", href: "#corridors" },
  { label: "Sign in", href: "#signin" },
];

export const ctaLabel = "Open an account";
export const ctaSecondary = "Talk to sales";
export const ctaNote = "No card needed to start · Tier 1 in four minutes";

export const dateline = "Europe pilot · March 2026";
export const edition = "Integrated payment solutions & services";
export const publisher = "BITEC Europe Digital";

export const heroTitle =
  "One account for Europe, Africa and all over the world.";
export const heroBody =
  "PayRus holds euros and dollars side by side, then pays out on the rail that actually reaches the recipient — GIMAC, M-Pesa, SEPA, card or an agent counter. Personal, merchant, institution, NGO or savings group: one login, the workspaces your role is licensed for.";

export interface HeroFact {
  figure: string;
  label: string;
}

export const heroFacts: HeroFact[] = [
  {
    figure: "5",
    label: "currencies held side by side — EUR, USD, XAF, CDF, AOA",
  },
  {
    figure: "8",
    label: "account roles, each with its own workspaces and limits",
  },
  {
    figure: "4",
    label: "interface languages: English, French, Portuguese, Spanish",
  },
];

export const heroPhoto = {
  src: "https://commons.wikimedia.org/wiki/Special:FilePath/M-PESA_mobile_money_and_Equity_agent,_Nairobi,_Kenya.jpg?width=2000",
  alt: "A mobile money and bank agent storefront in Nairobi, Kenya",
  credit: "Fiona Graham / WorldRemit · CC BY-SA 2.0",
  creditHref:
    "https://commons.wikimedia.org/wiki/File:M-PESA_mobile_money_and_Equity_agent,_Nairobi,_Kenya.jpg",
};
export const photoCaption =
  "A mobile money and bank agent storefront in Nairobi — printed as its four misregistered process plates. Hover to resolve the plates back into the photograph.";

export const lastMileTitle = "Where an account is not the answer, a person is.";
export const lastMileBody =
  "Most of the money PayRus moves ends its journey off the internet — at a counter, a market stall, a phone with no bank behind it. The agent network is how the last mile closes, and the reason a Libreville float variance shows up in a treasury console the same morning.";

export interface LastMilePoint {
  text: string;
}

export const lastMilePoints: LastMilePoint[] = [
  { text: "Cash-in and cash-out at agent counters across four markets" },
  {
    text: "Float reconciled daily, with variances raised to treasury automatically",
  },
  {
    text: "QR and mobile money for traders who take payment without a terminal",
  },
];
export const lastMilePhoto = {
  src: "https://commons.wikimedia.org/wiki/Special:FilePath/G%C3%A9rant_de_kiosque_Mobile_Money.jpg?width=1400",
  alt: "A Mobile Money kiosk operator in Cameroon",
  credit: "Serieminou · CC BY-SA 4.0",
  creditHref:
    "https://commons.wikimedia.org/wiki/File:G%C3%A9rant_de_kiosque_Mobile_Money.jpg",
};

export const railsTitle =
  "The rail matters more than the app. So we carry all of them.";

export interface Rail {
  kicker: string;
  title: string;
  body: string;
}

export const rails: Rail[] = [
  {
    kicker: "Mobile money",
    title: "M-Pesa and mobile wallets",
    body: "Kinshasa payouts land in dollars over M-Pesa USD — the dollar is the trading reference on every channel there, while CDF stays the official currency on the books.",
  },
  {
    kicker: "Regional",
    title: "GIMAC across CEMAC",
    body: "Instant transfers inside the franc zone at the fixed 655,957 peg, so a Douala or Libreville recipient sees the same figure you quoted.",
  },
  {
    kicker: "Europe",
    title: "SEPA, same day",
    body: "Euro collections and payouts clear on the 14:00 cut-off, which is why the pilot runs from Europe and settles into a EUR pocket.",
  },
  {
    kicker: "Last mile",
    title: "Cards and agent counters",
    body: "Virtual and physical cards for online and travel spend, plus an agent network for cash-in and cash-out where an account is not the answer.",
  },
];

export const rolesTitle =
  "Eight roles. Each sees only what it is licensed for.";
export const rolesBody =
  "A profile is not a label — it changes which screens exist. A group treasurer never sees a POS keypad; an institution's disbursement will not move without a second signature.";
export const rolesCols: [string, string, string] = [
  "Role",
  "What it opens",
  "Status",
];

export interface RoleRow {
  name: string;
  does: string;
  badge: string;
  cls: "tag-live" | "tag-pilot" | "tag-open";
}

export const roles: RoleRow[] = [
  {
    name: "Personal",
    does: "Hold euros and dollars, send home, pay bills, spend on card",
    badge: "Live",
    cls: "tag-live",
  },
  {
    name: "Merchant",
    does: "POS keypad, QR, payment links, T+1 settlement",
    badge: "Live",
    cls: "tag-live",
  },
  {
    name: "Agent",
    does: "Cash-in, cash-out, float reconciliation across networks",
    badge: "Live",
    cls: "tag-live",
  },
  {
    name: "Treasury",
    does: "Corridor reporting, exposure, payout batches",
    badge: "Live",
    cls: "tag-live",
  },
  {
    name: "Public institution",
    does: "Collections and mandated disbursements, two signatures each",
    badge: "Pilot",
    cls: "tag-pilot",
  },
  {
    name: "NGO / civil society",
    does: "Donor grants ring-fenced per code, beneficiary payouts, audit export",
    badge: "Pilot",
    cls: "tag-pilot",
  },
  {
    name: "Group",
    does: "Shared pot, member contributions, rotating payouts",
    badge: "Pilot",
    cls: "tag-pilot",
  },
  {
    name: "Other",
    does: "Wallet and transfers while we confirm your activity",
    badge: "Open",
    cls: "tag-open",
  },
];

export interface Corridor {
  code: string;
  tag: string;
  note: string;
}

export const corridors: Corridor[] = [
  {
    code: "EUR",
    tag: "Home",
    note: "The pilot's home currency. Balances, fees and reporting resolve here.",
  },
  {
    code: "USD",
    tag: "Trading ref.",
    note: "Accepted on every channel in DR Congo, and the second funded pocket.",
  },
  {
    code: "XAF",
    tag: "Fixed peg",
    note: "655,957 to the euro — CEMAC quotes are exact, not indicative.",
  },
  {
    code: "CDF",
    tag: "Official",
    note: "DR Congo's official currency, held alongside the dollar it trades in.",
  },
  {
    code: "AOA",
    tag: "Indicative",
    note: "Angola, settling same day into bank and IBAN destinations.",
  },
];

export const closeTitle = "The Europe pilot is taking accounts now.";
export const closeBody =
  "Tell us which role you need and we will open the matching workspaces. Institutions, NGOs and groups go through a short onboarding call first — the two-signature and grant-code controls are configured per organisation.";
export const signupLabel = "Work or personal email";
export const signupPlaceholder = "you@example.eu";
export const signupCta = ctaLabel;
export const signupNote = "We reply within one business day.";
export const signupMailto = "accounts@payrus.eu";

export const footerLeft =
  "PayRus — integrated payment solutions & services, by BITEC Europe Digital.";
export const footerRight = "English · Français · Português · Español";
export const footerCredit =
  "Photographs from Wikimedia Commons under CC BY-SA — Fiona Graham / WorldRemit (Nairobi) and Serieminou (Cameroon). Replace before commercial launch.";
