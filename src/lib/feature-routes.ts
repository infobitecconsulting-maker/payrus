// Which page belongs to which switchable feature (public.profile_features, edited from the App's and the
// console's Access tabs). The menu already hides a switched-off feature; AppLayout uses this map to block the
// page itself too, so a direct link or bookmark cannot bypass the switch. admin_panel is not listed: the
// administration page enforces its own staff checks.
const FEATURE_ROUTES: Record<string, string> = {
  savings: "savings", p2p: "p2p", games: "games", travel: "travel", shop: "shop", fundraise: "fundraise", invest: "invest",
  groups: "groups", pos: "pos", "payment-links": "payment_links", payouts: "payouts", treasury: "treasury_hub",
  gov: "gov_hub", "api-hub": "api_hub", "register-customer": "register_customer",
  modules: "modules", plans: "plans", organisation: "organisation",
};

/** "/en/travel/anything" -> "travel"; undefined for pages that are not behind a feature switch. */
export function featureForPath(pathname: string): string | undefined {
  const segment = pathname.split("/").filter(Boolean)[1];
  return segment ? FEATURE_ROUTES[segment] : undefined;
}
